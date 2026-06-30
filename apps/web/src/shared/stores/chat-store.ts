import { create } from 'zustand';
import { CopilotConversation, CopilotMessage } from '@/features/chat/domain/entities/chat';
import { FirestoreChatRepository } from '@/features/chat/data/repositories/firestore-chat-repository';
import { GeminiCopilot, CopilotContextAssembler } from '@/features/chat/data/services/gemini-copilot';
import { useIntelligenceStore } from './intelligence-store';
import { usePlannerStore } from './planner-store';
import { useExecutionStore } from './execution-store';
import { useTimelineStore } from './timeline-store';
import { useTaskStore } from './task-store';
import { useMissionStore } from './mission-store';
import { useAuthStore } from './auth-store';

interface ChatStoreState {
  conversations: CopilotConversation[];
  activeConversation: CopilotConversation | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  suggestedActions: string[];

  subscribeToConversations: (missionId: string) => (() => void) | undefined;
  sendMessage: (missionId: string, content: string, fileData?: { mimeType: string; base64: string }) => Promise<void>;
  setSearchQuery: (query: string) => void;
  togglePinMessage: (missionId: string, messageId: string) => Promise<void>;
  addReaction: (missionId: string, messageId: string, emoji: string) => Promise<void>;
  exportConversation: (format: 'txt' | 'json') => string;
}

const chatRepo = new FirestoreChatRepository();
const geminiCopilot = new GeminiCopilot();

export const useChatStore = create<ChatStoreState>((set, get) => {
  return {
    conversations: [],
    activeConversation: null,
    loading: false,
    error: null,
    searchQuery: '',
    suggestedActions: [
      'Summarize uploaded files',
      'What should I do today?',
      'Find active blockers',
      'Explain dependencies',
    ],

    subscribeToConversations: (missionId): (() => void) | undefined => {
      const user = useAuthStore.getState().user;
      if (!user) return undefined;

      const unsubscribe = chatRepo.subscribeConversations(user.uid, missionId, (list) => {
        set({ conversations: list });
        if (list.length > 0) {
          // Default to the first conversation or keep active if still exists
          const currentActive = get().activeConversation;
          const matched = list.find((c) => c.id === currentActive?.id) || list[0];
          set({ activeConversation: matched });
        } else {
          // Initialize a conversation if none exists
          const initConv: CopilotConversation = {
            id: crypto.randomUUID(),
            missionId,
            title: 'Mission Copilot Briefing',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set({ activeConversation: initConv, conversations: [initConv] });
        }
      });

      return (): void => {
        unsubscribe();
      };
    },

    sendMessage: async (missionId, content, fileData): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('No active user session.');

      let activeConv = get().activeConversation;
      if (!activeConv) {
        activeConv = {
          id: crypto.randomUUID(),
          missionId,
          title: 'Mission Copilot Briefing',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      const userMsg: CopilotMessage = {
        id: crypto.randomUUID(),
        conversationId: activeConv.id,
        role: 'user',
        content,
        timestamp: new Date(),
      };

      const assistantMsgId = crypto.randomUUID();
      const assistantMsg: CopilotMessage = {
        id: assistantMsgId,
        conversationId: activeConv.id,
        role: 'assistant',
        content: '',
        status: 'thinking',
        timestamp: new Date(),
      };

      const updatedMessages = [...activeConv.messages, userMsg, assistantMsg];
      const updatedConv: CopilotConversation = {
        ...activeConv,
        messages: updatedMessages,
        updatedAt: new Date(),
      };

      set({ activeConversation: updatedConv, loading: true, error: null });

      try {
        // Automatically assemble intelligence context
        const mission = useMissionStore.getState().currentMission;
        const profile = useIntelligenceStore.getState().profile;
        const roadmap = usePlannerStore.getState().roadmap;
        const graph = useExecutionStore.getState().graph;
        const timeline = useTimelineStore.getState().timeline;
        const tasks = useTaskStore.getState().tasks;

        const systemInstruction = CopilotContextAssembler.assembleSystemInstruction(
          mission?.title || 'Unknown',
          mission?.goal || 'Unknown',
          JSON.stringify(profile || {}),
          JSON.stringify(roadmap || {}),
          JSON.stringify(graph || {}),
          JSON.stringify(timeline || {}),
          tasks.length,
        );

        // Stream assistant response chunks
        const finalContent = await geminiCopilot.getResponseStream(
          content,
          activeConv.messages,
          systemInstruction,
          (chunk) => {
            set((state) => {
              if (!state.activeConversation) return {};
              const msgs = state.activeConversation.messages.map((m) => {
                if (m.id === assistantMsgId) {
                  return { ...m, content: chunk, status: 'generating' as const };
                }
                return m;
              });
              return {
                activeConversation: { ...state.activeConversation, messages: msgs },
              };
            });
          },
          fileData?.mimeType,
          fileData?.base64,
        );

        // Finalize conversation state
        const finalizedMsg: CopilotMessage = {
          ...assistantMsg,
          content: finalContent,
          status: 'completed',
          timestamp: new Date(),
        };

        const finalMessages = [...activeConv.messages, userMsg, finalizedMsg];
        const finalConv: CopilotConversation = {
          ...activeConv,
          messages: finalMessages,
          updatedAt: new Date(),
        };

        set({ activeConversation: finalConv, loading: false });
        await chatRepo.saveConversation(user.uid, missionId, finalConv);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Copilot failed to respond';
        set((state) => {
          if (!state.activeConversation) return {};
          const msgs = state.activeConversation.messages.map((m) => {
            if (m.id === assistantMsgId) {
              return { ...m, status: 'error' as const, content: `Error: ${msg}` };
            }
            return m;
          });
          return {
            activeConversation: { ...state.activeConversation, messages: msgs },
            loading: false,
            error: msg,
          };
        });
        throw err;
      }
    },

    setSearchQuery: (query): void => {
      set({ searchQuery: query });
    },

    togglePinMessage: async (missionId, messageId): Promise<void> => {
      const user = useAuthStore.getState().user;
      const activeConv = get().activeConversation;
      if (!user || !activeConv) return;

      const msgs = activeConv.messages.map((m) => {
        if (m.id === messageId) {
          return { ...m, isPinned: !m.isPinned };
        }
        return m;
      });

      const updated: CopilotConversation = {
        ...activeConv,
        messages: msgs,
        updatedAt: new Date(),
      };

      set({ activeConversation: updated });
      await chatRepo.saveConversation(user.uid, missionId, updated);
    },

    addReaction: async (missionId, messageId, emoji): Promise<void> => {
      const user = useAuthStore.getState().user;
      const activeConv = get().activeConversation;
      if (!user || !activeConv) return;

      const msgs = activeConv.messages.map((m) => {
        if (m.id === messageId) {
          const list = m.reactions || [];
          const updatedReactions = list.includes(emoji)
            ? list.filter((r) => r !== emoji)
            : [...list, emoji];
          return { ...m, reactions: updatedReactions };
        }
        return m;
      });

      const updated: CopilotConversation = {
        ...activeConv,
        messages: msgs,
        updatedAt: new Date(),
      };

      set({ activeConversation: updated });
      await chatRepo.saveConversation(user.uid, missionId, updated);
    },

    exportConversation: (format): string => {
      const activeConv = get().activeConversation;
      if (!activeConv) return '';

      if (format === 'json') {
        return JSON.stringify(activeConv, null, 2);
      }

      return activeConv.messages
        .map((m) => `[${m.timestamp.toISOString()}] ${m.role.toUpperCase()}:\n${m.content}\n`)
        .join('\n');
    },
  };
});
export default useChatStore;

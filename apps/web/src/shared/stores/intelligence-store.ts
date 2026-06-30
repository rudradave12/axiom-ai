import { create } from 'zustand';
import { MissionProfile } from '@/features/intelligence/domain/entities/intelligence';
import { FirestoreIntelligenceRepository } from '@/features/intelligence/data/repositories/firestore-intelligence-repository';
import { GeminiClient } from '@/features/intelligence/data/services/gemini-client';
import { useFileStore } from './file-store';
import { useKnowledgeStore } from './knowledge-store';
import { useAuthStore } from './auth-store';

interface IntelligenceStoreState {
  profile: MissionProfile | null;
  loading: boolean;
  error: string | null;

  subscribeToProfile: (missionId: string) => (() => void) | undefined;
  triggerAIAnalysis: (missionId: string, title: string, goal: string, batch?: import('firebase/firestore').WriteBatch) => Promise<void>;
}

const intelligenceRepo = new FirestoreIntelligenceRepository();
const geminiClient = new GeminiClient();

export const useIntelligenceStore = create<IntelligenceStoreState>((set) => {
  return {
    profile: null,
    loading: false,
    error: null,

    subscribeToProfile: (missionId): (() => void) | undefined => {
      const user = useAuthStore.getState().user;
      if (!user) return undefined;

      const loadLocal = (): void => {
        if (typeof window !== 'undefined') {
          const local = localStorage.getItem(`axiom_profile_${missionId}`);
          if (local) {
            try {
              set({ profile: JSON.parse(local) });
            } catch (_) {
              // Ignore local storage parsing failures
            }
          }
        }
      };

      const unsubscribe = intelligenceRepo.subscribeProfile(user.uid, missionId, (p) => {
        if (p) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`axiom_profile_${missionId}`, JSON.stringify(p));
          }
          set({ profile: p });
        } else {
          loadLocal();
        }
      });

      return (): void => {
        unsubscribe();
      };
    },

    triggerAIAnalysis: async (missionId, title, goal, batch): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('No active user session.');

      set({ loading: true, error: null });

      try {
        // Collect current files and knowledge from stores
        const filesList = useFileStore.getState().files.map((f) => ({
          name: f.name,
          size: f.size,
        }));
        const knowledgeList = useKnowledgeStore.getState().concepts.map((c) => ({
          label: c.label,
          category: c.category,
        }));

        const resultProfile = await geminiClient.analyzeMission(
          missionId,
          title,
          goal,
          filesList,
          knowledgeList,
        );

        try {
          await intelligenceRepo.saveProfile(user.uid, missionId, resultProfile, batch);
        } catch (dbErr) {
          console.warn('Firestore saveProfile failed, saving locally:', dbErr);
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem(`axiom_profile_${missionId}`, JSON.stringify(resultProfile));
        }

        set({ loading: false, profile: resultProfile });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'AI analysis failed';
        set({ error: msg, loading: false });
        throw err;
      }
    },
  };
});
export default useIntelligenceStore;

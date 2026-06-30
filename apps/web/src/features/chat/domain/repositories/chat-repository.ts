import { CopilotConversation } from '../entities/chat';

export interface ChatRepository {
  getConversations(userId: string, missionId: string): Promise<CopilotConversation[]>;
  saveConversation(userId: string, missionId: string, conversation: CopilotConversation): Promise<void>;
  subscribeConversations(userId: string, missionId: string, callback: (conversations: CopilotConversation[]) => void): () => void;
}

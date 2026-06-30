import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { ChatRepository } from '../../domain/repositories/chat-repository';
import { CopilotConversation, CopilotMessage } from '../../domain/entities/chat';
import { sanitizeFirestorePayload } from '../../../../shared/lib/firestore-utils';

interface FirestoreMessageDoc {
  id?: string;
  conversationId?: string;
  role?: string;
  content?: string;
  status?: string;
  isPinned?: boolean;
  reactions?: string[];
  timestamp?: Timestamp;
}

interface FirestoreConversationDoc {
  id?: string;
  missionId?: string;
  title?: string;
  messages?: FirestoreMessageDoc[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export class FirestoreChatRepository implements ChatRepository {
  private mapDocToConversation(docData: unknown): CopilotConversation {
    const data = (docData || {}) as FirestoreConversationDoc;
    return {
      id: data.id || crypto.randomUUID(),
      missionId: data.missionId || '',
      title: data.title || 'Copilot Briefing',
      messages: (data.messages || []).map((m): CopilotMessage => ({
        id: m.id || crypto.randomUUID(),
        conversationId: m.conversationId || '',
        role: (m.role || 'assistant') as 'user' | 'assistant',
        content: m.content || '',
        status: (m.status || 'completed') as 'thinking' | 'generating' | 'completed' | 'error',
        isPinned: m.isPinned || false,
        reactions: m.reactions || [],
        timestamp: m.timestamp instanceof Timestamp ? m.timestamp.toDate() : new Date(),
      })),
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    };
  }

  public async getConversations(userId: string, missionId: string): Promise<CopilotConversation[]> {
    const collRef = collection(db, 'users', userId, 'missions', missionId, 'conversations');
    const snap = await getDocs(collRef);
    return snap.docs.map((doc) => this.mapDocToConversation(doc.data()));
  }

  public async saveConversation(userId: string, missionId: string, conversation: CopilotConversation): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'conversations', conversation.id);
    const payload = {
      id: conversation.id,
      missionId: conversation.missionId,
      title: conversation.title,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        status: m.status,
        isPinned: m.isPinned,
        reactions: m.reactions,
        timestamp: Timestamp.fromDate(m.timestamp),
      })),
      createdAt: Timestamp.fromDate(conversation.createdAt),
      updatedAt: Timestamp.fromDate(conversation.updatedAt),
    };
    await setDoc(docRef, sanitizeFirestorePayload(payload) as Record<string, unknown>);
  }

  public subscribeConversations(
    userId: string,
    missionId: string,
    callback: (conversations: CopilotConversation[]) => void,
  ): () => void {
    const collRef = collection(db, 'users', userId, 'missions', missionId, 'conversations');
    return onSnapshot(
      collRef,
      (snap) => {
        const list = snap.docs.map((doc) => this.mapDocToConversation(doc.data()));
        callback(list);
      },
      (error) => {
        console.warn('Firestore subscribeConversations failed, calling fallback:', error);
        callback([]);
      }
    );
  }
}
export default FirestoreChatRepository;

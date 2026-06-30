import { describe, it, expect, vi } from 'vitest';
import { FirestoreChatRepository } from './firestore-chat-repository';

// Mock Firestore SDK
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    docs: [
      {
        data: (): Record<string, unknown> => ({
          id: 'conversation-111',
          missionId: 'mission-xyz',
          title: 'Mission Copilot Briefing',
          messages: [
            {
              id: 'msg-222',
              conversationId: 'conversation-111',
              role: 'user',
              content: 'What should I do today?',
              status: 'completed',
              isPinned: false,
              reactions: ['👍'],
              timestamp: { toDate: (): Date => new Date() },
            },
          ],
          createdAt: { toDate: (): Date => new Date() },
          updatedAt: { toDate: (): Date => new Date() },
        }),
      },
    ],
  }),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: class Timestamp {
    public static fromDate(d: Date): Timestamp {
      return new Timestamp(d);
    }
    public static now(): Timestamp {
      return new Timestamp(new Date());
    }
    private d: Date;
    constructor(d: Date) {
      this.d = d;
    }
    public toDate(): Date {
      return this.d;
    }
  },
}));

vi.mock('@/shared/lib/firebase', () => ({
  db: {},
}));

describe('FirestoreChatRepository', () => {
  it('should fetch and map Firestore chat conversations list cleanly', async () => {
    const repository = new FirestoreChatRepository();
    const conversations = await repository.getConversations('user-abc', 'mission-xyz');

    expect(conversations.length).toBe(1);
    expect(conversations[0].title).toBe('Mission Copilot Briefing');
    expect(conversations[0].messages[0].content).toBe('What should I do today?');
    expect(conversations[0].messages[0].reactions?.[0]).toBe('👍');
  });
});

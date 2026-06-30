import { describe, it, expect, vi } from 'vitest';
import { FirestoreKnowledgeRepository } from './firestore-knowledge-repository';
import { KnowledgeDepth } from '../../domain/entities/knowledge';

// Mock Firestore SDK
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    docs: [
      {
        id: 'concept-123',
        data: (): Record<string, unknown> => ({
          label: 'Soil Acidification',
          description: 'A decrease in soil pH levels',
          confidence: 85,
          sourceFileIds: ['file-abc'],
          relatedConceptIds: [],
          parentConceptId: null,
          depth: 'MODERATE',
          createdAt: { toDate: (): Date => new Date() },
          lastEngagedAt: null,
          isDeleted: false,
          tags: ['agriculture', 'soil'],
          category: 'Process',
        }),
      },
    ],
  }),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
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

describe('FirestoreKnowledgeRepository', () => {
  it('should fetch and map Firestore knowledge concept documents cleanly', async () => {
    const repository = new FirestoreKnowledgeRepository();
    const list = await repository.getConcepts('user-789', 'mission-890');

    expect(list.length).toBe(1);
    expect(list[0].id).toBe('concept-123');
    expect(list[0].label).toBe('Soil Acidification');
    expect(list[0].depth).toBe('MODERATE' as KnowledgeDepth);
    expect(list[0].category).toBe('Process');
  });
});

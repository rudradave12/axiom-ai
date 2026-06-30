import { describe, it, expect, vi } from 'vitest';
import { FirestoreExecutionRepository } from './firestore-execution-repository';

// Mock Firestore SDK
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: (): boolean => true,
    id: 'executionGraph',
    data: (): Record<string, unknown> => ({
      nodes: [
        {
          id: 'node-111',
          phaseId: 'phase-111',
          title: 'Initial stage node',
          description: 'Step desc',
          estimatedMinutes: 90,
          type: 'checkpoint',
        },
      ],
      dependencies: [],
      criticalPathNodeIds: ['node-111'],
      parallelGroupNodeIds: [],
      blockedNodeIds: [],
      completionCriteria: ['100% green build check'],
      executionConfidence: 95,
      updatedAt: { toDate: (): Date => new Date() },
    }),
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

describe('FirestoreExecutionRepository', () => {
  it('should fetch and map Firestore intelligence graph documents cleanly', async () => {
    const repository = new FirestoreExecutionRepository();
    const graph = await repository.getGraph('user-abc', 'mission-xyz');

    expect(graph).not.toBeNull();
    expect(graph?.nodes[0].title).toBe('Initial stage node');
    expect(graph?.nodes[0].estimatedMinutes).toBe(90);
    expect(graph?.criticalPathNodeIds[0]).toBe('node-111');
    expect(graph?.executionConfidence).toBe(95);
  });
});

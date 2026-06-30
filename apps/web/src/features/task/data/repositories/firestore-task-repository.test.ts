import { describe, it, expect, vi } from 'vitest';
import { FirestoreTaskRepository } from './firestore-task-repository';

// Mock Firestore SDK
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    docs: [
      {
        data: (): Record<string, unknown> => ({
          id: 'task-111',
          missionId: 'mission-xyz',
          phaseId: 'phase-111',
          title: 'Initial stage task',
          description: 'Task desc',
          priority: 'critical',
          status: 'todo',
          estimatedMinutes: 45,
          dependencyIds: [],
          timelineCheckpointId: 'checkpoint-111',
          knowledgeReferenceIds: ['concept-111'],
          evidenceReferencePlaceholder: 'log_check',
          updatedAt: { toDate: (): Date => new Date() },
          version: 1,
        }),
      },
    ],
  }),
  setDoc: vi.fn(),
  writeBatch: vi.fn().mockReturnValue({
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  }),
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

describe('FirestoreTaskRepository', () => {
  it('should fetch and map Firestore intelligence task list cleanly', async () => {
    const repository = new FirestoreTaskRepository();
    const tasks = await repository.getTasks('user-abc', 'mission-xyz');

    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Initial stage task');
    expect(tasks[0].priority).toBe('critical');
    expect(tasks[0].status).toBe('todo');
    expect(tasks[0].version).toBe(1);
  });
});

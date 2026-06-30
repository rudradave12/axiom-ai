import { describe, it, expect, vi } from 'vitest';
import { FirestoreTimelineRepository } from './firestore-timeline-repository';

// Mock Firestore SDK
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: (): boolean => true,
    id: 'timeline',
    data: (): Record<string, unknown> => ({
      phases: [
        {
          id: 'phase-111',
          title: 'Initial stage phase',
          description: 'Phase desc',
          order: 1,
          startDate: { toDate: (): Date => new Date() },
          endDate: { toDate: (): Date => new Date() },
          estimatedDuration: '2 weeks',
        },
      ],
      checkpoints: [
        {
          id: 'cp-222',
          phaseId: 'phase-111',
          title: 'Scheduled Gate',
          description: 'Description of gate',
          targetDate: { toDate: (): Date => new Date() },
          type: 'gate',
        },
      ],
      dependencies: [],
      criticalWindow: {
        startDate: { toDate: (): Date => new Date() },
        endDate: { toDate: (): Date => new Date() },
      },
      parallelWindow: {
        startDate: { toDate: (): Date => new Date() },
        endDate: { toDate: (): Date => new Date() },
      },
      estimatedCompletion: { toDate: (): Date => new Date() },
      schedulingConfidence: 95,
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

describe('FirestoreTimelineRepository', () => {
  it('should fetch and map Firestore intelligence timeline documents cleanly', async () => {
    const repository = new FirestoreTimelineRepository();
    const timeline = await repository.getTimeline('user-abc', 'mission-xyz');

    expect(timeline).not.toBeNull();
    expect(timeline?.phases[0].title).toBe('Initial stage phase');
    expect(timeline?.checkpoints[0].type).toBe('gate');
    expect(timeline?.schedulingConfidence).toBe(95);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { FirestorePlannerRepository } from './firestore-planner-repository';

// Mock Firestore SDK
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: (): boolean => true,
    id: 'roadmap',
    data: (): Record<string, unknown> => ({
      phases: [
        {
          id: 'phase-111',
          title: 'Initial stage',
          description: 'Baseline setup description',
          order: 1,
          milestoneIds: ['mil-222'],
          objectiveIds: [],
          estimatedDuration: '2 weeks',
          estimatedEffort: 'Low',
        },
      ],
      milestones: [
        {
          id: 'mil-222',
          title: 'Validated setup',
          description: 'Compiles cleanly',
          successCriteria: 'Run build command',
        },
      ],
      dependencies: [],
      requiredResources: ['Vertex AI API Key'],
      prerequisites: [],
      riskSummary: 'None identified',
      successCriteria: [
        {
          id: 'suc-333',
          metric: 'Compilation check',
          target: '100% green check',
        },
      ],
      plannerConfidence: 95,
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

describe('FirestorePlannerRepository', () => {
  it('should fetch and map Firestore intelligence roadmap documents cleanly', async () => {
    const repository = new FirestorePlannerRepository();
    const roadmap = await repository.getRoadmap('user-abc', 'mission-xyz');

    expect(roadmap).not.toBeNull();
    expect(roadmap?.phases[0].title).toBe('Initial stage');
    expect(roadmap?.milestones[0].title).toBe('Validated setup');
    expect(roadmap?.successCriteria[0].metric).toBe('Compilation check');
    expect(roadmap?.plannerConfidence).toBe(95);
  });
});

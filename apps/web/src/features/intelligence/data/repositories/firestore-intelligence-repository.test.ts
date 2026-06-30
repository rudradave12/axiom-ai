import { describe, it, expect, vi } from 'vitest';
import { FirestoreIntelligenceRepository } from './firestore-intelligence-repository';

// Mock Firestore SDK
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: (): boolean => true,
    id: 'profile',
    data: (): Record<string, unknown> => ({
      missionType: 'EXAM_PREP',
      domain: 'Education',
      complexity: 'HIGH',
      estimatedDuration: '4 weeks',
      objectives: [
        {
          id: 'obj-abc',
          title: 'Master limits',
          description: 'Practice limit questions',
          priority: 'HIGH',
        },
      ],
      constraints: [
        {
          id: 'con-111',
          description: 'Exam is next Thursday',
          type: 'TIME',
        },
      ],
      requiredInputs: ['Syllabus'],
      missingInformation: [],
      riskLevel: 'LOW',
      aiConfidence: 95,
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

describe('FirestoreIntelligenceRepository', () => {
  it('should fetch and map Firestore intelligence profile documents cleanly', async () => {
    const repository = new FirestoreIntelligenceRepository();
    const profile = await repository.getProfile('user-abc', 'mission-xyz');

    expect(profile).not.toBeNull();
    expect(profile?.missionType).toBe('EXAM_PREP');
    expect(profile?.domain).toBe('Education');
    expect(profile?.complexity).toBe('HIGH');
    expect(profile?.objectives[0].title).toBe('Master limits');
    expect(profile?.constraints[0].type).toBe('TIME');
  });
});

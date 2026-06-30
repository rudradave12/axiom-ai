import { describe, it, expect, vi } from 'vitest';
import { FirestoreMissionRepository } from './firestore-mission-repository';
import { GoalType, MissionStatus } from '../../domain/entities/mission';

// Mock Firestore SDK
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    docs: [
      {
        id: 'mission-123',
        data: (): Record<string, unknown> => ({
          goal: 'Learn Rust in 3 months',
          goalType: 'SKILL_LEARNING',
          title: 'Rust Target Path',
          activeModules: ['TASKS'],
          status: 'ACTIVE',
          deadline: null,
          createdAt: { toDate: (): Date => new Date() },
          lastAccessedAt: { toDate: (): Date => new Date() },
          completedAt: null,
          health: { composite: 100, pulse: 'steady' },
          briefing: { available: false, changes: [] },
          isDeleted: false,
          version: 1,
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

describe('FirestoreMissionRepository', () => {
  it('should fetch and map Firestore mission documents cleanly', async () => {
    const repository = new FirestoreMissionRepository();
    const list = await repository.getMissions('user-456');

    expect(list.length).toBe(1);
    expect(list[0].id).toBe('mission-123');
    expect(list[0].goalType).toBe('SKILL_LEARNING' as GoalType);
    expect(list[0].status).toBe('ACTIVE' as MissionStatus);
    expect(list[0].title).toBe('Rust Target Path');
  });
});

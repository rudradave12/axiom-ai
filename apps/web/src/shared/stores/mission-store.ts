import { create } from 'zustand';
import { Mission, GoalType, MissionStatus } from '@/features/mission/domain/entities/mission';
import { FirestoreMissionRepository } from '@/features/mission/data/repositories/firestore-mission-repository';
import { useAuthStore } from './auth-store';

interface MissionStoreState {
  missions: Mission[];
  currentMission: Mission | null;
  draftGoal: string;
  draftType: GoalType;
  loading: boolean;
  error: string | null;

  initializeMissions: () => (() => void) | undefined;
  setDraftGoal: (goal: string) => void;
  setDraftType: (type: GoalType) => void;
  clearDraft: () => void;
  createMissionFromDraft: (details: {
    title: string;
    deadline: Date | null;
    activeModules?: string[];
  }, batch?: import('firebase/firestore').WriteBatch) => Promise<Mission>;
  selectMission: (userId: string, id: string) => Promise<void>;
  softDeleteMission: (id: string) => Promise<void>;
  permanentlyDeleteMission: (id: string) => Promise<void>;
}

const missionRepo = new FirestoreMissionRepository();
const DRAFT_GOAL_KEY = 'axiom_draft_goal';
const DRAFT_TYPE_KEY = 'axiom_draft_type';

export const useMissionStore = create<MissionStoreState>((set, get) => {
  return {
    missions: [],
    currentMission: null,
    draftGoal: typeof window !== 'undefined' ? localStorage.getItem(DRAFT_GOAL_KEY) || '' : '',
    draftType: (typeof window !== 'undefined'
      ? (localStorage.getItem(DRAFT_TYPE_KEY) as GoalType) || 'CUSTOM'
      : 'CUSTOM') as GoalType,
    loading: false,
    error: null,

    initializeMissions: (): (() => void) | undefined => {
      const user = useAuthStore.getState().user;
      if (!user) return undefined;

      set({ loading: true });
      const loadLocal = (): void => {
        if (typeof window !== 'undefined') {
          const local = localStorage.getItem(`axiom_missions_${user.uid}`);
          if (local) {
            try {
              set({ missions: JSON.parse(local), loading: false });
            } catch (_) {
              // Ignore local storage parsing failures
            }
          } else {
            set({ loading: false });
          }
        } else {
          set({ loading: false });
        }
      };

      try {
        const unsubscribe = missionRepo.subscribeMissions(user.uid, (missionsList) => {
          if (missionsList && missionsList.length > 0) {
            if (typeof window !== 'undefined') {
              localStorage.setItem(`axiom_missions_${user.uid}`, JSON.stringify(missionsList));
            }
            set({ missions: missionsList, loading: false });
          } else {
            loadLocal();
          }
        });

        return (): void => {
          unsubscribe();
        };
      } catch (err) {
        console.warn('Firestore subscribeMissions failed, loading local fallback:', err);
        loadLocal();
        return (): void => {};
      }
    },

    setDraftGoal: (goal: string): void => {
      set({ draftGoal: goal });
      if (typeof window !== 'undefined') {
        localStorage.setItem(DRAFT_GOAL_KEY, goal);
      }
    },

    setDraftType: (type: GoalType): void => {
      set({ draftType: type });
      if (typeof window !== 'undefined') {
        localStorage.setItem(DRAFT_TYPE_KEY, type);
      }
    },

    clearDraft: (): void => {
      set({ draftGoal: '', draftType: 'CUSTOM' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem(DRAFT_GOAL_KEY);
        localStorage.removeItem(DRAFT_TYPE_KEY);
      }
    },

    createMissionFromDraft: async (details, batch): Promise<Mission> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('No authenticated user session found.');

      const { draftGoal, draftType } = get();
      if (!draftGoal.trim()) throw new Error('Goal content cannot be empty.');

      const missionId = crypto.randomUUID();
      const newMission: Mission = {
        id: missionId,
        userId: user.uid,
        goal: draftGoal,
        goalType: draftType,
        title: details.title.trim() || 'New Mission',
        activeModules: details.activeModules || [],
        status: 'ACTIVE' as MissionStatus,
        deadline: details.deadline,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        completedAt: null,
        health: {
          momentum: 100,
          knowledgeDepth: 100,
          scheduleIntegrity: 100,
          completeness: 0,
          riskExposure: 0,
          infoSufficiency: 100,
          composite: 100,
          pulse: 'steady',
          lastCalculatedAt: new Date(),
        },
        briefing: {
          available: false,
          generatedAt: null,
          changes: [],
          dismissed: false,
        },
        isDeleted: false,
        deletedAt: null,
        version: 1,
      };

      set({ loading: true, error: null });
      try {
        try {
          await missionRepo.createMission(newMission, batch);
        } catch (dbErr) {
          console.warn('Firestore createMission failed, storing locally:', dbErr);
        }

        const currentMissions = get().missions;
        const updatedMissions = [newMission, ...currentMissions];
        if (typeof window !== 'undefined') {
          localStorage.setItem(`axiom_missions_${user.uid}`, JSON.stringify(updatedMissions));
        }

        get().clearDraft();
        set({ currentMission: newMission, missions: updatedMissions, loading: false, error: null });
        return newMission;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create mission';
        set({ error: msg, loading: false });
        throw err;
      }
    },

    selectMission: async (userId, id): Promise<void> => {
      set({ loading: true, error: null });

      // 1. Check current missions state list first (instant memory hit)
      const stateMatch = get().missions.find((m) => m.id === id);
      if (stateMatch) {
        set({ currentMission: stateMatch, loading: false });
        // Still fetch asynchronously to update lastAccessedAt and check for changes
        missionRepo.getMission(userId, id).then((mission) => {
          if (mission) {
            missionRepo.updateMission(userId, id, { lastAccessedAt: new Date() }).catch(() => { /* ignore */ });
            set({ currentMission: mission });
          }
        }).catch(() => { /* ignore */ });
        return;
      }

      // 2. Fallback to LocalStorage (instant cache hit)
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem(`axiom_missions_${userId}`);
        if (local) {
          try {
            const list: Mission[] = JSON.parse(local);
            const found = list.find((m) => m.id === id);
            if (found) {
              set({ currentMission: found, loading: false });
              missionRepo.getMission(userId, id).then((mission) => {
                if (mission) {
                  missionRepo.updateMission(userId, id, { lastAccessedAt: new Date() }).catch(() => { /* ignore */ });
                  set({ currentMission: mission });
                }
              }).catch(() => { /* ignore */ });
              return;
            }
          } catch (_) {
            // Ignore parse errors
          }
        }
      }

      // 3. Fallback to Firestore network request
      try {
        const mission = await Promise.race([
          missionRepo.getMission(userId, id),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Network timeout fetching mission')), 8000))
        ]);
        if (mission) {
          try {
            await missionRepo.updateMission(userId, id, { lastAccessedAt: new Date() });
          } catch (_) {
            // Ignore database write failures for offline/guest modes
          }
          set({ currentMission: mission, loading: false });
          return;
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Mission not found';
        set({ error: errMsg, loading: false });
        throw err;
      }

      const errMsg = 'Mission not found';
      set({ error: errMsg, loading: false });
      throw new Error(errMsg);
    },

    softDeleteMission: async (id): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('No authenticated user session found.');

      set({ loading: true, error: null });
      try {
        await missionRepo.softDeleteMission(user.uid, id);
        
        const updatedMissions = get().missions.filter((m) => m.id !== id);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`axiom_missions_${user.uid}`, JSON.stringify(updatedMissions));
        }

        const { currentMission } = get();
        const nextCurrent = currentMission?.id === id ? null : currentMission;

        set({ currentMission: nextCurrent, missions: updatedMissions, loading: false });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete mission';
        set({ error: msg, loading: false });
        throw err;
      }
    },

    permanentlyDeleteMission: async (id): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('No authenticated user session found.');

      set({ loading: true, error: null });
      try {
        await missionRepo.deleteMissionDoc(user.uid, id);
        
        const updatedMissions = get().missions.filter((m) => m.id !== id);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`axiom_missions_${user.uid}`, JSON.stringify(updatedMissions));
        }

        const { currentMission } = get();
        const nextCurrent = currentMission?.id === id ? null : currentMission;

        set({ currentMission: nextCurrent, missions: updatedMissions, loading: false });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete mission permanently';
        set({ error: msg, loading: false });
        throw err;
      }
    },
  };
});
export default useMissionStore;

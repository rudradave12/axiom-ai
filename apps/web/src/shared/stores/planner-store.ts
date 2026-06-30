import { create } from 'zustand';
import { MissionRoadmap } from '@/features/planner/domain/entities/planner';
import { FirestorePlannerRepository } from '@/features/planner/data/repositories/firestore-planner-repository';
import { GeminiPlanner } from '@/features/planner/data/services/gemini-planner';
import { useIntelligenceStore } from './intelligence-store';
import { useAuthStore } from './auth-store';

interface PlannerStoreState {
  roadmap: MissionRoadmap | null;
  loading: boolean;
  error: string | null;

  subscribeToRoadmap: (missionId: string) => (() => void) | undefined;
  triggerAIRoadmap: (missionId: string, batch?: import('firebase/firestore').WriteBatch) => Promise<void>;
}

const plannerRepo = new FirestorePlannerRepository();
const geminiPlanner = new GeminiPlanner();

export const usePlannerStore = create<PlannerStoreState>((set) => {
  return {
    roadmap: null,
    loading: false,
    error: null,

    subscribeToRoadmap: (missionId): (() => void) | undefined => {
      const user = useAuthStore.getState().user;
      if (!user) return undefined;

      const loadLocal = (): void => {
        if (typeof window !== 'undefined') {
          const local = localStorage.getItem(`axiom_roadmap_${missionId}`);
          if (local) {
            try {
              set({ roadmap: JSON.parse(local) });
            } catch (_) {
              // Ignore local storage parsing failures
            }
          }
        }
      };

      const unsubscribe = plannerRepo.subscribeRoadmap(user.uid, missionId, (r) => {
        if (r) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`axiom_roadmap_${missionId}`, JSON.stringify(r));
          }
          set({ roadmap: r });
        } else {
          loadLocal();
        }
      });

      return (): void => {
        unsubscribe();
      };
    },

    triggerAIRoadmap: async (missionId, batch): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('No active user session.');

      const activeProfile = useIntelligenceStore.getState().profile;
      if (!activeProfile) {
        throw new Error('Mission Understanding Profile is required to generate the Roadmap. Run AI Analysis first.');
      }

      set({ loading: true, error: null });

      try {
        const profileJson = JSON.stringify(activeProfile);
        const resultRoadmap = await geminiPlanner.generateRoadmap(missionId, profileJson);

        try {
          await plannerRepo.saveRoadmap(user.uid, missionId, resultRoadmap, batch);
        } catch (dbErr) {
          console.warn('Firestore saveRoadmap failed, saving locally:', dbErr);
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem(`axiom_roadmap_${missionId}`, JSON.stringify(resultRoadmap));
        }

        set({ loading: false, roadmap: resultRoadmap });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'AI Roadmap generation failed';
        set({ error: msg, loading: false });
        throw err;
      }
    },
  };
});
export default usePlannerStore;

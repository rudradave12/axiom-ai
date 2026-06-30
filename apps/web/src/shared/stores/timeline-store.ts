import { create } from 'zustand';
import { MissionTimeline } from '@/features/timeline/domain/entities/timeline';
import { FirestoreTimelineRepository } from '@/features/timeline/data/repositories/firestore-timeline-repository';
import { GeminiTimeline } from '@/features/timeline/data/services/gemini-timeline';
import { useIntelligenceStore } from './intelligence-store';
import { usePlannerStore } from './planner-store';
import { useExecutionStore } from './execution-store';
import { useAuthStore } from './auth-store';

interface TimelineStoreState {
  timeline: MissionTimeline | null;
  loading: boolean;
  error: string | null;

  subscribeToTimeline: (missionId: string) => (() => void) | undefined;
  triggerAITimeline: (missionId: string, batch?: import('firebase/firestore').WriteBatch) => Promise<void>;
}

const timelineRepo = new FirestoreTimelineRepository();
const geminiTimeline = new GeminiTimeline();

export const useTimelineStore = create<TimelineStoreState>((set) => {
  return {
    timeline: null,
    loading: false,
    error: null,

    subscribeToTimeline: (missionId): (() => void) | undefined => {
      const user = useAuthStore.getState().user;
      if (!user) return undefined;

      const loadLocal = (): void => {
        if (typeof window !== 'undefined') {
          const local = localStorage.getItem(`axiom_timeline_${missionId}`);
          if (local) {
            try {
              set({ timeline: JSON.parse(local) });
            } catch (_) {
              // Ignore local storage parsing failures
            }
          }
        }
      };

      const unsubscribe = timelineRepo.subscribeTimeline(user.uid, missionId, (t) => {
        if (t) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`axiom_timeline_${missionId}`, JSON.stringify(t));
          }
          set({ timeline: t });
        } else {
          loadLocal();
        }
      });

      return (): void => {
        unsubscribe();
      };
    },

    triggerAITimeline: async (missionId, batch): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('No active user session.');

      const activeProfile = useIntelligenceStore.getState().profile;
      const activeRoadmap = usePlannerStore.getState().roadmap;
      const activeGraph = useExecutionStore.getState().graph;

      if (!activeProfile || !activeRoadmap || !activeGraph) {
        throw new Error('AI profile, roadmap, and execution graph are required to schedule the timeline.');
      }

      set({ loading: true, error: null });

      try {
        const profileJson = JSON.stringify(activeProfile);
        const roadmapJson = JSON.stringify(activeRoadmap);
        const graphJson = JSON.stringify(activeGraph);

        const resultTimeline = await geminiTimeline.generateTimeline(
          missionId,
          profileJson,
          roadmapJson,
          graphJson,
        );

        try {
          await timelineRepo.saveTimeline(user.uid, missionId, resultTimeline, batch);
        } catch (dbErr) {
          console.warn('Firestore saveTimeline failed, saving locally:', dbErr);
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem(`axiom_timeline_${missionId}`, JSON.stringify(resultTimeline));
        }

        set({ loading: false, timeline: resultTimeline });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'AI Timeline scheduling failed';
        set({ error: msg, loading: false });
        throw err;
      }
    },
  };
});
export default useTimelineStore;

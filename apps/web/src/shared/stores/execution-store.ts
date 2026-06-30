import { create } from 'zustand';
import { ExecutionGraph } from '@/features/execution/domain/entities/execution';
import { FirestoreExecutionRepository } from '@/features/execution/data/repositories/firestore-execution-repository';
import { GeminiExecution } from '@/features/execution/data/services/gemini-execution';
import { useIntelligenceStore } from './intelligence-store';
import { usePlannerStore } from './planner-store';
import { useAuthStore } from './auth-store';

interface ExecutionStoreState {
  graph: ExecutionGraph | null;
  loading: boolean;
  error: string | null;

  subscribeToGraph: (missionId: string) => (() => void) | undefined;
  triggerAIGraph: (missionId: string, batch?: import('firebase/firestore').WriteBatch) => Promise<void>;
}

const executionRepo = new FirestoreExecutionRepository();
const geminiExecution = new GeminiExecution();

export const useExecutionStore = create<ExecutionStoreState>((set) => {
  return {
    graph: null,
    loading: false,
    error: null,

    subscribeToGraph: (missionId): (() => void) | undefined => {
      const user = useAuthStore.getState().user;
      if (!user) return undefined;

      const loadLocal = (): void => {
        if (typeof window !== 'undefined') {
          const local = localStorage.getItem(`axiom_graph_${missionId}`);
          if (local) {
            try {
              set({ graph: JSON.parse(local) });
            } catch (_) {
              // Ignore local storage parsing failures
            }
          }
        }
      };

      const unsubscribe = executionRepo.subscribeGraph(user.uid, missionId, (g) => {
        if (g) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`axiom_graph_${missionId}`, JSON.stringify(g));
          }
          set({ graph: g });
        } else {
          loadLocal();
        }
      });

      return (): void => {
        unsubscribe();
      };
    },

    triggerAIGraph: async (missionId, batch): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('No active user session.');

      const activeProfile = useIntelligenceStore.getState().profile;
      const activeRoadmap = usePlannerStore.getState().roadmap;

      if (!activeProfile || !activeRoadmap) {
        throw new Error('AI profile and roadmap are required to build the execution graph.');
      }

      set({ loading: true, error: null });

      try {
        const profileJson = JSON.stringify(activeProfile);
        const roadmapJson = JSON.stringify(activeRoadmap);
        const resultGraph = await geminiExecution.generateGraph(
          missionId,
          profileJson,
          roadmapJson,
        );

        try {
          await executionRepo.saveGraph(user.uid, missionId, resultGraph, batch);
        } catch (dbErr) {
          console.warn('Firestore saveGraph failed, saving locally:', dbErr);
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem(`axiom_graph_${missionId}`, JSON.stringify(resultGraph));
        }

        set({ loading: false, graph: resultGraph });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'AI Execution Graph generation failed';
        set({ error: msg, loading: false });
        throw err;
      }
    },
  };
});
export default useExecutionStore;

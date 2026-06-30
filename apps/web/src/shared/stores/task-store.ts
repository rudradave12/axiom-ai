import { create } from 'zustand';
import { MissionTask, TaskHistory } from '@/features/task/domain/entities/task';
import { FirestoreTaskRepository } from '@/features/task/data/repositories/firestore-task-repository';
import { GeminiTask } from '@/features/task/data/services/gemini-task';
import { useIntelligenceStore } from './intelligence-store';
import { usePlannerStore } from './planner-store';
import { useExecutionStore } from './execution-store';
import { useTimelineStore } from './timeline-store';
import { useAuthStore } from './auth-store';

interface TaskStoreState {
  tasks: MissionTask[];
  loading: boolean;
  error: string | null;
  historyStack: TaskHistory[];

  subscribeToTasks: (missionId: string) => (() => void) | undefined;
  triggerAITasks: (missionId: string, batch?: import('firebase/firestore').WriteBatch) => Promise<void>;
  updateTaskStatus: (
    missionId: string,
    taskId: string,
    status: MissionTask['status'],
    details?: string,
  ) => Promise<void>;
  duplicateTask: (missionId: string, task: MissionTask) => Promise<void>;
  deleteTaskItem: (missionId: string, taskId: string) => Promise<void>;
  undoLastAction: (missionId: string) => Promise<void>;
}

const taskRepo = new FirestoreTaskRepository();
const geminiTask = new GeminiTask();

export const useTaskStore = create<TaskStoreState>((set, get) => {
  return {
    tasks: [],
    loading: false,
    error: null,
    historyStack: [],

    subscribeToTasks: (missionId): (() => void) | undefined => {
      const user = useAuthStore.getState().user;
      if (!user) return undefined;

      const loadLocal = (): void => {
        if (typeof window !== 'undefined') {
          const local = localStorage.getItem(`axiom_tasks_${missionId}`);
          if (local) {
            try {
              set({ tasks: JSON.parse(local) });
            } catch (_) {
              // Ignore local storage parsing failures
            }
          }
        }
      };

      const unsubscribe = taskRepo.subscribeTasks(user.uid, missionId, (tList) => {
        if (tList && tList.length > 0) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`axiom_tasks_${missionId}`, JSON.stringify(tList));
          }
          set({ tasks: tList });
        } else {
          loadLocal();
        }
      });

      return (): void => {
        unsubscribe();
      };
    },

    triggerAITasks: async (missionId, batch): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('No active user session.');

      const activeProfile = useIntelligenceStore.getState().profile;
      const activeRoadmap = usePlannerStore.getState().roadmap;
      const activeGraph = useExecutionStore.getState().graph;
      const activeTimeline = useTimelineStore.getState().timeline;

      if (!activeProfile || !activeRoadmap || !activeGraph || !activeTimeline) {
        throw new Error('AI profile, roadmap, execution graph, and timeline are required to compile executable tasks.');
      }

      set({ loading: true, error: null });

      try {
        const profileJson = JSON.stringify(activeProfile);
        const roadmapJson = JSON.stringify(activeRoadmap);
        const graphJson = JSON.stringify(activeGraph);
        const timelineJson = JSON.stringify(activeTimeline);

        const resultTasks = await geminiTask.generateTasks(
          missionId,
          profileJson,
          roadmapJson,
          graphJson,
          timelineJson,
        );

        try {
          await taskRepo.saveTasksBulk(user.uid, missionId, resultTasks, batch);
        } catch (dbErr) {
          console.warn('Firestore saveTasksBulk failed, saving locally:', dbErr);
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem(`axiom_tasks_${missionId}`, JSON.stringify(resultTasks));
        }

        set({ loading: false, tasks: resultTasks });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'AI Task generation failed';
        set({ error: msg, loading: false });
        throw err;
      }
    },

    updateTaskStatus: async (missionId, taskId, status, details = ''): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const currentTasks = get().tasks;
      const task = currentTasks.find((t) => t.id === taskId);
      if (!task) return;

      // Save previous state for history/undo support
      const prevStatus = task.status;
      const historyEntry: TaskHistory = {
        id: crypto.randomUUID(),
        taskId,
        action: `STATUS_CHANGE:${prevStatus}->${status}`,
        timestamp: new Date(),
        details: details || `Changed status from ${prevStatus} to ${status}`,
      };

      const updatedTask: MissionTask = {
        ...task,
        status,
        updatedAt: new Date(),
        version: task.version + 1,
      };

      // Optimistic state updates
      set({
        tasks: currentTasks.map((t) => (t.id === taskId ? updatedTask : t)),
        historyStack: [...get().historyStack, historyEntry],
      });

      try {
        await taskRepo.saveTask(user.uid, missionId, updatedTask);
      } catch (err) {
        // Rollback state on error
        set({
          tasks: currentTasks,
          historyStack: get().historyStack.filter((h) => h.id !== historyEntry.id),
        });
        throw err;
      }
    },

    duplicateTask: async (missionId, task): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const duplicated: MissionTask = {
        ...task,
        id: crypto.randomUUID(),
        title: `${task.title} (Copy)`,
        status: 'todo',
        updatedAt: new Date(),
        version: 1,
      };

      const currentTasks = get().tasks;
      set({ tasks: [...currentTasks, duplicated] });

      try {
        await taskRepo.saveTask(user.uid, missionId, duplicated);
      } catch (err) {
        set({ tasks: currentTasks });
        throw err;
      }
    },

    deleteTaskItem: async (missionId, taskId): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const currentTasks = get().tasks;
      set({ tasks: currentTasks.filter((t) => t.id !== taskId) });

      try {
        await taskRepo.deleteTask(user.uid, missionId, taskId);
      } catch (err) {
        set({ tasks: currentTasks });
        throw err;
      }
    },

    undoLastAction: async (missionId): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const stack = get().historyStack;
      if (stack.length === 0) return;

      const lastHistory = stack[stack.length - 1];
      const remainingStack = stack.slice(0, -1);

      if (lastHistory.action.startsWith('STATUS_CHANGE:')) {
        const parts = lastHistory.action.substring(14).split('->');
        const originalStatus = parts[0] as MissionTask['status'];

        const task = get().tasks.find((t) => t.id === lastHistory.taskId);
        if (!task) return;

        const revertedTask: MissionTask = {
          ...task,
          status: originalStatus,
          updatedAt: new Date(),
          version: task.version + 1,
        };

        set({
          tasks: get().tasks.map((t) => (t.id === lastHistory.taskId ? revertedTask : t)),
          historyStack: remainingStack,
        });

        try {
          await taskRepo.saveTask(user.uid, missionId, revertedTask);
        } catch (err) {
          // Re-push history stack if update fails
          set({
            historyStack: stack,
          });
          throw err;
        }
      }
    },
  };
});
export default useTaskStore;

import { MissionTask } from '../entities/task';

export interface TaskRepository {
  getTasks(userId: string, missionId: string): Promise<MissionTask[]>;
  saveTask(userId: string, missionId: string, task: MissionTask): Promise<void>;
  saveTasksBulk(userId: string, missionId: string, tasks: MissionTask[], batch?: import('firebase/firestore').WriteBatch): Promise<void>;
  subscribeTasks(userId: string, missionId: string, callback: (tasks: MissionTask[]) => void): () => void;
  deleteTask(userId: string, missionId: string, taskId: string): Promise<void>;
}

import { ExecutionGraph } from '../entities/execution';

export interface ExecutionRepository {
  getGraph(userId: string, missionId: string): Promise<ExecutionGraph | null>;
  saveGraph(userId: string, missionId: string, graph: ExecutionGraph, batch?: import('firebase/firestore').WriteBatch): Promise<void>;
  subscribeGraph(userId: string, missionId: string, callback: (graph: ExecutionGraph | null) => void): () => void;
}

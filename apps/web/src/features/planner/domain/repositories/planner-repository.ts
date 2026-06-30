import { MissionRoadmap } from '../entities/planner';

export interface PlannerRepository {
  getRoadmap(userId: string, missionId: string): Promise<MissionRoadmap | null>;
  saveRoadmap(userId: string, missionId: string, roadmap: MissionRoadmap, batch?: import('firebase/firestore').WriteBatch): Promise<void>;
  subscribeRoadmap(userId: string, missionId: string, callback: (roadmap: MissionRoadmap | null) => void): () => void;
}

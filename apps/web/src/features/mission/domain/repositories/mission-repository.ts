import { Mission } from '../entities/mission';

export interface MissionRepository {
  getMissions(userId: string): Promise<Mission[]>;
  getMission(userId: string, missionId: string): Promise<Mission | null>;
  createMission(mission: Mission, batch?: import('firebase/firestore').WriteBatch): Promise<void>;
  updateMission(userId: string, missionId: string, updates: Partial<Mission>): Promise<void>;
  softDeleteMission(userId: string, missionId: string): Promise<void>;
  deleteMissionDoc(userId: string, missionId: string): Promise<void>;
  subscribeMissions(userId: string, callback: (missions: Mission[]) => void): () => void;
}

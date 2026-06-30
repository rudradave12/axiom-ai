import { MissionProfile } from '../entities/intelligence';

export interface IntelligenceRepository {
  getProfile(userId: string, missionId: string): Promise<MissionProfile | null>;
  saveProfile(userId: string, missionId: string, profile: MissionProfile, batch?: import('firebase/firestore').WriteBatch): Promise<void>;
  subscribeProfile(userId: string, missionId: string, callback: (profile: MissionProfile | null) => void): () => void;
}

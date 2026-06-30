import { MissionTimeline } from '../entities/timeline';

export interface TimelineRepository {
  getTimeline(userId: string, missionId: string): Promise<MissionTimeline | null>;
  saveTimeline(userId: string, missionId: string, timeline: MissionTimeline, batch?: import('firebase/firestore').WriteBatch): Promise<void>;
  subscribeTimeline(userId: string, missionId: string, callback: (timeline: MissionTimeline | null) => void): () => void;
}

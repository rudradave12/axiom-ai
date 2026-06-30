import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Timestamp,
  WriteBatch,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { TimelineRepository } from '../../domain/repositories/timeline-repository';
import {
  MissionTimeline,
  TimelinePhase,
  TimelineCheckpoint,
  TimelineDependency,
} from '../../domain/entities/timeline';

interface FirestoreTimelineDoc {
  phases?: Array<{
    id?: string;
    title?: string;
    description?: string;
    order?: number;
    startDate?: Timestamp;
    endDate?: Timestamp;
    estimatedDuration?: string;
  }>;
  checkpoints?: Array<{
    id?: string;
    phaseId?: string;
    title?: string;
    description?: string;
    targetDate?: Timestamp;
    type?: string;
  }>;
  dependencies?: Array<{
    fromCheckpointId?: string;
    toCheckpointId?: string;
    type?: string;
  }>;
  criticalWindow?: {
    startDate?: Timestamp;
    endDate?: Timestamp;
  };
  parallelWindow?: {
    startDate?: Timestamp;
    endDate?: Timestamp;
  };
  estimatedCompletion?: Timestamp;
  schedulingConfidence?: number;
  updatedAt?: Timestamp;
}

export class FirestoreTimelineRepository implements TimelineRepository {
  private mapDocToTimeline(missionId: string, docData: unknown): MissionTimeline {
    const data = (docData || {}) as FirestoreTimelineDoc;
    return {
      missionId,
      phases: (data.phases || []).map((p): TimelinePhase => ({
        id: p.id || crypto.randomUUID(),
        title: p.title || '',
        description: p.description || '',
        order: p.order ?? 0,
        startDate: p.startDate instanceof Timestamp ? p.startDate.toDate() : new Date(),
        endDate: p.endDate instanceof Timestamp ? p.endDate.toDate() : new Date(),
        estimatedDuration: p.estimatedDuration || 'TBD',
      })),
      checkpoints: (data.checkpoints || []).map((c): TimelineCheckpoint => ({
        id: c.id || crypto.randomUUID(),
        phaseId: c.phaseId || '',
        title: c.title || '',
        description: c.description || '',
        targetDate: c.targetDate instanceof Timestamp ? c.targetDate.toDate() : new Date(),
        type: (c.type || 'milestone') as 'milestone' | 'checkpoint' | 'gate',
      })),
      dependencies: (data.dependencies || []).map((d): TimelineDependency => ({
        fromCheckpointId: d.fromCheckpointId || '',
        toCheckpointId: d.toCheckpointId || '',
        type: (d.type || 'blocking') as 'blocking' | 'optional',
      })),
      criticalWindow: {
        startDate: data.criticalWindow?.startDate instanceof Timestamp ? data.criticalWindow.startDate.toDate() : new Date(),
        endDate: data.criticalWindow?.endDate instanceof Timestamp ? data.criticalWindow.endDate.toDate() : new Date(),
      },
      parallelWindow: {
        startDate: data.parallelWindow?.startDate instanceof Timestamp ? data.parallelWindow.startDate.toDate() : new Date(),
        endDate: data.parallelWindow?.endDate instanceof Timestamp ? data.parallelWindow.endDate.toDate() : new Date(),
      },
      estimatedCompletion: data.estimatedCompletion instanceof Timestamp ? data.estimatedCompletion.toDate() : new Date(),
      schedulingConfidence: data.schedulingConfidence ?? 100,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    };
  }

  public async getTimeline(userId: string, missionId: string): Promise<MissionTimeline | null> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'intelligence', 'timeline');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return this.mapDocToTimeline(missionId, snap.data());
  }

  public async saveTimeline(userId: string, missionId: string, timeline: MissionTimeline, batch?: WriteBatch): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'intelligence', 'timeline');
    const payload = {
      phases: timeline.phases.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        order: p.order,
        startDate: Timestamp.fromDate(p.startDate),
        endDate: Timestamp.fromDate(p.endDate),
        estimatedDuration: p.estimatedDuration,
      })),
      checkpoints: timeline.checkpoints.map((c) => ({
        id: c.id,
        phaseId: c.phaseId,
        title: c.title,
        description: c.description,
        targetDate: Timestamp.fromDate(c.targetDate),
        type: c.type,
      })),
      dependencies: timeline.dependencies,
      criticalWindow: {
        startDate: Timestamp.fromDate(timeline.criticalWindow.startDate),
        endDate: Timestamp.fromDate(timeline.criticalWindow.endDate),
      },
      parallelWindow: {
        startDate: Timestamp.fromDate(timeline.parallelWindow.startDate),
        endDate: Timestamp.fromDate(timeline.parallelWindow.endDate),
      },
      estimatedCompletion: Timestamp.fromDate(timeline.estimatedCompletion),
      schedulingConfidence: timeline.schedulingConfidence,
      updatedAt: Timestamp.fromDate(timeline.updatedAt),
    };
    if (batch) {
      batch.set(docRef, payload);
    } else {
      await setDoc(docRef, payload);
    }
  }

  public subscribeTimeline(
    userId: string,
    missionId: string,
    callback: (timeline: MissionTimeline | null) => void,
  ): () => void {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'intelligence', 'timeline');
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          callback(null);
        } else {
          callback(this.mapDocToTimeline(missionId, snap.data()));
        }
      },
      (error) => {
        console.warn('Firestore subscribeTimeline failed, calling fallback:', error);
        callback(null);
      }
    );
  }
}
export default FirestoreTimelineRepository;

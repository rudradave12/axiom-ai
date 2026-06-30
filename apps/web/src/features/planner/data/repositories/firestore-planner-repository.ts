import { sanitizeFirestorePayload } from '../../../../shared/lib/firestore-utils';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Timestamp,
  WriteBatch,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { PlannerRepository } from '../../domain/repositories/planner-repository';
import {
  MissionRoadmap,
  MissionPhase,
  MissionMilestone,
  MissionDependency,
  MissionSuccessCriteria,
} from '../../domain/entities/planner';

interface FirestoreRoadmapDoc {
  phases?: Array<{
    id?: string;
    title?: string;
    description?: string;
    order?: number;
    milestoneIds?: string[];
    objectiveIds?: string[];
    estimatedDuration?: string;
    estimatedEffort?: string;
  }>;
  milestones?: Array<{
    id?: string;
    title?: string;
    description?: string;
    successCriteria?: string;
  }>;
  dependencies?: Array<{
    fromPhaseId?: string;
    toPhaseId?: string;
    type?: string;
  }>;
  requiredResources?: string[];
  prerequisites?: string[];
  riskSummary?: string;
  successCriteria?: Array<{
    id?: string;
    metric?: string;
    target?: string;
  }>;
  plannerConfidence?: number;
  updatedAt?: Timestamp;
}

export class FirestorePlannerRepository implements PlannerRepository {
  private mapDocToRoadmap(missionId: string, docData: unknown): MissionRoadmap {
    const data = (docData || {}) as FirestoreRoadmapDoc;
    return {
      missionId,
      phases: (data.phases || []).map((p): MissionPhase => ({
        id: p.id || crypto.randomUUID(),
        title: p.title || '',
        description: p.description || '',
        order: p.order ?? 0,
        milestoneIds: p.milestoneIds || [],
        objectiveIds: p.objectiveIds || [],
        estimatedDuration: p.estimatedDuration || 'TBD',
        estimatedEffort: p.estimatedEffort || 'Medium',
      })),
      milestones: (data.milestones || []).map((m): MissionMilestone => ({
        id: m.id || crypto.randomUUID(),
        title: m.title || '',
        description: m.description || '',
        successCriteria: m.successCriteria || '',
      })),
      dependencies: (data.dependencies || []).map((d): MissionDependency => ({
        fromPhaseId: d.fromPhaseId || '',
        toPhaseId: d.toPhaseId || '',
        type: (d.type || 'blocking') as 'blocking' | 'parallel',
      })),
      requiredResources: data.requiredResources || [],
      prerequisites: data.prerequisites || [],
      riskSummary: data.riskSummary || '',
      successCriteria: (data.successCriteria || []).map((s): MissionSuccessCriteria => ({
        id: s.id || crypto.randomUUID(),
        metric: s.metric || '',
        target: s.target || '',
      })),
      plannerConfidence: data.plannerConfidence ?? 100,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    };
  }

  public async getRoadmap(userId: string, missionId: string): Promise<MissionRoadmap | null> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'intelligence', 'roadmap');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return this.mapDocToRoadmap(missionId, snap.data());
  }

  public async saveRoadmap(userId: string, missionId: string, roadmap: MissionRoadmap, batch?: WriteBatch): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'intelligence', 'roadmap');
    const payload = {
      phases: roadmap.phases,
      milestones: roadmap.milestones,
      dependencies: roadmap.dependencies,
      requiredResources: roadmap.requiredResources,
      prerequisites: roadmap.prerequisites,
      riskSummary: roadmap.riskSummary,
      successCriteria: roadmap.successCriteria,
      plannerConfidence: roadmap.plannerConfidence,
      updatedAt: Timestamp.fromDate(roadmap.updatedAt),
    };
    if (batch) {
      batch.set(docRef, sanitizeFirestorePayload(payload) as Record<string, unknown>);
    } else {
      await setDoc(docRef, sanitizeFirestorePayload(payload) as Record<string, unknown>);
    }
  }

  public subscribeRoadmap(
    userId: string,
    missionId: string,
    callback: (roadmap: MissionRoadmap | null) => void,
  ): () => void {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'intelligence', 'roadmap');
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          callback(null);
        } else {
          callback(this.mapDocToRoadmap(missionId, snap.data()));
        }
      },
      (error) => {
        console.warn('Firestore subscribeRoadmap failed, calling fallback:', error);
        callback(null);
      }
    );
  }
}
export default FirestorePlannerRepository;

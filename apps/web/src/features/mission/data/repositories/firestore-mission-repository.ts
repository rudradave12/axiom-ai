import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  WriteBatch,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { MissionRepository } from '../../domain/repositories/mission-repository';
import { Mission, GoalType, MissionStatus, PulseStatus } from '../../domain/entities/mission';

interface FirestoreMissionDoc {
  goal?: string;
  goalType?: string;
  title?: string;
  activeModules?: string[];
  status?: string;
  deadline?: Timestamp | null;
  createdAt?: Timestamp;
  lastAccessedAt?: Timestamp;
  completedAt?: Timestamp | null;
  health?: {
    momentum?: number;
    knowledgeDepth?: number;
    scheduleIntegrity?: number;
    completeness?: number;
    riskExposure?: number;
    infoSufficiency?: number;
    composite?: number;
    pulse?: string;
    lastCalculatedAt?: Timestamp;
  };
  briefing?: {
    available?: boolean;
    generatedAt?: Timestamp | null;
    changes?: { type: string; description: string }[];
    dismissed?: boolean;
  };
  isDeleted?: boolean;
  deletedAt?: Timestamp | null;
  version?: number;
}

export class FirestoreMissionRepository implements MissionRepository {
  private mapDocToMission(id: string, userId: string, docData: unknown): Mission {
    const data = (docData || {}) as FirestoreMissionDoc;
    return {
      id,
      userId,
      goal: data.goal || '',
      goalType: (data.goalType || 'CUSTOM') as GoalType,
      title: data.title || 'Untitled Mission',
      activeModules: data.activeModules || [],
      status: (data.status || 'BUILDING') as MissionStatus,
      deadline: data.deadline instanceof Timestamp ? data.deadline.toDate() : null,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      lastAccessedAt: data.lastAccessedAt instanceof Timestamp ? data.lastAccessedAt.toDate() : new Date(),
      completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate() : null,
      health: {
        momentum: data.health?.momentum || 100,
        knowledgeDepth: data.health?.knowledgeDepth || 100,
        scheduleIntegrity: data.health?.scheduleIntegrity || 100,
        completeness: data.health?.completeness || 0,
        riskExposure: data.health?.riskExposure || 0,
        infoSufficiency: data.health?.infoSufficiency || 100,
        composite: data.health?.composite || 100,
        pulse: (data.health?.pulse || 'steady') as PulseStatus,
        lastCalculatedAt: data.health?.lastCalculatedAt instanceof Timestamp
          ? data.health.lastCalculatedAt.toDate()
          : new Date(),
      },
      briefing: {
        available: data.briefing?.available ?? false,
        generatedAt: data.briefing?.generatedAt instanceof Timestamp ? data.briefing.generatedAt.toDate() : null,
        changes: data.briefing?.changes || [],
        dismissed: data.briefing?.dismissed ?? false,
      },
      isDeleted: data.isDeleted ?? false,
      deletedAt: data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : null,
      version: data.version || 1,
    };
  }

  public async getMissions(userId: string): Promise<Mission[]> {
    const colRef = collection(db, 'users', userId, 'missions');
    const q = query(colRef, where('isDeleted', '==', false));
    const snap = await getDocs(q);
    return snap.docs.map((d) => this.mapDocToMission(d.id, userId, d.data()));
  }

  public async getMission(userId: string, missionId: string): Promise<Mission | null> {
    const docRef = doc(db, 'users', userId, 'missions', missionId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return this.mapDocToMission(snap.id, userId, snap.data());
  }

  public async createMission(mission: Mission, batch?: WriteBatch): Promise<void> {
    const docRef = doc(db, 'users', mission.userId, 'missions', mission.id);
    const payload = {
      goal: mission.goal,
      goalType: mission.goalType,
      title: mission.title,
      activeModules: mission.activeModules,
      status: mission.status,
      deadline: mission.deadline ? Timestamp.fromDate(mission.deadline) : null,
      createdAt: Timestamp.fromDate(mission.createdAt),
      lastAccessedAt: Timestamp.fromDate(mission.lastAccessedAt),
      completedAt: mission.completedAt ? Timestamp.fromDate(mission.completedAt) : null,
      health: {
        momentum: mission.health.momentum,
        knowledgeDepth: mission.health.knowledgeDepth,
        scheduleIntegrity: mission.health.scheduleIntegrity,
        completeness: mission.health.completeness,
        riskExposure: mission.health.riskExposure,
        infoSufficiency: mission.health.infoSufficiency,
        composite: mission.health.composite,
        pulse: mission.health.pulse,
        lastCalculatedAt: Timestamp.fromDate(mission.health.lastCalculatedAt),
      },
      briefing: {
        available: mission.briefing.available,
        generatedAt: mission.briefing.generatedAt ? Timestamp.fromDate(mission.briefing.generatedAt) : null,
        changes: mission.briefing.changes,
        dismissed: mission.briefing.dismissed,
      },
      isDeleted: mission.isDeleted,
      deletedAt: mission.deletedAt ? Timestamp.fromDate(mission.deletedAt) : null,
      version: mission.version,
    };
    if (batch) {
      batch.set(docRef, payload);
    } else {
      await setDoc(docRef, payload);
    }
  }

  public async updateMission(userId: string, missionId: string, updates: Partial<Mission>): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId);
    const payload: Record<string, unknown> = {};

    if (updates.goal !== undefined) payload.goal = updates.goal;
    if (updates.goalType !== undefined) payload.goalType = updates.goalType;
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.activeModules !== undefined) payload.activeModules = updates.activeModules;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.deadline !== undefined) payload.deadline = updates.deadline ? Timestamp.fromDate(updates.deadline) : null;
    if (updates.lastAccessedAt !== undefined) payload.lastAccessedAt = Timestamp.fromDate(updates.lastAccessedAt);
    if (updates.completedAt !== undefined) payload.completedAt = updates.completedAt ? Timestamp.fromDate(updates.completedAt) : null;
    if (updates.version !== undefined) payload.version = updates.version;

    await updateDoc(docRef, payload);
  }

  public async softDeleteMission(userId: string, missionId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId);
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: Timestamp.now(),
    });
  }

  public async deleteMissionDoc(userId: string, missionId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId);
    await deleteDoc(docRef);
  }

  public subscribeMissions(userId: string, callback: (missions: Mission[]) => void): () => void {
    const colRef = collection(db, 'users', userId, 'missions');
    const q = query(colRef, where('isDeleted', '==', false));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => this.mapDocToMission(d.id, userId, d.data()));
        callback(list);
      },
      (error) => {
        console.error(`Firestore subscribeMissions error for UID ${userId}:`, error);
        callback([]); // Fallback to resolve loading state with empty list
      }
    );
  }
}
export default FirestoreMissionRepository;

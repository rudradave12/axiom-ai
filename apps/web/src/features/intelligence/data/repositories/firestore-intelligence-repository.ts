import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Timestamp,
  WriteBatch,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { IntelligenceRepository } from '../../domain/repositories/intelligence-repository';
import { MissionProfile, MissionObjective, MissionConstraint } from '../../domain/entities/intelligence';

interface FirestoreProfileDoc {
  missionType?: string;
  domain?: string;
  complexity?: string;
  estimatedDuration?: string;
  objectives?: Array<{
    id?: string;
    title?: string;
    description?: string;
    priority?: string;
  }>;
  constraints?: Array<{
    id?: string;
    description?: string;
    type?: string;
  }>;
  requiredInputs?: string[];
  missingInformation?: string[];
  riskLevel?: string;
  aiConfidence?: number;
  updatedAt?: Timestamp;
}

export class FirestoreIntelligenceRepository implements IntelligenceRepository {
  private mapDocToProfile(missionId: string, docData: unknown): MissionProfile {
    const data = (docData || {}) as FirestoreProfileDoc;
    return {
      missionId,
      missionType: data.missionType || 'General Task',
      domain: data.domain || 'Unclassified',
      complexity: (data.complexity || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      estimatedDuration: data.estimatedDuration || 'TBD',
      objectives: (data.objectives || []).map((o): MissionObjective => ({
        id: o.id || crypto.randomUUID(),
        title: o.title || '',
        description: o.description || '',
        priority: (o.priority || 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW',
      })),
      constraints: (data.constraints || []).map((c): MissionConstraint => ({
        id: c.id || crypto.randomUUID(),
        description: c.description || '',
        type: (c.type || 'OTHER') as 'TIME' | 'BUDGET' | 'RESOURCE' | 'TECHNICAL' | 'OTHER',
      })),
      requiredInputs: data.requiredInputs || [],
      missingInformation: data.missingInformation || [],
      riskLevel: (data.riskLevel || 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      aiConfidence: data.aiConfidence ?? 100,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    };
  }

  public async getProfile(userId: string, missionId: string): Promise<MissionProfile | null> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'intelligence', 'profile');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return this.mapDocToProfile(missionId, snap.data());
  }

  public async saveProfile(userId: string, missionId: string, profile: MissionProfile, batch?: WriteBatch): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'intelligence', 'profile');
    const payload = {
      missionType: profile.missionType,
      domain: profile.domain,
      complexity: profile.complexity,
      estimatedDuration: profile.estimatedDuration,
      objectives: profile.objectives,
      constraints: profile.constraints,
      requiredInputs: profile.requiredInputs,
      missingInformation: profile.missingInformation,
      riskLevel: profile.riskLevel,
      aiConfidence: profile.aiConfidence,
      updatedAt: Timestamp.fromDate(profile.updatedAt),
    };
    if (batch) {
      batch.set(docRef, payload);
    } else {
      await setDoc(docRef, payload);
    }
  }

  public subscribeProfile(
    userId: string,
    missionId: string,
    callback: (profile: MissionProfile | null) => void,
  ): () => void {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'intelligence', 'profile');
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          callback(null);
        } else {
          callback(this.mapDocToProfile(missionId, snap.data()));
        }
      },
      (error) => {
        console.warn('Firestore subscribeProfile failed, calling fallback:', error);
        callback(null);
      }
    );
  }
}
export default FirestoreIntelligenceRepository;

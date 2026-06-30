import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { ProfileRepository } from '../../domain/repositories/profile-repository';
import { UserProfile, UserPreferences } from '../../domain/entities/profile';

interface FirestoreProfileDoc {
  email?: string;
  displayName?: string | null;
  photoURL?: string | null;
  createdAt?: Timestamp;
  lastActiveAt?: Timestamp;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    dailyDigestTime?: string;
    autonomousImprovements?: boolean;
    timezone?: string;
  };
  stats?: {
    missionsCompleted?: number;
    missionsActive?: number;
    totalConcepts?: number;
  };
}

export class FirestoreProfileRepository implements ProfileRepository {
  private mapDocToProfile(uid: string, docData: unknown): UserProfile {
    const data = (docData || {}) as FirestoreProfileDoc;
    return {
      uid,
      email: data.email || '',
      displayName: data.displayName || null,
      photoURL: data.photoURL || null,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      lastActiveAt: data.lastActiveAt instanceof Timestamp ? data.lastActiveAt.toDate() : new Date(),
      preferences: {
        theme: data.preferences?.theme || 'system',
        language: data.preferences?.language || 'en',
        dailyDigestTime: data.preferences?.dailyDigestTime || '08:00',
        autonomousImprovements: data.preferences?.autonomousImprovements ?? true,
        timezone: data.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      stats: {
        missionsCompleted: data.stats?.missionsCompleted || 0,
        missionsActive: data.stats?.missionsActive || 0,
        totalConcepts: data.stats?.totalConcepts || 0,
      },
    };
  }

  public async getProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    return this.mapDocToProfile(uid, snap.data());
  }

  public async createProfile(profile: UserProfile): Promise<void> {
    const docRef = doc(db, 'users', profile.uid);
    const payload = {
      email: profile.email,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      createdAt: Timestamp.fromDate(profile.createdAt),
      lastActiveAt: Timestamp.fromDate(profile.lastActiveAt),
      preferences: profile.preferences,
      stats: profile.stats,
    };
    await setDoc(docRef, payload);
  }

  public async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, 'users', uid);
    const payload: Record<string, unknown> = {};
    if (updates.displayName !== undefined) payload.displayName = updates.displayName;
    if (updates.photoURL !== undefined) payload.photoURL = updates.photoURL;
    if (updates.lastActiveAt !== undefined) payload.lastActiveAt = Timestamp.fromDate(updates.lastActiveAt);
    if (updates.stats !== undefined) payload.stats = updates.stats;
    await updateDoc(docRef, payload);
  }

  public async updatePreferences(uid: string, preferences: Partial<UserPreferences>): Promise<void> {
    const docRef = doc(db, 'users', uid);
    const payload: Record<string, unknown> = {};
    Object.keys(preferences).forEach((key) => {
      payload[`preferences.${key}`] = (preferences as Record<string, unknown>)[key];
    });
    await updateDoc(docRef, payload);
  }

  public onProfileChanged(uid: string, callback: (profile: UserProfile | null) => void): () => void {
    const docRef = doc(db, 'users', uid);
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          callback(null);
        } else {
          callback(this.mapDocToProfile(uid, snap.data()));
        }
      },
      (error) => {
        console.error(`Firestore profile listener error for UID ${uid}:`, error);
        callback(null); // Resolve to null so store initialization resolves loading state
      }
    );
  }
}
export default FirestoreProfileRepository;

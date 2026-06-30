import { UserProfile, UserPreferences } from '../entities/profile';

export interface ProfileRepository {
  getProfile(uid: string): Promise<UserProfile | null>;
  createProfile(profile: UserProfile): Promise<void>;
  updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void>;
  updatePreferences(uid: string, preferences: Partial<UserPreferences>): Promise<void>;
  onProfileChanged(uid: string, callback: (profile: UserProfile | null) => void): () => void;
}

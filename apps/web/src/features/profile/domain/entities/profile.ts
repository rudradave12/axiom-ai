export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  dailyDigestTime: string;
  autonomousImprovements: boolean;
  timezone: string;
}

export interface MissionStats {
  missionsCompleted: number;
  missionsActive: number;
  totalConcepts: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastActiveAt: Date;
  preferences: UserPreferences;
  stats: MissionStats;
}

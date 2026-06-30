import { create } from 'zustand';
import { AxiomUser } from '@/features/auth/domain/entities/user';
import { UserProfile } from '@/features/profile/domain/entities/profile';
import { FirebaseAuthRepository } from '@/features/auth/data/repositories/firebase-auth-repository';
import { FirestoreProfileRepository } from '@/features/profile/data/repositories/firestore-profile-repository';

interface AuthState {
  user: AxiomUser | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  initializeAuth: () => () => void;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfileStats: (statsUpdates: Partial<UserProfile['stats']>) => Promise<void>;
}

const authRepo = new FirebaseAuthRepository();
const profileRepo = new FirestoreProfileRepository();

export const useAuthStore = create<AuthState>((set, get) => {
  let unsubscribeProfile: (() => void) | null = null;

  return {
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    error: null,

    initializeAuth: (): (() => void) => {
      const unsubscribeAuth = authRepo.onAuthStateChanged(async (axiomUser) => {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }

        if (!axiomUser) {
          set({ user: null, profile: null, loading: false, initialized: true });
          return;
        }

        set({ user: axiomUser, loading: true });

        // Setup Firestore profile listener for real-time synchronization
        unsubscribeProfile = profileRepo.onProfileChanged(axiomUser.uid, async (profileData) => {
          if (profileData) {
            set({ profile: profileData, loading: false, initialized: true });
          } else {
            // Profile does not exist yet (First Time Login / Guest session)
            const newProfile: UserProfile = {
              uid: axiomUser.uid,
              email: axiomUser.email || '',
              displayName: axiomUser.displayName,
              photoURL: axiomUser.photoURL,
              createdAt: axiomUser.createdAt,
              lastActiveAt: new Date(),
              preferences: {
                theme: 'system',
                language: 'en',
                dailyDigestTime: '08:00',
                autonomousImprovements: true,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              stats: {
                missionsCompleted: 0,
                missionsActive: 0,
                totalConcepts: 0,
              },
            };
            try {
              await profileRepo.createProfile(newProfile);
              set({ profile: newProfile, error: null, loading: false, initialized: true });
            } catch (err: unknown) {
              console.warn('Profile creation failed, running in local memory fallback mode:', err);
              const savedPrefs = typeof window !== 'undefined' ? localStorage.getItem('axiom_fallback_preferences') : null;
              if (savedPrefs) {
                try {
                  newProfile.preferences = JSON.parse(savedPrefs);
                } catch (_) {
                  // Fallback to default preferences if JSON parsing fails
                }
              }
              set({ profile: newProfile, error: null, loading: false, initialized: true });
            }
          }
        });
      });

      return (): void => {
        unsubscribeAuth();
        if (unsubscribeProfile) {
          unsubscribeProfile();
        }
      };
    },

    signInWithGoogle: async (): Promise<void> => {
      set({ loading: true, error: null });
      try {
        await authRepo.signInWithGoogle();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Google login failed';
        set({ error: msg, loading: false });
        throw err;
      }
    },

    signInAnonymously: async (): Promise<void> => {
      set({ loading: true, error: null });
      try {
        await authRepo.signInAnonymously();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Anonymous login failed';
        set({ error: msg, loading: false });
        throw err;
      }
    },

    signOut: async (): Promise<void> => {
      set({ loading: true, error: null });
      try {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        await authRepo.signOut();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Sign out failed';
        set({ error: msg, loading: false });
        throw err;
      }
    },

    deleteAccount: async (): Promise<void> => {
      set({ loading: true, error: null });
      try {
        const currentUser = get().user;
        if (currentUser) {
          if (unsubscribeProfile) {
            unsubscribeProfile();
            unsubscribeProfile = null;
          }
          await authRepo.deleteAccount();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Account deletion failed';
        set({ error: msg, loading: false });
        throw err;
      }
    },

    updateProfileStats: async (statsUpdates: Partial<UserProfile['stats']>): Promise<void> => {
      const { user, profile } = get();
      if (!user || !profile) return;
      const updatedStats = { ...profile.stats, ...statsUpdates };
      try {
        await profileRepo.updateProfile(user.uid, { stats: updatedStats });
        set({ profile: { ...profile, stats: updatedStats } });
      } catch (err) {
        console.error('Failed to sync profile stats:', err);
      }
    },
  };
});
export default useAuthStore;

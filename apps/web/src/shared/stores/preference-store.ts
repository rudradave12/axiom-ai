import { create } from 'zustand';
import { UserPreferences } from '@/features/profile/domain/entities/profile';
import { FirestoreProfileRepository } from '@/features/profile/data/repositories/firestore-profile-repository';
import { useAuthStore } from './auth-store';

interface PreferenceState {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;

  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
}

const profileRepo = new FirestoreProfileRepository();

export const usePreferenceStore = create<PreferenceState>((set, get) => {
  // Sync state on auth change
  useAuthStore.subscribe((authState) => {
    if (authState.profile) {
      set({ preferences: authState.profile.preferences });
    }
  });

  return {
    preferences: {
      theme: 'system',
      language: 'en',
      dailyDigestTime: '08:00',
      autonomousImprovements: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    loading: false,
    error: null,

    setTheme: async (theme: 'light' | 'dark' | 'system'): Promise<void> => {
      await get().updatePreferences({ theme });
    },

    setLanguage: async (language: string): Promise<void> => {
      await get().updatePreferences({ language });
    },

    updatePreferences: async (updates: Partial<UserPreferences>): Promise<void> => {
      set({ loading: true, error: null });
      // Optimistic local state update
      set((state) => ({
        preferences: { ...state.preferences, ...updates },
      }));

      try {
        const user = useAuthStore.getState().user;
        if (user) {
          await profileRepo.updatePreferences(user.uid, updates);
          
          // Sync changes back into authStore profile data
          const authState = useAuthStore.getState();
          if (authState.profile) {
            useAuthStore.setState({
              profile: {
                ...authState.profile,
                preferences: { ...authState.profile.preferences, ...updates }
              }
            });
          }
        }
      } catch (err: unknown) {
        console.warn('Preference update to Firestore failed, saving to localStorage:', err);
        if (typeof window !== 'undefined') {
          localStorage.setItem('axiom_fallback_preferences', JSON.stringify({ ...get().preferences, ...updates }));
        }
      } finally {
        set({ loading: false });
      }
    },
  };
});
export default usePreferenceStore;

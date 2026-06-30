import { create } from 'zustand';

interface OfflineState {
  isOnline: boolean;
  syncQueueLength: number;
  setOnlineStatus: (status: boolean) => void;
  incrementSyncQueue: () => void;
  decrementSyncQueue: () => void;
  clearSyncQueue: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncQueueLength: 0,

  setOnlineStatus: (status: boolean): void => {
    set({ isOnline: status });
  },
  incrementSyncQueue: (): void => {
    set((state) => ({ syncQueueLength: state.syncQueueLength + 1 }));
  },
  decrementSyncQueue: (): void => {
    set((state) => ({ syncQueueLength: Math.max(0, state.syncQueueLength - 1) }));
  },
  clearSyncQueue: (): void => {
    set({ syncQueueLength: 0 });
  },
}));

// Initialize window connection event listeners on client runtime
if (typeof window !== 'undefined') {
  window.addEventListener('online', (): void => {
    useOfflineStore.getState().setOnlineStatus(true);
  });
  window.addEventListener('offline', (): void => {
    useOfflineStore.getState().setOnlineStatus(false);
  });
}

export default useOfflineStore;

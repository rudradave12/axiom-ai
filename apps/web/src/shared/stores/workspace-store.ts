import { create } from 'zustand';
import { WorkspaceSettings } from '@/features/workspace/domain/entities/workspace';
import { LocalWorkspaceRepository } from '@/features/workspace/data/repositories/local-workspace-repository';

interface WorkspaceStoreState {
  settings: WorkspaceSettings | null;
  loading: boolean;

  loadWorkspaceSettings: (missionId: string) => Promise<void>;
  setActiveTab: (tab: string) => Promise<void>;
  setFilterQuery: (query: string) => Promise<void>;
  setSortBy: (sort: 'date' | 'priority' | 'name') => Promise<void>;
  toggleSidebar: () => Promise<void>;
}

const localRepo = new LocalWorkspaceRepository();

export const useWorkspaceStore = create<WorkspaceStoreState>((set, get) => {
  return {
    settings: null,
    loading: false,

    loadWorkspaceSettings: async (missionId): Promise<void> => {
      set({ loading: true });
      let current = await localRepo.getSettings(missionId);
      if (!current) {
        current = {
          missionId,
          activeTab: 'overview',
          sortBy: 'date',
          filterQuery: '',
          sidebarCollapsed: false,
          density: 'comfortable',
        };
        await localRepo.saveSettings(current);
      }
      set({ settings: current, loading: false });
    },

    setActiveTab: async (tab): Promise<void> => {
      const { settings } = get();
      if (!settings) return;
      const updated = { ...settings, activeTab: tab };
      set({ settings: updated });
      await localRepo.saveSettings(updated);
    },

    setFilterQuery: async (query): Promise<void> => {
      const { settings } = get();
      if (!settings) return;
      const updated = { ...settings, filterQuery: query };
      set({ settings: updated });
      await localRepo.saveSettings(updated);
    },

    setSortBy: async (sort): Promise<void> => {
      const { settings } = get();
      if (!settings) return;
      const updated = { ...settings, sortBy: sort };
      set({ settings: updated });
      await localRepo.saveSettings(updated);
    },

    toggleSidebar: async (): Promise<void> => {
      const { settings } = get();
      if (!settings) return;
      const updated = { ...settings, sidebarCollapsed: !settings.sidebarCollapsed };
      set({ settings: updated });
      await localRepo.saveSettings(updated);
    },
  };
});
export default useWorkspaceStore;

export interface WorkspaceSettings {
  missionId: string;
  activeTab: string;
  sortBy: 'date' | 'priority' | 'name';
  filterQuery: string;
  sidebarCollapsed: boolean;
  density: 'compact' | 'comfortable';
}

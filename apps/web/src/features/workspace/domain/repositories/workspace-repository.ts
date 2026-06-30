import { WorkspaceSettings } from '../entities/workspace';

export interface WorkspaceRepository {
  getSettings(missionId: string): Promise<WorkspaceSettings | null>;
  saveSettings(settings: WorkspaceSettings): Promise<void>;
}

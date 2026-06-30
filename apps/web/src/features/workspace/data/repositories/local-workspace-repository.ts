import { WorkspaceRepository } from '../../domain/repositories/workspace-repository';
import { WorkspaceSettings } from '../../domain/entities/workspace';

export class LocalWorkspaceRepository implements WorkspaceRepository {
  private getStorageKey(missionId: string): string {
    return `axiom_workspace_settings_${missionId}`;
  }

  public async getSettings(missionId: string): Promise<WorkspaceSettings | null> {
    if (typeof window === 'undefined') return null;
    const str = localStorage.getItem(this.getStorageKey(missionId));
    if (!str) return null;
    try {
      return JSON.parse(str) as WorkspaceSettings;
    } catch {
      return null;
    }
  }

  public async saveSettings(settings: WorkspaceSettings): Promise<void> {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.getStorageKey(settings.missionId), JSON.stringify(settings));
  }
}
export default LocalWorkspaceRepository;

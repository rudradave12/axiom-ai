import { describe, it, expect, beforeEach } from 'vitest';
import { LocalWorkspaceRepository } from './local-workspace-repository';
import { WorkspaceSettings } from '../../domain/entities/workspace';

// Define local mock for Node environment execution context
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string): string | null => store[key] || null,
  setItem: (key: string, value: string): void => {
    store[key] = value;
  },
  removeItem: (key: string): void => {
    delete store[key];
  },
  clear: (): void => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
};

global.window = {} as unknown as Window & typeof globalThis;
global.localStorage = mockLocalStorage as unknown as Storage;

describe('LocalWorkspaceRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and retrieve workspace settings cleanly', async () => {
    const repository = new LocalWorkspaceRepository();
    const settings: WorkspaceSettings = {
      missionId: 'mission-abc',
      activeTab: 'tasks',
      sortBy: 'priority',
      filterQuery: 'find-me',
      sidebarCollapsed: true,
      density: 'compact',
    };

    await repository.saveSettings(settings);
    const retrieved = await repository.getSettings('mission-abc');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.activeTab).toBe('tasks');
    expect(retrieved?.sortBy).toBe('priority');
    expect(retrieved?.filterQuery).toBe('find-me');
    expect(retrieved?.sidebarCollapsed).toBe(true);
  });
});

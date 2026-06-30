import { AxiomFile } from '../entities/file';

export interface FileRepository {
  getFiles(userId: string, missionId: string): Promise<AxiomFile[]>;
  getFile(userId: string, missionId: string, fileId: string): Promise<AxiomFile | null>;
  createFile(userId: string, missionId: string, file: AxiomFile): Promise<void>;
  updateFile(userId: string, missionId: string, fileId: string, updates: Partial<AxiomFile>): Promise<void>;
  softDeleteFile(userId: string, missionId: string, fileId: string): Promise<void>;
  subscribeFiles(userId: string, missionId: string, callback: (files: AxiomFile[]) => void): () => void;
}

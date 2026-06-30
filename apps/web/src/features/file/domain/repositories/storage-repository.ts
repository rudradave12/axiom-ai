export interface StorageRepository {
  uploadFile(
    userId: string,
    missionId: string,
    fileId: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<string>;
  deleteFile(storageUrl: string): Promise<void>;
}

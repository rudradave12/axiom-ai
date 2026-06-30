export type FileProcessingStatus =
  | 'UPLOADING'
  | 'SCANNING'
  | 'EXTRACTING'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FAILED'
  | 'REJECTED';

export interface AxiomFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  storageUrl: string;
  thumbnailUrl: string | null;
  processingStatus: FileProcessingStatus;
  extractedText: string | null;
  metadata: Record<string, string | number | boolean>;
  uploadedAt: Date;
  processedAt: Date | null;
  isDeleted: boolean;
}

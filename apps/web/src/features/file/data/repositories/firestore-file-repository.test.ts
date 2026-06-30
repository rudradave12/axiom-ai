import { describe, it, expect, vi } from 'vitest';
import { FirestoreFileRepository } from './firestore-file-repository';
import { FileProcessingStatus } from '../../domain/entities/file';

// Mock Firestore SDK
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    docs: [
      {
        id: 'file-xyz',
        data: (): Record<string, unknown> => ({
          name: 'report.pdf',
          mimeType: 'application/pdf',
          size: 1048576,
          storageUrl: 'https://storage/report.pdf',
          thumbnailUrl: null,
          processingStatus: 'PROCESSED',
          extractedText: null,
          metadata: { isFavorite: true },
          uploadedAt: { toDate: (): Date => new Date() },
          processedAt: { toDate: (): Date => new Date() },
          isDeleted: false,
        }),
      },
    ],
  }),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: class Timestamp {
    public static fromDate(d: Date): Timestamp {
      return new Timestamp(d);
    }
    public static now(): Timestamp {
      return new Timestamp(new Date());
    }
    private d: Date;
    constructor(d: Date) {
      this.d = d;
    }
    public toDate(): Date {
      return this.d;
    }
  },
}));

vi.mock('@/shared/lib/firebase', () => ({
  db: {},
}));

describe('FirestoreFileRepository', () => {
  it('should fetch and map Firestore file documents cleanly', async () => {
    const repository = new FirestoreFileRepository();
    const list = await repository.getFiles('user-111', 'mission-222');

    expect(list.length).toBe(1);
    expect(list[0].id).toBe('file-xyz');
    expect(list[0].name).toBe('report.pdf');
    expect(list[0].size).toBe(1048576);
    expect(list[0].processingStatus).toBe('PROCESSED' as FileProcessingStatus);
    expect(list[0].metadata.isFavorite).toBe(true);
  });
});

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { FileRepository } from '../../domain/repositories/file-repository';
import { AxiomFile, FileProcessingStatus } from '../../domain/entities/file';

interface FirestoreFileDoc {
  name?: string;
  mimeType?: string;
  size?: number;
  storageUrl?: string;
  thumbnailUrl?: string | null;
  processingStatus?: string;
  extractedText?: string | null;
  metadata?: Record<string, string | number | boolean>;
  uploadedAt?: Timestamp;
  processedAt?: Timestamp | null;
  isDeleted?: boolean;
}

export class FirestoreFileRepository implements FileRepository {
  private mapDocToFile(id: string, docData: unknown): AxiomFile {
    const data = (docData || {}) as FirestoreFileDoc;
    return {
      id,
      name: data.name || 'unnamed-file',
      mimeType: data.mimeType || 'application/octet-stream',
      size: data.size || 0,
      storageUrl: data.storageUrl || '',
      thumbnailUrl: data.thumbnailUrl || null,
      processingStatus: (data.processingStatus || 'UPLOADING') as FileProcessingStatus,
      extractedText: data.extractedText || null,
      metadata: data.metadata || {},
      uploadedAt: data.uploadedAt instanceof Timestamp ? data.uploadedAt.toDate() : new Date(),
      processedAt: data.processedAt instanceof Timestamp ? data.processedAt.toDate() : null,
      isDeleted: data.isDeleted ?? false,
    };
  }

  public async getFiles(userId: string, missionId: string): Promise<AxiomFile[]> {
    const colRef = collection(db, 'users', userId, 'missions', missionId, 'files');
    const q = query(colRef, where('isDeleted', '==', false));
    const snap = await getDocs(q);
    return snap.docs.map((d) => this.mapDocToFile(d.id, d.data()));
  }

  public async getFile(userId: string, missionId: string, fileId: string): Promise<AxiomFile | null> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'files', fileId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return this.mapDocToFile(snap.id, snap.data());
  }

  public async createFile(userId: string, missionId: string, file: AxiomFile): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'files', file.id);
    const payload = {
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      storageUrl: file.storageUrl,
      thumbnailUrl: file.thumbnailUrl,
      processingStatus: file.processingStatus,
      extractedText: file.extractedText,
      metadata: file.metadata,
      uploadedAt: Timestamp.fromDate(file.uploadedAt),
      processedAt: file.processedAt ? Timestamp.fromDate(file.processedAt) : null,
      isDeleted: file.isDeleted,
    };
    await setDoc(docRef, payload);
  }

  public async updateFile(
    userId: string,
    missionId: string,
    fileId: string,
    updates: Partial<AxiomFile>,
  ): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'files', fileId);
    const payload: Record<string, unknown> = {};

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.processingStatus !== undefined) payload.processingStatus = updates.processingStatus;
    if (updates.storageUrl !== undefined) payload.storageUrl = updates.storageUrl;
    if (updates.thumbnailUrl !== undefined) payload.thumbnailUrl = updates.thumbnailUrl;
    if (updates.extractedText !== undefined) payload.extractedText = updates.extractedText;
    if (updates.processedAt !== undefined) payload.processedAt = updates.processedAt ? Timestamp.fromDate(updates.processedAt) : null;
    if (updates.isDeleted !== undefined) payload.isDeleted = updates.isDeleted;

    await updateDoc(docRef, payload);
  }

  public async softDeleteFile(userId: string, missionId: string, fileId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'files', fileId);
    await updateDoc(docRef, {
      isDeleted: true,
    });
  }

  public subscribeFiles(
    userId: string,
    missionId: string,
    callback: (files: AxiomFile[]) => void,
  ): () => void {
    const colRef = collection(db, 'users', userId, 'missions', missionId, 'files');
    const q = query(colRef, where('isDeleted', '==', false));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => this.mapDocToFile(d.id, d.data()));
        callback(list);
      },
      (error) => {
        console.warn('Firestore subscribeFiles failed, calling fallback:', error);
        callback([]);
      }
    );
  }
}
export default FirestoreFileRepository;

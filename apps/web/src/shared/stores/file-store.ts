import { create } from 'zustand';
import { AxiomFile, FileProcessingStatus } from '@/features/file/domain/entities/file';
import { FirestoreFileRepository } from '@/features/file/data/repositories/firestore-file-repository';
import { FirebaseStorageRepository } from '@/features/file/data/repositories/firebase-storage-repository';
import { useAuthStore } from './auth-store';
import { callGeminiAPI } from '../lib/gemini';
import { useKnowledgeStore } from './knowledge-store';

export interface UploadQueueItem {
  id: string;
  name: string;
  progress: number;
  status: 'QUEUED' | 'UPLOADING' | 'COMPLETED' | 'FAILED';
  error: string | null;
  fileObject: File;
}

interface FileStoreState {
  files: AxiomFile[];
  uploadQueue: UploadQueueItem[];
  loading: boolean;
  error: string | null;

  initializeFiles: (missionId: string) => (() => void) | undefined;
  uploadFile: (missionId: string, file: File) => Promise<void>;
  retryUpload: (missionId: string, itemId: string) => Promise<void>;
  cancelUpload: (itemId: string) => void;
  deleteFile: (missionId: string, fileId: string) => Promise<void>;
  toggleFavorite: (missionId: string, fileId: string) => Promise<void>;
}

const fileRepo = new FirestoreFileRepository();
const storageRepo = new FirebaseStorageRepository();

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (): void => {
      const base64Str = (reader.result as string).split(',')[1];
      resolve(base64Str);
    };
    reader.onerror = (error): void => reject(error);
  });
};

export const useFileStore = create<FileStoreState>((set, get) => {
  return {
    files: [],
    uploadQueue: [],
    loading: false,
    error: null,

    initializeFiles: (missionId): (() => void) | undefined => {
      const user = useAuthStore.getState().user;
      if (!user) return undefined;

      set({ loading: true });
      const unsubscribe = fileRepo.subscribeFiles(user.uid, missionId, (filesList) => {
        set({ files: filesList, loading: false });
      });

      return (): void => {
        unsubscribe();
      };
    },

    uploadFile: async (missionId, file): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('No authenticated user session found.');

      // 50MB file size limit validation check
      const limitBytes = 50 * 1024 * 1024;
      if (file.size > limitBytes) {
        throw new Error('File size exceeds the maximum limit of 50MB.');
      }

      const fileId = crypto.randomUUID();
      const queueItem: UploadQueueItem = {
        id: fileId,
        name: file.name,
        progress: 0,
        status: 'QUEUED',
        error: null,
        fileObject: file,
      };

      set((state) => ({ uploadQueue: [...state.uploadQueue, queueItem] }));

      // Run execution loop
      const runUpload = async (item: UploadQueueItem): Promise<void> => {
        set((state) => ({
          uploadQueue: state.uploadQueue.map((q) =>
            q.id === item.id ? { ...q, status: 'UPLOADING' as const } : q,
          ),
        }));

        try {
          // Upload to storage bucket
          const storageUrl = await storageRepo.uploadFile(
            user.uid,
            missionId,
            item.id,
            item.fileObject,
            (progress) => {
              set((state) => ({
                uploadQueue: state.uploadQueue.map((q) =>
                  q.id === item.id ? { ...q, progress } : q,
                ),
              }));
            },
          );

          // Base64 Text extraction and AI Concept mapping pipeline
          let base64Data = '';
          try {
            base64Data = await fileToBase64(item.fileObject);
          } catch (e) {
            console.warn('Failed to read file base64', e);
          }

          let extractedText = '';
          if (base64Data) {
            try {
              const prompt = 'Extract a detailed summary and list of core concepts from this document. Respond in plain text format.';
              extractedText = await callGeminiAPI(prompt, 'You are an expert document reader.', item.fileObject.type || 'application/pdf', base64Data);

              const conceptPrompt = 'Extract 3 core terminology concepts from this document. Respond with a JSON array of objects with label, description, depth (SURFACE/MODERATE/DEEP), category, tags (array of strings).';
              const conceptJson = await callGeminiAPI(conceptPrompt, 'You are a structured concept extractor. Respond ONLY with valid JSON.', item.fileObject.type || 'application/pdf', base64Data);

              const parsed = JSON.parse(conceptJson);
              const conceptsList = Array.isArray(parsed) ? parsed : parsed.concepts || [];
              const knowledgeStore = useKnowledgeStore.getState();
              for (const c of conceptsList) {
                await knowledgeStore.createConcept(missionId, {
                  label: c.label || 'Concept',
                  description: c.description || '',
                  depth: c.depth || 'SURFACE',
                  category: c.category || 'Extracted',
                  tags: c.tags || [],
                  sourceFileIds: [item.id],
                  parentConceptId: null
                });
              }
            } catch (err) {
              console.warn('Gemini text extraction failed or timed out:', err);
              extractedText = `Extracted metadata: filename ${item.name}, size ${item.fileObject.size} bytes.`;
            }
          }

          // Write metadata document to Firestore
          const metaFile: AxiomFile = {
            id: item.id,
            name: item.name,
            mimeType: item.fileObject.type || 'application/octet-stream',
            size: item.fileObject.size,
            storageUrl,
            thumbnailUrl: null,
            processingStatus: 'PROCESSED' as FileProcessingStatus,
            extractedText: extractedText || null,
            metadata: {
              originalName: item.name,
              isFavorite: false,
            },
            uploadedAt: new Date(),
            processedAt: new Date(),
            isDeleted: false,
          };

          await fileRepo.createFile(user.uid, missionId, metaFile);

          set((state) => ({
            uploadQueue: state.uploadQueue.map((q) =>
              q.id === item.id ? { ...q, status: 'COMPLETED' as const, progress: 100 } : q,
            ),
          }));
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Upload failed';
          set((state) => ({
            uploadQueue: state.uploadQueue.map((q) =>
              q.id === item.id ? { ...q, status: 'FAILED' as const, error: msg } : q,
            ),
          }));
        }
      };

      await runUpload(queueItem);
    },

    retryUpload: async (missionId, itemId): Promise<void> => {
      const item = get().uploadQueue.find((q) => q.id === itemId);
      if (!item) return;

      set((state) => ({
        uploadQueue: state.uploadQueue.map((q) =>
          q.id === itemId ? { ...q, progress: 0, error: null, status: 'QUEUED' as const } : q,
        ),
      }));

      const user = useAuthStore.getState().user;
      if (!user) return;

      try {
        const storageUrl = await storageRepo.uploadFile(
          user.uid,
          missionId,
          item.id,
          item.fileObject,
          (progress) => {
            set((state) => ({
              uploadQueue: state.uploadQueue.map((q) =>
                q.id === item.id ? { ...q, progress } : q,
              ),
            }));
          },
        );

        let base64Data = '';
        try {
          base64Data = await fileToBase64(item.fileObject);
        } catch (e) {
          console.warn('Failed to read file base64', e);
        }

        let extractedText = '';
        if (base64Data) {
          try {
            const prompt = 'Extract a detailed summary and list of core concepts from this document. Respond in plain text format.';
            extractedText = await callGeminiAPI(prompt, 'You are an expert document reader.', item.fileObject.type || 'application/pdf', base64Data);

            const conceptPrompt = 'Extract 3 core terminology concepts from this document. Respond with a JSON array of objects with label, description, depth (SURFACE/MODERATE/DEEP), category, tags (array of strings).';
            const conceptJson = await callGeminiAPI(conceptPrompt, 'You are a structured concept extractor. Respond ONLY with valid JSON.', item.fileObject.type || 'application/pdf', base64Data);

            const parsed = JSON.parse(conceptJson);
            const conceptsList = Array.isArray(parsed) ? parsed : parsed.concepts || [];
            const knowledgeStore = useKnowledgeStore.getState();
            for (const c of conceptsList) {
              await knowledgeStore.createConcept(missionId, {
                label: c.label || 'Concept',
                description: c.description || '',
                depth: c.depth || 'SURFACE',
                category: c.category || 'Extracted',
                tags: c.tags || [],
                sourceFileIds: [item.id],
                parentConceptId: null
              });
            }
          } catch (err) {
            console.warn('Gemini text extraction failed or timed out:', err);
            extractedText = `Extracted metadata: filename ${item.name}, size ${item.fileObject.size} bytes.`;
          }
        }

        const metaFile: AxiomFile = {
          id: item.id,
          name: item.name,
          mimeType: item.fileObject.type || 'application/octet-stream',
          size: item.fileObject.size,
          storageUrl,
          thumbnailUrl: null,
          processingStatus: 'PROCESSED' as FileProcessingStatus,
          extractedText: extractedText || null,
          metadata: {
            originalName: item.name,
            isFavorite: false,
          },
          uploadedAt: new Date(),
          processedAt: new Date(),
          isDeleted: false,
        };

        await fileRepo.createFile(user.uid, missionId, metaFile);

        set((state) => ({
          uploadQueue: state.uploadQueue.map((q) =>
            q.id === item.id ? { ...q, status: 'COMPLETED' as const, progress: 100 } : q,
          ),
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        set((state) => ({
          uploadQueue: state.uploadQueue.map((q) =>
            q.id === item.id ? { ...q, status: 'FAILED' as const, error: msg } : q,
          ),
        }));
      }
    },

    cancelUpload: (itemId): void => {
      set((state) => ({
        uploadQueue: state.uploadQueue.filter((q) => q.id !== itemId),
      }));
    },

    deleteFile: async (missionId, fileId): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('No authenticated user session found.');

      const file = get().files.find((f) => f.id === fileId);
      if (!file) return;

      set({ loading: true, error: null });
      try {
        await storageRepo.deleteFile(file.storageUrl);
        await fileRepo.softDeleteFile(user.uid, missionId, fileId);
        set({ loading: false });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete file';
        set({ error: msg, loading: false });
        throw err;
      }
    },

    toggleFavorite: async (missionId, fileId): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('No authenticated user session found.');

      const file = get().files.find((f) => f.id === fileId);
      if (!file) return;

      const updatedVal = !file.metadata.isFavorite;
      try {
        await fileRepo.updateFile(user.uid, missionId, fileId, {
          metadata: {
            ...file.metadata,
            isFavorite: updatedVal,
          },
        });
      } catch (err: unknown) {
        // Silent catch
      }
    },
  };
});
export default useFileStore;

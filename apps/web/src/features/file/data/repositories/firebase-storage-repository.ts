import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/shared/lib/firebase';
import { StorageRepository } from '../../domain/repositories/storage-repository';

export class FirebaseStorageRepository implements StorageRepository {
  public async uploadFile(
    userId: string,
    missionId: string,
    fileId: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    const fileExtension = file.name.split('.').pop() || '';
    const path = `users/${userId}/missions/${missionId}/files/${fileId}.${fileExtension}`;
    const storageRef = ref(storage, path);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (err) {
            reject(err);
          }
        },
      );
    });
  }

  public async deleteFile(storageUrl: string): Promise<void> {
    const storageRef = ref(storage, storageUrl);
    await deleteObject(storageRef);
  }
}
export default FirebaseStorageRepository;

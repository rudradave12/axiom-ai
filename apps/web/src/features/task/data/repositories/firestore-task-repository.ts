import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Timestamp,
  WriteBatch,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { TaskRepository } from '../../domain/repositories/task-repository';
import { MissionTask } from '../../domain/entities/task';

interface FirestoreTaskDoc {
  id?: string;
  missionId?: string;
  phaseId?: string;
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  estimatedMinutes?: number;
  dependencyIds?: string[];
  timelineCheckpointId?: string;
  knowledgeReferenceIds?: string[];
  evidenceReferencePlaceholder?: string;
  updatedAt?: Timestamp;
  version?: number;
}

export class FirestoreTaskRepository implements TaskRepository {
  private mapDocToTask(docData: unknown): MissionTask {
    const data = (docData || {}) as FirestoreTaskDoc;
    return {
      id: data.id || crypto.randomUUID(),
      missionId: data.missionId || '',
      phaseId: data.phaseId || '',
      title: data.title || '',
      description: data.description || '',
      priority: (data.priority || 'medium') as 'low' | 'medium' | 'high' | 'critical',
      status: (data.status || 'todo') as 'todo' | 'in-progress' | 'done' | 'skipped' | 'blocked',
      estimatedMinutes: data.estimatedMinutes ?? 30,
      dependencyIds: data.dependencyIds || [],
      timelineCheckpointId: data.timelineCheckpointId || '',
      knowledgeReferenceIds: data.knowledgeReferenceIds || [],
      evidenceReferencePlaceholder: data.evidenceReferencePlaceholder || '',
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
      version: data.version ?? 1,
    };
  }

  public async getTasks(userId: string, missionId: string): Promise<MissionTask[]> {
    const collRef = collection(db, 'users', userId, 'missions', missionId, 'tasks');
    const snap = await getDocs(collRef);
    return snap.docs.map((doc) => this.mapDocToTask(doc.data()));
  }

  public async saveTask(userId: string, missionId: string, task: MissionTask): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'tasks', task.id);
    const payload = {
      ...task,
      updatedAt: Timestamp.fromDate(task.updatedAt),
    };
    await setDoc(docRef, payload);
  }

  public async saveTasksBulk(userId: string, missionId: string, tasks: MissionTask[], externalBatch?: WriteBatch): Promise<void> {
    const batch = externalBatch || writeBatch(db);
    tasks.forEach((task) => {
      const docRef = doc(db, 'users', userId, 'missions', missionId, 'tasks', task.id);
      const payload = {
        ...task,
        updatedAt: Timestamp.fromDate(task.updatedAt),
      };
      batch.set(docRef, payload);
    });
    if (!externalBatch) {
      await batch.commit();
    }
  }

  public async deleteTask(userId: string, missionId: string, taskId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'tasks', taskId);
    await deleteDoc(docRef);
  }

  public subscribeTasks(
    userId: string,
    missionId: string,
    callback: (tasks: MissionTask[]) => void,
  ): () => void {
    const collRef = collection(db, 'users', userId, 'missions', missionId, 'tasks');
    return onSnapshot(
      collRef,
      (snap) => {
        const tasks = snap.docs.map((doc) => this.mapDocToTask(doc.data()));
        callback(tasks);
      },
      (error) => {
        console.warn('Firestore subscribeTasks failed, calling fallback:', error);
        callback([]);
      }
    );
  }
}
export default FirestoreTaskRepository;

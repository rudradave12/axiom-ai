import { sanitizeFirestorePayload } from '../../../../shared/lib/firestore-utils';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Timestamp,
  WriteBatch,
} from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { ExecutionRepository } from '../../domain/repositories/execution-repository';
import {
  ExecutionGraph,
  ExecutionNode,
  ExecutionDependency,
} from '../../domain/entities/execution';

interface FirestoreGraphDoc {
  nodes?: Array<{
    id?: string;
    phaseId?: string;
    title?: string;
    description?: string;
    estimatedMinutes?: number;
    type?: string;
  }>;
  dependencies?: Array<{
    fromNodeId?: string;
    toNodeId?: string;
    dependencyType?: string;
  }>;
  criticalPathNodeIds?: string[];
  parallelGroupNodeIds?: string[];
  blockedNodeIds?: string[];
  completionCriteria?: string[];
  executionConfidence?: number;
  updatedAt?: Timestamp;
}

export class FirestoreExecutionRepository implements ExecutionRepository {
  private mapDocToGraph(missionId: string, docData: unknown): ExecutionGraph {
    const data = (docData || {}) as FirestoreGraphDoc;
    return {
      missionId,
      nodes: (data.nodes || []).map((n): ExecutionNode => ({
        id: n.id || crypto.randomUUID(),
        phaseId: n.phaseId || '',
        title: n.title || '',
        description: n.description || '',
        estimatedMinutes: n.estimatedMinutes ?? 0,
        type: (n.type || 'milestone') as 'milestone' | 'checkpoint' | 'gate',
      })),
      dependencies: (data.dependencies || []).map((d): ExecutionDependency => ({
        fromNodeId: d.fromNodeId || '',
        toNodeId: d.toNodeId || '',
        dependencyType: (d.dependencyType || 'blocking') as 'blocking' | 'optional',
      })),
      criticalPathNodeIds: data.criticalPathNodeIds || [],
      parallelGroupNodeIds: data.parallelGroupNodeIds || [],
      blockedNodeIds: data.blockedNodeIds || [],
      completionCriteria: data.completionCriteria || [],
      executionConfidence: data.executionConfidence ?? 100,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    };
  }

  public async getGraph(userId: string, missionId: string): Promise<ExecutionGraph | null> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'intelligence', 'executionGraph');
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return this.mapDocToGraph(missionId, snap.data());
  }

  public async saveGraph(userId: string, missionId: string, graph: ExecutionGraph, batch?: WriteBatch): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'intelligence', 'executionGraph');
    const payload = {
      nodes: graph.nodes,
      dependencies: graph.dependencies,
      criticalPathNodeIds: graph.criticalPathNodeIds,
      parallelGroupNodeIds: graph.parallelGroupNodeIds,
      blockedNodeIds: graph.blockedNodeIds,
      completionCriteria: graph.completionCriteria,
      executionConfidence: graph.executionConfidence,
      updatedAt: Timestamp.fromDate(graph.updatedAt),
    };
    if (batch) {
      batch.set(docRef, sanitizeFirestorePayload(payload) as Record<string, unknown>);
    } else {
      await setDoc(docRef, sanitizeFirestorePayload(payload) as Record<string, unknown>);
    }
  }

  public subscribeGraph(
    userId: string,
    missionId: string,
    callback: (graph: ExecutionGraph | null) => void,
  ): () => void {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'intelligence', 'executionGraph');
    return onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          callback(null);
        } else {
          callback(this.mapDocToGraph(missionId, snap.data()));
        }
      },
      (error) => {
        console.warn('Firestore subscribeGraph failed, calling fallback:', error);
        callback(null);
      }
    );
  }
}
export default FirestoreExecutionRepository;

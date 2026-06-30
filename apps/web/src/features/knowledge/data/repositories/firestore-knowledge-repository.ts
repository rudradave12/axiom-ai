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
import { KnowledgeRepository } from '../../domain/repositories/knowledge-repository';
import { KnowledgeConcept, KnowledgeCollection, KnowledgeDepth } from '../../domain/entities/knowledge';
import { sanitizeFirestorePayload } from '../../../../shared/lib/firestore-utils';

interface FirestoreConceptDoc {
  label?: string;
  description?: string;
  confidence?: number;
  sourceFileIds?: string[];
  relatedConceptIds?: string[];
  parentConceptId?: string | null;
  depth?: string;
  createdAt?: Timestamp;
  lastEngagedAt?: Timestamp | null;
  isDeleted?: boolean;
  tags?: string[];
  category?: string;
}

interface FirestoreCollectionDoc {
  name?: string;
  description?: string;
  conceptIds?: string[];
  createdAt?: Timestamp;
  isDeleted?: boolean;
}

export class FirestoreKnowledgeRepository implements KnowledgeRepository {
  private mapDocToConcept(id: string, userId: string, missionId: string, docData: unknown): KnowledgeConcept {
    const data = (docData || {}) as FirestoreConceptDoc;
    return {
      id,
      userId,
      missionId,
      label: data.label || 'Untitled Concept',
      description: data.description || '',
      confidence: data.confidence || 100,
      sourceFileIds: data.sourceFileIds || [],
      relatedConceptIds: data.relatedConceptIds || [],
      parentConceptId: data.parentConceptId || null,
      depth: (data.depth || 'SURFACE') as KnowledgeDepth,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      lastEngagedAt: data.lastEngagedAt instanceof Timestamp ? data.lastEngagedAt.toDate() : null,
      isDeleted: data.isDeleted ?? false,
      tags: data.tags || [],
      category: data.category || 'General',
    };
  }

  private mapDocToCollection(id: string, userId: string, missionId: string, docData: unknown): KnowledgeCollection {
    const data = (docData || {}) as FirestoreCollectionDoc;
    return {
      id,
      userId,
      missionId,
      name: data.name || 'Untitled Collection',
      description: data.description || '',
      conceptIds: data.conceptIds || [],
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
      isDeleted: data.isDeleted ?? false,
    };
  }

  public async getConcepts(userId: string, missionId: string): Promise<KnowledgeConcept[]> {
    const colRef = collection(db, 'users', userId, 'missions', missionId, 'knowledge');
    const q = query(colRef, where('isDeleted', '==', false));
    const snap = await getDocs(q);
    return snap.docs.map((d) => this.mapDocToConcept(d.id, userId, missionId, d.data()));
  }

  public async getConcept(userId: string, missionId: string, conceptId: string): Promise<KnowledgeConcept | null> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'knowledge', conceptId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return this.mapDocToConcept(snap.id, userId, missionId, snap.data());
  }

  public async createConcept(userId: string, missionId: string, concept: KnowledgeConcept): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'knowledge', concept.id);
    const payload = {
      label: concept.label,
      description: concept.description,
      confidence: concept.confidence,
      sourceFileIds: concept.sourceFileIds,
      relatedConceptIds: concept.relatedConceptIds,
      parentConceptId: concept.parentConceptId,
      depth: concept.depth,
      createdAt: Timestamp.fromDate(concept.createdAt),
      lastEngagedAt: concept.lastEngagedAt ? Timestamp.fromDate(concept.lastEngagedAt) : null,
      isDeleted: concept.isDeleted,
      tags: concept.tags,
      category: concept.category,
    };
    await setDoc(docRef, sanitizeFirestorePayload(payload) as Record<string, unknown>);
  }

  public async updateConcept(
    userId: string,
    missionId: string,
    conceptId: string,
    updates: Partial<KnowledgeConcept>,
  ): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'knowledge', conceptId);
    const payload: Record<string, unknown> = {};

    if (updates.label !== undefined) payload.label = updates.label;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.confidence !== undefined) payload.confidence = updates.confidence;
    if (updates.parentConceptId !== undefined) payload.parentConceptId = updates.parentConceptId;
    if (updates.depth !== undefined) payload.depth = updates.depth;
    if (updates.lastEngagedAt !== undefined) payload.lastEngagedAt = updates.lastEngagedAt ? Timestamp.fromDate(updates.lastEngagedAt) : null;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.relatedConceptIds !== undefined) payload.relatedConceptIds = updates.relatedConceptIds;
    if (updates.sourceFileIds !== undefined) payload.sourceFileIds = updates.sourceFileIds;

    await updateDoc(docRef, sanitizeFirestorePayload(payload) as Record<string, unknown>);
  }

  public async softDeleteConcept(userId: string, missionId: string, conceptId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'knowledge', conceptId);
    await updateDoc(docRef, { isDeleted: true });
  }

  public subscribeConcepts(
    userId: string,
    missionId: string,
    callback: (concepts: KnowledgeConcept[]) => void,
  ): () => void {
    const colRef = collection(db, 'users', userId, 'missions', missionId, 'knowledge');
    const q = query(colRef, where('isDeleted', '==', false));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => this.mapDocToConcept(d.id, userId, missionId, d.data()));
        callback(list);
      },
      (error) => {
        console.warn('Firestore subscribeConcepts failed, calling fallback:', error);
        callback([]);
      }
    );
  }

  public async getCollections(userId: string, missionId: string): Promise<KnowledgeCollection[]> {
    const colRef = collection(db, 'users', userId, 'missions', missionId, 'knowledgeCollections');
    const q = query(colRef, where('isDeleted', '==', false));
    const snap = await getDocs(q);
    return snap.docs.map((d) => this.mapDocToCollection(d.id, userId, missionId, d.data()));
  }

  public async createCollection(userId: string, missionId: string, collectionData: KnowledgeCollection): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'knowledgeCollections', collectionData.id);
    const payload = {
      name: collectionData.name,
      description: collectionData.description,
      conceptIds: collectionData.conceptIds,
      createdAt: Timestamp.fromDate(collectionData.createdAt),
      isDeleted: collectionData.isDeleted,
    };
    await setDoc(docRef, sanitizeFirestorePayload(payload) as Record<string, unknown>);
  }

  public async updateCollection(
    userId: string,
    missionId: string,
    collectionId: string,
    updates: Partial<KnowledgeCollection>,
  ): Promise<void> {
    const docRef = doc(db, 'users', userId, 'missions', missionId, 'knowledgeCollections', collectionId);
    const payload: Record<string, unknown> = {};

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.conceptIds !== undefined) payload.conceptIds = updates.conceptIds;

    await updateDoc(docRef, sanitizeFirestorePayload(payload) as Record<string, unknown>);
  }

  public subscribeCollections(
    userId: string,
    missionId: string,
    callback: (collections: KnowledgeCollection[]) => void,
  ): () => void {
    const colRef = collection(db, 'users', userId, 'missions', missionId, 'knowledgeCollections');
    const q = query(colRef, where('isDeleted', '==', false));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => this.mapDocToCollection(d.id, userId, missionId, d.data()));
        callback(list);
      },
      (error) => {
        console.warn('Firestore subscribeCollections failed, calling fallback:', error);
        callback([]);
      }
    );
  }
}
export default FirestoreKnowledgeRepository;

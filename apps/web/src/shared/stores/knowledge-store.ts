import { create } from 'zustand';
import { KnowledgeConcept, KnowledgeCollection, KnowledgeDepth } from '@/features/knowledge/domain/entities/knowledge';
import { FirestoreKnowledgeRepository } from '@/features/knowledge/data/repositories/firestore-knowledge-repository';
import { useAuthStore } from './auth-store';

interface KnowledgeStoreState {
  concepts: KnowledgeConcept[];
  collections: KnowledgeCollection[];
  loading: boolean;
  error: string | null;

  initializeKnowledge: (missionId: string) => (() => void) | undefined;
  createConcept: (missionId: string, details: {
    label: string;
    description: string;
    depth: KnowledgeDepth;
    category: string;
    tags?: string[];
    sourceFileIds?: string[];
    parentConceptId?: string | null;
  }) => Promise<KnowledgeConcept>;
  createCollection: (missionId: string, name: string, description: string, conceptIds: string[]) => Promise<KnowledgeCollection>;
  deleteConcept: (missionId: string, conceptId: string) => Promise<void>;
}

const knowledgeRepo = new FirestoreKnowledgeRepository();

export const useKnowledgeStore = create<KnowledgeStoreState>((set) => {
  return {
    concepts: [],
    collections: [],
    loading: false,
    error: null,

    initializeKnowledge: (missionId): (() => void) | undefined => {
      const user = useAuthStore.getState().user;
      if (!user) return undefined;

      set({ loading: true });

      const unsubscribeConcepts = knowledgeRepo.subscribeConcepts(user.uid, missionId, (conceptsList) => {
        set({ concepts: conceptsList, loading: false });
      });

      const unsubscribeCollections = knowledgeRepo.subscribeCollections(user.uid, missionId, (collectionsList) => {
        set({ collections: collectionsList });
      });

      return (): void => {
        unsubscribeConcepts();
        unsubscribeCollections();
      };
    },

    createConcept: async (missionId, details): Promise<KnowledgeConcept> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('No active user session.');

      const conceptId = crypto.randomUUID();
      const newConcept: KnowledgeConcept = {
        id: conceptId,
        userId: user.uid,
        missionId,
        label: details.label.trim(),
        description: details.description.trim(),
        confidence: 100,
        sourceFileIds: details.sourceFileIds || [],
        relatedConceptIds: [],
        parentConceptId: details.parentConceptId || null,
        depth: details.depth,
        createdAt: new Date(),
        lastEngagedAt: null,
        isDeleted: false,
        tags: details.tags || [],
        category: details.category || 'General',
      };

      set({ loading: true, error: null });
      try {
        await knowledgeRepo.createConcept(user.uid, missionId, newConcept);
        set({ loading: false });
        return newConcept;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Concept creation failed';
        set({ error: msg, loading: false });
        throw err;
      }
    },

    createCollection: async (missionId, name, description, conceptIds): Promise<KnowledgeCollection> => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('No active user session.');

      const collectionId = crypto.randomUUID();
      const newCollection: KnowledgeCollection = {
        id: collectionId,
        userId: user.uid,
        missionId,
        name: name.trim(),
        description: description.trim(),
        conceptIds,
        createdAt: new Date(),
        isDeleted: false,
      };

      set({ loading: true, error: null });
      try {
        await knowledgeRepo.createCollection(user.uid, missionId, newCollection);
        set({ loading: false });
        return newCollection;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Collection creation failed';
        set({ error: msg, loading: false });
        throw err;
      }
    },

    deleteConcept: async (missionId, conceptId): Promise<void> => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      set({ loading: true, error: null });
      try {
        await knowledgeRepo.softDeleteConcept(user.uid, missionId, conceptId);
        set({ loading: false });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete concept';
        set({ error: msg, loading: false });
        throw err;
      }
    },
  };
});
export default useKnowledgeStore;

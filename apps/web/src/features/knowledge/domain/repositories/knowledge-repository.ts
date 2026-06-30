import { KnowledgeConcept, KnowledgeCollection } from '../entities/knowledge';

export interface KnowledgeRepository {
  getConcepts(userId: string, missionId: string): Promise<KnowledgeConcept[]>;
  getConcept(userId: string, missionId: string, conceptId: string): Promise<KnowledgeConcept | null>;
  createConcept(userId: string, missionId: string, concept: KnowledgeConcept): Promise<void>;
  updateConcept(userId: string, missionId: string, conceptId: string, updates: Partial<KnowledgeConcept>): Promise<void>;
  softDeleteConcept(userId: string, missionId: string, conceptId: string): Promise<void>;
  subscribeConcepts(userId: string, missionId: string, callback: (concepts: KnowledgeConcept[]) => void): () => void;

  getCollections(userId: string, missionId: string): Promise<KnowledgeCollection[]>;
  createCollection(userId: string, missionId: string, collection: KnowledgeCollection): Promise<void>;
  updateCollection(userId: string, missionId: string, collectionId: string, updates: Partial<KnowledgeCollection>): Promise<void>;
  subscribeCollections(userId: string, missionId: string, callback: (collections: KnowledgeCollection[]) => void): () => void;
}

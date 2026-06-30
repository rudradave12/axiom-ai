export type KnowledgeDepth = 'SURFACE' | 'MODERATE' | 'DEEP';

export interface KnowledgeConcept {
  id: string;
  userId: string;
  missionId: string;
  label: string;
  description: string;
  confidence: number;
  sourceFileIds: string[];
  relatedConceptIds: string[];
  parentConceptId: string | null;
  depth: KnowledgeDepth;
  createdAt: Date;
  lastEngagedAt: Date | null;
  isDeleted: boolean;
  tags: string[];
  category: string;
}

export interface KnowledgeCollection {
  id: string;
  userId: string;
  missionId: string;
  name: string;
  description: string;
  conceptIds: string[];
  createdAt: Date;
  isDeleted: boolean;
}

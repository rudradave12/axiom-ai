export interface ExecutionNode {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  type: 'milestone' | 'checkpoint' | 'gate';
}

export interface ExecutionDependency {
  fromNodeId: string;
  toNodeId: string;
  dependencyType: 'blocking' | 'optional';
}

export interface ExecutionGroup {
  id: string;
  title: string;
  nodeIds: string[];
}

export interface ExecutionGraph {
  missionId: string;
  nodes: ExecutionNode[];
  dependencies: ExecutionDependency[];
  criticalPathNodeIds: string[];
  parallelGroupNodeIds: string[];
  blockedNodeIds: string[];
  completionCriteria: string[];
  executionConfidence: number; // 0-100
  updatedAt: Date;
}

export interface MissionTask {
  id: string;
  missionId: string;
  phaseId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in-progress' | 'done' | 'skipped' | 'blocked';
  estimatedMinutes: number;
  dependencyIds: string[];
  timelineCheckpointId?: string;
  knowledgeReferenceIds: string[];
  evidenceReferencePlaceholder?: string;
  updatedAt: Date;
  version: number;
}

export interface TaskGroup {
  id: string;
  title: string;
  taskIds: string[];
}

export interface TaskDependency {
  fromTaskId: string;
  toTaskId: string;
  type: 'blocking' | 'optional';
}

export interface TaskHistory {
  id: string;
  taskId: string;
  action: string;
  timestamp: Date;
  details: string;
}

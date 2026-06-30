export interface MissionMilestone {
  id: string;
  title: string;
  description: string;
  successCriteria: string;
}

export interface MissionPhase {
  id: string;
  title: string;
  description: string;
  order: number;
  milestoneIds: string[];
  objectiveIds: string[];
  estimatedDuration: string;
  estimatedEffort: string; // e.g. Low, Medium, High
}

export interface MissionDependency {
  fromPhaseId: string;
  toPhaseId: string;
  type: 'blocking' | 'parallel';
}

export interface MissionSuccessCriteria {
  id: string;
  metric: string;
  target: string;
}

export interface MissionRoadmap {
  missionId: string;
  phases: MissionPhase[];
  milestones: MissionMilestone[];
  dependencies: MissionDependency[];
  requiredResources: string[];
  prerequisites: string[];
  riskSummary: string;
  successCriteria: MissionSuccessCriteria[];
  plannerConfidence: number; // 0-100
  updatedAt: Date;
}

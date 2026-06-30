export type GoalType = 'EXAM_PREP' | 'STARTUP' | 'RESEARCH' | 'SKILL_LEARNING' | 'PROJECT' | 'CUSTOM';
export type MissionStatus = 'BUILDING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type PulseStatus = 'steady' | 'attention' | 'critical';

export interface MissionHealth {
  momentum: number;
  knowledgeDepth: number;
  scheduleIntegrity: number;
  completeness: number;
  riskExposure: number;
  infoSufficiency: number;
  composite: number;
  pulse: PulseStatus;
  lastCalculatedAt: Date;
}

export interface BriefingChange {
  type: string;
  description: string;
}

export interface MissionBriefing {
  available: boolean;
  generatedAt: Date | null;
  changes: BriefingChange[];
  dismissed: boolean;
}

export interface Mission {
  id: string;
  userId: string;
  goal: string;
  goalType: GoalType;
  title: string;
  activeModules: string[];
  status: MissionStatus;
  deadline: Date | null;
  createdAt: Date;
  lastAccessedAt: Date;
  completedAt: Date | null;
  health: MissionHealth;
  briefing: MissionBriefing;
  isDeleted: boolean;
  deletedAt: Date | null;
  version: number;
}

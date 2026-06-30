export interface TimelinePhase {
  id: string;
  title: string;
  description: string;
  order: number;
  startDate: Date;
  endDate: Date;
  estimatedDuration: string;
}

export interface TimelineCheckpoint {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  targetDate: Date;
  type: 'milestone' | 'checkpoint' | 'gate';
}

export interface TimelineDependency {
  fromCheckpointId: string;
  toCheckpointId: string;
  type: 'blocking' | 'optional';
}

export interface TimelineWindow {
  startDate: Date;
  endDate: Date;
}

export interface MissionTimeline {
  missionId: string;
  phases: TimelinePhase[];
  checkpoints: TimelineCheckpoint[];
  dependencies: TimelineDependency[];
  criticalWindow: TimelineWindow;
  parallelWindow: TimelineWindow;
  estimatedCompletion: Date;
  schedulingConfidence: number; // 0-100
  updatedAt: Date;
}

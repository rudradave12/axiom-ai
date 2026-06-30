export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface MissionConstraint {
  id: string;
  description: string;
  type: 'TIME' | 'BUDGET' | 'RESOURCE' | 'TECHNICAL' | 'OTHER';
}

export interface MissionProfile {
  missionId: string;
  missionType: string;
  domain: string;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedDuration: string;
  objectives: MissionObjective[];
  constraints: MissionConstraint[];
  requiredInputs: string[];
  missingInformation: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  aiConfidence: number;
  updatedAt: Date;
}

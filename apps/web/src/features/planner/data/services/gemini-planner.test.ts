import { describe, it, expect } from 'vitest';
import { GeminiPlanner, PlannerPromptManager } from './gemini-planner';

describe('PlannerPromptManager', () => {
  it('should compile a roadmap planner instruction prompt containing parameters', () => {
    const prompt = PlannerPromptManager.generatePrompt(
      JSON.stringify({
        missionType: 'EXAM_PREP',
        domain: 'Mathematics',
        complexity: 'HIGH',
      }),
    );

    expect(prompt).toContain('EXAM_PREP');
    expect(prompt).toContain('Mathematics');
    expect(prompt).toContain('structured Mission Roadmap');
  });
});

describe('GeminiPlanner parse and validation', () => {
  it('should resolve and validate roadmap outputs from planner prompt streams', async () => {
    const planner = new GeminiPlanner();
    const roadmap = await planner.generateRoadmap(
      'mission-123',
      JSON.stringify({
        missionType: 'EXAM_PREP',
        domain: 'Mathematics',
        complexity: 'HIGH',
      }),
    );

    expect(roadmap.missionId).toBe('mission-123');
    expect(roadmap.phases.length).toBeGreaterThan(0);
    expect(roadmap.milestones.length).toBeGreaterThan(0);
    expect(roadmap.successCriteria.length).toBeGreaterThan(0);
    expect(roadmap.plannerConfidence).toBe(95);
  });
});

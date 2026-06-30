import { describe, it, expect } from 'vitest';
import { GeminiTimeline, TimelinePromptManager } from './gemini-timeline';

describe('TimelinePromptManager', () => {
  it('should compile a timeline scheduler instruction prompt containing parameters', () => {
    const prompt = TimelinePromptManager.generatePrompt(
      JSON.stringify({ missionType: 'EXAM_PREP' }),
      JSON.stringify({ phases: [] }),
      JSON.stringify({ nodes: [] }),
    );

    expect(prompt).toContain('EXAM_PREP');
    expect(prompt).toContain('scheduled AI Timeline');
  });
});

describe('GeminiTimeline parse and validation', () => {
  it('should resolve and validate timeline outputs from scheduling prompt streams', async () => {
    const client = new GeminiTimeline();
    const timeline = await client.generateTimeline(
      'mission-123',
      JSON.stringify({ missionType: 'EXAM_PREP' }),
      JSON.stringify({ phases: [] }),
      JSON.stringify({ nodes: [] }),
    );

    expect(timeline.missionId).toBe('mission-123');
    expect(timeline.phases.length).toBeGreaterThan(0);
    expect(timeline.checkpoints.length).toBeGreaterThan(0);
    expect(timeline.dependencies.length).toBeGreaterThan(0);
    expect(timeline.schedulingConfidence).toBe(95);
  });
});

import { describe, it, expect } from 'vitest';
import { GeminiTask, TaskPromptManager } from './gemini-task';

describe('TaskPromptManager', () => {
  it('should compile a task generation instruction prompt containing parameters', () => {
    const prompt = TaskPromptManager.generatePrompt(
      JSON.stringify({ missionType: 'EXAM_PREP' }),
      JSON.stringify({ phases: [] }),
      JSON.stringify({ nodes: [] }),
      JSON.stringify({ checkpoints: [] }),
    );

    expect(prompt).toContain('EXAM_PREP');
    expect(prompt).toContain('generate executable Mission Tasks');
  });
});

describe('GeminiTask parse and validation', () => {
  it('should resolve and validate task outputs from compilation prompt streams', async () => {
    const client = new GeminiTask();
    const tasks = await client.generateTasks(
      'mission-123',
      JSON.stringify({ missionType: 'EXAM_PREP' }),
      JSON.stringify({ phases: [] }),
      JSON.stringify({ nodes: [] }),
      JSON.stringify({ checkpoints: [] }),
    );

    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].missionId).toBe('mission-123');
    expect(tasks[0].priority).toBe('critical');
    expect(tasks[0].status).toBe('todo');
    expect(tasks[0].estimatedMinutes).toBe(45);
  });
});

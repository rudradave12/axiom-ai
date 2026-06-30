import { describe, it, expect } from 'vitest';
import { GeminiExecution, ExecutionPromptManager } from './gemini-execution';

describe('ExecutionPromptManager', () => {
  it('should compile an execution graph instruction prompt containing parameters', () => {
    const prompt = ExecutionPromptManager.generatePrompt(
      JSON.stringify({ missionType: 'EXAM_PREP' }),
      JSON.stringify({ phases: [] }),
    );

    expect(prompt).toContain('EXAM_PREP');
    expect(prompt).toContain('structured AI Execution Graph');
  });
});

describe('GeminiExecution parse and validation', () => {
  it('should resolve and validate execution graph outputs from prompt streams', async () => {
    const client = new GeminiExecution();
    const graph = await client.generateGraph(
      'mission-123',
      JSON.stringify({ missionType: 'EXAM_PREP' }),
      JSON.stringify({ phases: [] }),
    );

    expect(graph.missionId).toBe('mission-123');
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.dependencies.length).toBeGreaterThan(0);
    expect(graph.criticalPathNodeIds.length).toBeGreaterThan(0);
    expect(graph.executionConfidence).toBe(95);
  });
});

import { describe, it, expect } from 'vitest';
import { GeminiCopilot, CopilotContextAssembler } from './gemini-copilot';

describe('CopilotContextAssembler', () => {
  it('should compile an instruction prompt containing all intelligence context parameters', () => {
    const instruction = CopilotContextAssembler.assembleSystemInstruction(
      'Test title',
      'Goal text description',
      JSON.stringify({ domain: 'Math' }),
      JSON.stringify({ phases: [] }),
      JSON.stringify({ nodes: [] }),
      JSON.stringify({ checkpoints: [] }),
      10,
    );

    expect(instruction).toContain('Test title');
    expect(instruction).toContain('Math');
    expect(instruction).toContain('10');
  });
});

describe('GeminiCopilot responses trace validation', () => {
  it('should simulate stream calls writing chunks and returning complete responses', async () => {
    const client = new GeminiCopilot();
    const chunks: string[] = [];

    const fullResponse = await client.getResponseStream(
      'Find active blockers',
      [],
      'System context instructions',
      (c) => chunks.push(c),
    );

    expect(fullResponse).toContain('blocked');
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[chunks.length - 1].trim()).toBe(fullResponse.trim());
  });
});

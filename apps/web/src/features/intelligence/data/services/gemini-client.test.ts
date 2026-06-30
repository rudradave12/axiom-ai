import { describe, it, expect } from 'vitest';
import { GeminiClient, PromptManager, CircuitBreaker } from './gemini-client';

describe('PromptManager', () => {
  it('should compile an analysis instruction prompt containing parameters', () => {
    const prompt = PromptManager.generatePrompt(
      'Prep Calculus Exam',
      'Learn derivatives and integrals by next Thursday',
      [{ name: 'syllabus.pdf', size: 1048576 }],
      [{ label: 'Derivative', category: 'Concept' }],
    );

    expect(prompt).toContain('Prep Calculus Exam');
    expect(prompt).toContain('syllabus.pdf');
    expect(prompt).toContain('Derivative');
    expect(prompt).toContain('valid JSON');
  });
});

describe('CircuitBreaker', () => {
  it('should transition states cleanly upon failures and cooldowns', () => {
    const breaker = new CircuitBreaker();
    expect(breaker.isOpen()).toBe(false);

    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(true);

    breaker.recordSuccess();
    expect(breaker.isOpen()).toBe(false);
  });
});

describe('GeminiClient parse and validation', () => {
  it('should resolve and validate understanding outputs from prompt streams', async () => {
    const client = new GeminiClient();
    const profile = await client.analyzeMission(
      'mission-123',
      'Calculus Prep',
      'Study limits and integrals',
      [],
      [],
    );

    expect(profile.missionId).toBe('mission-123');
    expect(profile.complexity).toBe('HIGH');
    expect(profile.objectives.length).toBeGreaterThan(0);
    expect(profile.constraints.length).toBeGreaterThan(0);
  });
});

import { describe, it, expect } from 'vitest';
import { CORE_VERSION, BaseEntity } from './index';

describe('Core Module', () => {
  it('should export correct version', () => {
    expect(CORE_VERSION).toBe('1.0.0');
  });

  it('should conform to BaseEntity interface', () => {
    const entity: BaseEntity = {
      id: 'test-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(entity.id).toBe('test-123');
    expect(entity.createdAt).toBeInstanceOf(Date);
  });
});

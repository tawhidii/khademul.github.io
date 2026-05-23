import { describe, it, expect } from 'vitest';
import { skills } from '../skills.js';

describe('skills data', () => {
  it('has four groups with non-empty items', () => {
    expect(skills).toHaveLength(4);
    for (const g of skills) {
      expect(typeof g.group).toBe('string');
      expect(Array.isArray(g.items)).toBe(true);
      expect(g.items.length).toBeGreaterThan(0);
    }
    expect(skills.map((g) => g.group)).toEqual([
      'languages',
      'backend',
      'infra & data',
      'other',
    ]);
  });
});

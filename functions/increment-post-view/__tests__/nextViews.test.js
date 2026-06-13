import { describe, it, expect } from 'vitest';
import { nextViews } from '../nextViews.js';

describe('nextViews', () => {
  it('increments an existing count', () => {
    expect(nextViews({ views: 5 })).toBe(6);
  });
  it('treats missing or zero as zero', () => {
    expect(nextViews({})).toBe(1);
    expect(nextViews({ views: 0 })).toBe(1);
  });
  it('handles a null document', () => {
    expect(nextViews(null)).toBe(1);
  });
});

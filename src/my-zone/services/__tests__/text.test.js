import { describe, it, expect } from 'vitest';
import { toSlug, makeExcerpt } from '../text.js';

describe('toSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(toSlug('Hello World!')).toBe('hello-world');
  });
  it('trims leading/trailing separators', () => {
    expect(toSlug('  --Foo Bar--  ')).toBe('foo-bar');
  });
  it('falls back when empty', () => {
    expect(toSlug('!!!')).toBe('post');
  });
});

describe('makeExcerpt', () => {
  it('takes the first 300 chars by default', () => {
    const long = 'a'.repeat(400);
    expect(makeExcerpt(long)).toHaveLength(300);
  });
  it('handles empty input', () => {
    expect(makeExcerpt('')).toBe('');
    expect(makeExcerpt(undefined)).toBe('');
  });
});

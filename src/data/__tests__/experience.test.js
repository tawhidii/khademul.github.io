import { describe, it, expect } from 'vitest';
import { experience } from '../experience.js';

describe('experience data', () => {
  it('lists all roles in reverse chronological order', () => {
    expect(experience.length).toBeGreaterThanOrEqual(7);
    expect(experience[0].company).toBe('Mutual Trust Bank PLC');
    expect(experience[experience.length - 1].company).toBe('Belaface LTD');
  });

  it('each entry has the required shape', () => {
    for (const entry of experience) {
      expect(entry).toMatchObject({
        company: expect.any(String),
        role: expect.any(String),
        start: expect.any(String),
        end: expect.any(String),
        location: expect.any(String),
        bullets: expect.any(Array),
        tags: expect.any(Array),
      });
      expect(entry.bullets.length).toBeGreaterThan(0);
      expect(entry.tags.length).toBeGreaterThan(0);
    }
  });
});

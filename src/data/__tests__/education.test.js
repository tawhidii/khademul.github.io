import { describe, it, expect } from 'vitest';
import { education } from '../education.js';

describe('education data', () => {
  it('lists the B.Sc. only', () => {
    expect(education).toHaveLength(1);
    expect(education[0].degree).toMatch(/B\.Sc/);
    expect(education[0].school).toBe('Daffodil International University');
    expect(education[0].gpa).toBe('3.10 / 4.00');
  });
});

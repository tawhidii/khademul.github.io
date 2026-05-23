import { describe, it, expect } from 'vitest';
import { profile } from '../profile.js';

describe('profile data', () => {
  it('exposes the required identity and contact fields', () => {
    expect(profile.name).toBe('Khondoker Khademul Bari');
    expect(profile.role).toBe('Software Engineer');
    expect(profile.location).toBe('Dhaka, Bangladesh');
    expect(profile.tagline).toMatch(/4\+ years/);
    expect(profile.email).toBe('barii.py@gmail.com');
    expect(profile.phone).toBe('+8801616716072');
    expect(profile.github).toBe('tawhidii');
    expect(profile.linkedin).toBe('kkbari');
  });
});

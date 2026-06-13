import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe('useTheme', () => {
  it('defaults to dark', async () => {
    const { useTheme } = await import('../useTheme.js');
    const { theme } = useTheme();
    expect(theme.value).toBe('dark');
  });

  it('toggle flips and persists', async () => {
    const { useTheme } = await import('../useTheme.js');
    const { theme, toggle } = useTheme();
    toggle();
    expect(theme.value).toBe('light');
    expect(localStorage.getItem('my-zone:theme')).toBe('light');
    toggle();
    expect(theme.value).toBe('dark');
  });

  it('reads a stored preference on init', async () => {
    localStorage.setItem('my-zone:theme', 'light');
    const { useTheme } = await import('../useTheme.js');
    const { theme } = useTheme();
    expect(theme.value).toBe('light');
  });
});

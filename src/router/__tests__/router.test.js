import { describe, it, expect } from 'vitest';
import { routes } from '../index.js';

describe('routes', () => {
  it('maps / to TerminalHome', () => {
    const home = routes.find((r) => r.path === '/');
    expect(home).toBeTruthy();
    expect(home.name).toBe('home');
  });

  it('defines a page route for every section', () => {
    for (const path of ['/about', '/experience', '/skills', '/education', '/contact']) {
      expect(routes.some((r) => r.path === path)).toBe(true);
    }
  });
});

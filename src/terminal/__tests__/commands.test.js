import { describe, it, expect } from 'vitest';
import { parseCommand, SECTIONS } from '../commands.js';

describe('parseCommand', () => {
  it('exposes the five sections', () => {
    expect(SECTIONS).toEqual(['about', 'experience', 'skills', 'education', 'contact']);
  });

  it('navigates on bare section name', () => {
    expect(parseCommand('about')).toEqual({ type: 'navigate', to: '/about' });
  });

  it('navigates on cd <section> and open <section>', () => {
    expect(parseCommand('cd skills')).toEqual({ type: 'navigate', to: '/skills' });
    expect(parseCommand('open contact')).toEqual({ type: 'navigate', to: '/contact' });
  });

  it('handles ls, help, clear', () => {
    expect(parseCommand('ls')).toEqual({ type: 'ls' });
    expect(parseCommand('help')).toEqual({ type: 'help' });
    expect(parseCommand('clear')).toEqual({ type: 'clear' });
  });

  it('replays whoami and cat profile.txt', () => {
    expect(parseCommand('whoami')).toEqual({ type: 'replay', key: 'whoami' });
    expect(parseCommand('cat profile.txt')).toEqual({ type: 'replay', key: 'profile' });
  });

  it('treats empty input as noop', () => {
    expect(parseCommand('   ')).toEqual({ type: 'noop' });
  });

  it('errors on unknown command', () => {
    expect(parseCommand('sudo rm')).toEqual({ type: 'error', message: 'command not found: sudo' });
  });

  it('errors on cd to unknown section', () => {
    expect(parseCommand('cd nope')).toEqual({ type: 'error', message: 'cd: no such section: nope' });
  });

  it('navigates to blog on bare/cd/open', () => {
    expect(parseCommand('blog')).toEqual({ type: 'navigate', to: '/blog' });
    expect(parseCommand('cd blog')).toEqual({ type: 'navigate', to: '/blog' });
    expect(parseCommand('open blog')).toEqual({ type: 'navigate', to: '/blog' });
  });
});

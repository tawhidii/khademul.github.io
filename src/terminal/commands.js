export const SECTIONS = ['about', 'experience', 'skills', 'education', 'contact'];
export const NAV_TARGETS = [...SECTIONS, 'blog'];

export function parseCommand(input) {
  const raw = String(input).trim();
  if (raw === '') return { type: 'noop' };

  const [cmd, ...args] = raw.split(/\s+/);
  const arg = args[0];

  switch (cmd) {
    case 'ls':
      return { type: 'ls' };
    case 'help':
      return { type: 'help' };
    case 'clear':
      return { type: 'clear' };
    case 'whoami':
      return { type: 'replay', key: 'whoami' };
    case 'cat':
      if (arg === 'profile.txt') return { type: 'replay', key: 'profile' };
      return { type: 'error', message: `cat: ${arg ?? ''}: No such file` };
    case 'cd':
    case 'open':
      if (NAV_TARGETS.includes(arg)) return { type: 'navigate', to: `/${arg}` };
      return { type: 'error', message: `${cmd}: no such section: ${arg ?? ''}` };
    default:
      if (NAV_TARGETS.includes(cmd)) return { type: 'navigate', to: `/${cmd}` };
      return { type: 'error', message: `command not found: ${cmd}` };
  }
}

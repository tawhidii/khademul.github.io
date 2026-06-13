# BR2049 Terminal Portfolio Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the portfolio homepage into a terminal-only landing that routes to per-section pages, restyled with a Blade Runner 2049 teal/cyan atmospheric theme.

**Architecture:** Add `vue-router` (history mode). `/` renders a `TerminalHome` with clickable section links and a typed-command parser; each section becomes its own routed page reusing existing section components. A fixed atmospheric FX layer (fog/scanlines/glitch) sits behind content, fully gated by `prefers-reduced-motion`. `/my-zone` stays on its own non-router mount, untouched.

**Tech Stack:** Vue 3 (`<script setup>`), Vite 8, vue-router 4, Vitest + @vue/test-utils, JetBrains Mono + Rajdhani.

---

## File Structure

**Create:**
- `src/router/index.js` — route table + router instance.
- `src/terminal/commands.js` — pure command parser + `SECTIONS`.
- `src/terminal/__tests__/commands.test.js` — parser unit tests.
- `src/components/TerminalHome.vue` — terminal landing (links + typed commands).
- `src/components/ReturnLink.vue` — `> return to terminal` router-link.
- `src/components/AtmosphereFX.vue` — fixed fog/scanline/flicker layer.
- `src/pages/AboutPage.vue`, `ExperiencePage.vue`, `SkillsPage.vue`, `EducationPage.vue`, `ContactPage.vue` — thin page wrappers.
- `src/components/__tests__/TerminalHome.test.js`, `src/components/__tests__/ReturnLink.test.js`, `src/pages/__tests__/pages.test.js`.

**Modify:**
- `src/assets/styles/main.css` — BR2049 tokens, Rajdhani import, glow/scanline base, motion gating.
- `src/App.vue` — render `<AtmosphereFX/>` + `<router-view/>`, drop `SiteNav`/sections/footer-on-home.
- `src/main.js` — wire router; keep restore-before-router ordering; keep my-zone branch.

**Delete:**
- `src/components/SiteNav.vue` + `src/components/__tests__/SiteNav.test.js` (retired from public site).
- `src/components/TerminalHero.vue` + its test (replaced by `TerminalHome`).

---

## Task 1: Install vue-router and scaffold the router

**Files:**
- Modify: `package.json` (dependency added by npm)
- Create: `src/router/index.js`
- Test: `src/router/__tests__/router.test.js`

- [ ] **Step 1: Install vue-router**

Run:
```bash
npm install vue-router@4
```
Expected: `vue-router` appears under `dependencies` in `package.json`, exit 0.

- [ ] **Step 2: Write the failing test**

Create `src/router/__tests__/router.test.js`:
```js
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/router/__tests__/router.test.js`
Expected: FAIL — cannot resolve `../index.js`.

- [ ] **Step 4: Create the router**

Create `src/router/index.js`:
```js
import { createRouter, createWebHistory } from 'vue-router';
import TerminalHome from '../components/TerminalHome.vue';
import AboutPage from '../pages/AboutPage.vue';
import ExperiencePage from '../pages/ExperiencePage.vue';
import SkillsPage from '../pages/SkillsPage.vue';
import EducationPage from '../pages/EducationPage.vue';
import ContactPage from '../pages/ContactPage.vue';

export const routes = [
  { path: '/', name: 'home', component: TerminalHome },
  { path: '/about', name: 'about', component: AboutPage },
  { path: '/experience', name: 'experience', component: ExperiencePage },
  { path: '/skills', name: 'skills', component: SkillsPage },
  { path: '/education', name: 'education', component: EducationPage },
  { path: '/contact', name: 'contact', component: ContactPage },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHistory('/'),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});
```

Note: components imported here are created in later tasks. The router test only imports `routes` (array literal), so it passes before those components exist as long as the imports resolve. To keep this task self-contained, create empty stub files now and flesh them out later:

Create `src/components/TerminalHome.vue`, `src/pages/AboutPage.vue`, `src/pages/ExperiencePage.vue`, `src/pages/SkillsPage.vue`, `src/pages/EducationPage.vue`, `src/pages/ContactPage.vue`, each with:
```vue
<template><div /></template>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/router/__tests__/router.test.js`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/router src/components/TerminalHome.vue src/pages
git commit -m "feat(router): add vue-router with section routes and stubs"
```

---

## Task 2: BR2049 theme tokens and base styles

**Files:**
- Modify: `src/assets/styles/main.css`

No unit test (pure CSS). Verified visually in Task 9.

- [ ] **Step 1: Replace the font import and `:root` tokens**

In `src/assets/styles/main.css`, replace lines 1–21 (the `@import` and `:root` block) with:
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Rajdhani:wght@500;600;700&display=swap');

:root {
  /* BR2049 teal/cyan LA palette */
  --bg:       #05080d;
  --bg-elev:  #0a1018;
  --border:   #15303a;
  --text:     #b8d4dd;
  --text-dim: #5f7d88;

  --cyan:     #5ef2ff;   /* primary */
  --holo:     #2b6cff;   /* holographic blue */
  --amber:    #ff9d3c;   /* sparing accent / glow */
  --danger:   #ff3b6b;   /* magenta */

  /* Map legacy token names so existing components inherit the theme */
  --prompt:   var(--cyan);
  --accent:   var(--holo);
  --warn:     var(--amber);

  --glow-cyan:  0 0 6px rgba(94, 242, 255, 0.55);
  --glow-amber: 0 0 8px rgba(255, 157, 60, 0.5);

  --font-display: 'Rajdhani', sans-serif;

  --fs-xs: 14px;
  --fs-sm: 16px;
  --fs-md: 20px;
  --fs-lg: 28px;
  --fs-xl: 40px;

  --rhythm: 96px;
  --content-max: 880px;
}
```

- [ ] **Step 2: Add display-font + glow heading rules**

In `src/assets/styles/main.css`, replace the `h1, h2, h3` block (was lines 47–49) with:
```css
h1, h2, h3 {
  margin: 0;
  font-weight: 700;
  font-family: var(--font-display);
  letter-spacing: 0.02em;
  text-shadow: var(--glow-cyan);
}
h2 { font-size: var(--fs-lg); }
h3 { font-size: var(--fs-md); }
```

- [ ] **Step 3: Add scanline keyframes and reduced-motion guard at end of file**

Append to `src/assets/styles/main.css`:
```css
@keyframes scanline-drift {
  from { background-position: 0 0; }
  to   { background-position: 0 100vh; }
}
@keyframes fog-drift {
  from { transform: translate3d(-2%, 0, 0); }
  to   { transform: translate3d(2%, 1%, 0); }
}
@keyframes flicker {
  0%, 19%, 21%, 23%, 100% { opacity: 0.06; }
  20%, 22% { opacity: 0.02; }
}
```

The existing `@media (prefers-reduced-motion: reduce)` block at the end already zeroes all animations/transitions — leave it; it covers the new keyframes.

- [ ] **Step 4: Run the full test suite (no regressions from CSS)**

Run: `npx vitest run`
Expected: existing tests still PASS (CSS not asserted). Some component tests will fail later only because of component changes — at this point only CSS changed, so expect the same pass/fail baseline as before this task.

- [ ] **Step 5: Commit**

```bash
git add src/assets/styles/main.css
git commit -m "feat(theme): BR2049 teal/cyan palette, Rajdhani display font, glow + scanline base"
```

---

## Task 3: Atmosphere FX layer

**Files:**
- Create: `src/components/AtmosphereFX.vue`
- Test: `src/components/__tests__/AtmosphereFX.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/AtmosphereFX.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AtmosphereFX from '../AtmosphereFX.vue';

describe('AtmosphereFX', () => {
  it('renders aria-hidden fog and scanline layers', () => {
    const wrapper = mount(AtmosphereFX);
    const root = wrapper.find('.atmosphere');
    expect(root.exists()).toBe(true);
    expect(root.attributes('aria-hidden')).toBe('true');
    expect(wrapper.find('.fog').exists()).toBe(true);
    expect(wrapper.find('.scanlines').exists()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/__tests__/AtmosphereFX.test.js`
Expected: FAIL — cannot resolve `../AtmosphereFX.vue`.

- [ ] **Step 3: Create the component**

Create `src/components/AtmosphereFX.vue`:
```vue
<template>
  <div class="atmosphere" aria-hidden="true">
    <div class="fog"></div>
    <div class="scanlines"></div>
    <div class="flicker"></div>
  </div>
</template>

<style scoped>
.atmosphere {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.fog {
  position: absolute;
  inset: -10%;
  background:
    radial-gradient(60% 40% at 30% 20%, rgba(43, 108, 255, 0.10), transparent 70%),
    radial-gradient(50% 50% at 75% 70%, rgba(94, 242, 255, 0.08), transparent 70%),
    radial-gradient(40% 30% at 50% 90%, rgba(255, 157, 60, 0.06), transparent 70%);
  filter: blur(40px);
  animation: fog-drift 22s ease-in-out infinite alternate;
}
.scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0,
    rgba(0, 0, 0, 0) 2px,
    rgba(0, 0, 0, 0.18) 3px,
    rgba(0, 0, 0, 0) 4px
  );
  background-size: 100% 6px;
  animation: scanline-drift 8s linear infinite;
  opacity: 0.5;
}
.flicker {
  position: absolute;
  inset: 0;
  background: rgba(94, 242, 255, 0.04);
  animation: flicker 6s steps(1) infinite;
}
</style>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/__tests__/AtmosphereFX.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/AtmosphereFX.vue src/components/__tests__/AtmosphereFX.test.js
git commit -m "feat(theme): atmospheric fog + scanline + flicker layer"
```

---

## Task 4: Terminal command parser (pure)

**Files:**
- Create: `src/terminal/commands.js`
- Test: `src/terminal/__tests__/commands.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/terminal/__tests__/commands.test.js`:
```js
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/terminal/__tests__/commands.test.js`
Expected: FAIL — cannot resolve `../commands.js`.

- [ ] **Step 3: Implement the parser**

Create `src/terminal/commands.js`:
```js
export const SECTIONS = ['about', 'experience', 'skills', 'education', 'contact'];

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
      if (SECTIONS.includes(arg)) return { type: 'navigate', to: `/${arg}` };
      return { type: 'error', message: `${cmd}: no such section: ${arg ?? ''}` };
    default:
      if (SECTIONS.includes(cmd)) return { type: 'navigate', to: `/${cmd}` };
      return { type: 'error', message: `command not found: ${cmd}` };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/terminal/__tests__/commands.test.js`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/terminal/commands.js src/terminal/__tests__/commands.test.js
git commit -m "feat(terminal): pure command parser for typed navigation"
```

---

## Task 5: TerminalHome component

**Files:**
- Modify: `src/components/TerminalHome.vue` (replace the stub)
- Test: `src/components/__tests__/TerminalHome.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/TerminalHome.test.js`:
```js
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import TerminalHome from '../TerminalHome.vue';
import { routes } from '../../router/index.js';

function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes });
}

describe('TerminalHome', () => {
  let router;
  beforeEach(async () => {
    router = makeRouter();
    router.push('/');
    await router.isReady();
  });

  it('renders a clickable link per section', () => {
    const wrapper = mount(TerminalHome, { global: { plugins: [router] } });
    const links = wrapper.findAll('.section-link');
    expect(links).toHaveLength(5);
  });

  it('navigates when a section link is clicked', async () => {
    const wrapper = mount(TerminalHome, { global: { plugins: [router] } });
    await wrapper.findAll('.section-link')[0].trigger('click');
    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/about');
  });

  it('navigates when a typed command is submitted', async () => {
    const wrapper = mount(TerminalHome, { global: { plugins: [router] } });
    const input = wrapper.find('input.cmd-input');
    await input.setValue('cd skills');
    await wrapper.find('form.cmd-form').trigger('submit.prevent');
    expect(router.currentRoute.value.path).toBe('/skills');
  });

  it('shows an error line for unknown commands', async () => {
    const wrapper = mount(TerminalHome, { global: { plugins: [router] } });
    const input = wrapper.find('input.cmd-input');
    await input.setValue('badcmd');
    await wrapper.find('form.cmd-form').trigger('submit.prevent');
    expect(wrapper.text()).toContain('command not found: badcmd');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/__tests__/TerminalHome.test.js`
Expected: FAIL — stub renders no `.section-link`.

- [ ] **Step 3: Implement TerminalHome**

Replace `src/components/TerminalHome.vue` with:
```vue
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { parseCommand, SECTIONS } from '../terminal/commands.js';

const router = useRouter();

const bootLines = [
  { kind: 'prompt', text: 'visitor@bari.dev:~$ whoami' },
  { kind: 'out',    text: '> Khondoker Khademul Bari' },
  { kind: 'out',    text: '> Software Engineer · Dhaka, Bangladesh' },
  { kind: 'blank',  text: '' },
  { kind: 'prompt', text: 'visitor@bari.dev:~$ cat profile.txt' },
  { kind: 'out',    text: '> 4+ years building backend systems in Python, Go, JS.' },
  { kind: 'out',    text: '> Currently @ Mutual Trust Bank PLC (May 2026 – Present).' },
  { kind: 'blank',  text: '' },
  { kind: 'prompt', text: 'visitor@bari.dev:~$ ls sections/' },
  { kind: 'links' },
  { kind: 'blank',  text: '' },
  { kind: 'hint-line' },
];

const replayText = {
  whoami: ['> Khondoker Khademul Bari', '> Software Engineer · Dhaka, Bangladesh'],
  profile: ['> 4+ years building backend systems in Python, Go, JS.',
            '> Currently @ Mutual Trust Bank PLC (May 2026 – Present).'],
};

const sectionLinks = SECTIONS.map((s) => ({ to: `/${s}`, label: `${s}/` }));

const visibleLines = ref([]);   // boot output
const history = ref([]);        // post-boot output
const done = ref(false);
const command = ref('');
const inputEl = ref(null);

let lineIdx = 0;
let charIdx = 0;
let timer = null;

function reducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function tick() {
  if (lineIdx >= bootLines.length) {
    finish();
    return;
  }
  const line = bootLines[lineIdx];
  if (line.kind !== 'out') {
    visibleLines.value = [...visibleLines.value, { ...line, shown: line.text || '' }];
    lineIdx += 1;
    timer = setTimeout(tick, line.kind === 'blank' ? 60 : 200);
    return;
  }
  charIdx += 1;
  const pending = line.text.slice(0, charIdx);
  const last = visibleLines.value[visibleLines.value.length - 1];
  if (last && last.kind === 'out' && last.fullText === line.text) {
    visibleLines.value = [...visibleLines.value.slice(0, -1), { kind: 'out', shown: pending, fullText: line.text }];
  } else {
    visibleLines.value = [...visibleLines.value, { kind: 'out', shown: pending, fullText: line.text }];
  }
  if (charIdx >= line.text.length) {
    lineIdx += 1; charIdx = 0;
    timer = setTimeout(tick, 160);
  } else {
    timer = setTimeout(tick, 28);
  }
}

function finish() {
  done.value = true;
  nextTick(() => { if (inputEl.value) inputEl.value.focus(); });
}

function skip() {
  if (timer) clearTimeout(timer);
  visibleLines.value = bootLines.map((l) => ({ ...l, shown: l.text || '', fullText: l.text || '' }));
  lineIdx = bootLines.length;
  charIdx = 0;
  finish();
}

function onSkipEvent() {
  if (!done.value) skip();
}

function go(to) {
  router.push(to);
}

function pushEcho(text) {
  history.value = [...history.value, { kind: 'prompt', text: `visitor@bari.dev:~$ ${text}` }];
}

function runCommand() {
  const input = command.value;
  command.value = '';
  const action = parseCommand(input);
  if (action.type === 'noop') return;
  pushEcho(input);
  switch (action.type) {
    case 'navigate':
      go(action.to);
      break;
    case 'ls':
      history.value = [...history.value, { kind: 'ls' }];
      break;
    case 'help':
      history.value = [...history.value,
        { kind: 'out', text: 'commands: ls · cd <section> · open <section> · <section> · whoami · cat profile.txt · clear · help' }];
      break;
    case 'clear':
      history.value = [];
      break;
    case 'replay':
      history.value = [...history.value, ...replayText[action.key].map((t) => ({ kind: 'out', text: t }))];
      break;
    case 'error':
      history.value = [...history.value, { kind: 'error', text: action.message }];
      break;
  }
}

onMounted(() => {
  if (reducedMotion()) { skip(); return; }
  timer = setTimeout(tick, 180);
  window.addEventListener('keydown', onSkipEvent);
});

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
  window.removeEventListener('keydown', onSkipEvent);
});
</script>

<template>
  <section class="terminal" @click="onSkipEvent">
    <div class="window">
      <div class="title-bar">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="title">bash — visitor@bari.dev</span>
      </div>
      <div class="body">
        <pre class="boot"><template v-for="(line, i) in visibleLines" :key="`b${i}`"><span v-if="line.kind === 'prompt'" class="prompt-line">{{ line.shown }}</span><span v-else-if="line.kind === 'out'" class="out-line">{{ line.shown }}</span><span v-else-if="line.kind === 'links'" class="ls-line"><RouterLink v-for="l in sectionLinks" :key="l.to" :to="l.to" class="section-link">{{ l.label }}</RouterLink></span><span v-else-if="line.kind === 'hint-line' && done" class="hint">type a command (try `help`) or click a section</span><br /></template></pre>

        <pre class="output" v-if="done"><template v-for="(line, i) in history" :key="`h${i}`"><span v-if="line.kind === 'prompt'" class="prompt-line">{{ line.text }}</span><span v-else-if="line.kind === 'out'" class="out-line">{{ line.text }}</span><span v-else-if="line.kind === 'error'" class="error-line">{{ line.text }}</span><span v-else-if="line.kind === 'ls'" class="ls-line"><RouterLink v-for="l in sectionLinks" :key="l.to" :to="l.to" class="section-link">{{ l.label }}</RouterLink></span><br /></template></pre>

        <form v-if="done" class="cmd-form" @submit.prevent="runCommand">
          <span class="prompt-line">visitor@bari.dev:~$</span>
          <input
            ref="inputEl"
            v-model="command"
            class="cmd-input"
            type="text"
            autocomplete="off"
            spellcheck="false"
            aria-label="terminal command input"
          />
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.terminal {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 64px 16px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.window {
  width: 100%;
  max-width: 760px;
  background: rgba(10, 16, 24, 0.82);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 24px rgba(43, 108, 255, 0.18), var(--glow-cyan);
  backdrop-filter: blur(4px);
}
.title-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #07121a;
  border-bottom: 1px solid var(--border);
  font-size: var(--fs-xs);
  color: var(--text-dim);
}
.dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
.dot.red    { background: var(--danger); }
.dot.yellow { background: var(--amber); }
.dot.green  { background: var(--cyan); }
.title { margin-left: 8px; }
.body { padding: 20px 24px; }
.boot, .output {
  margin: 0;
  font-family: inherit;
  font-size: var(--fs-sm);
  line-height: 1.7;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
}
.prompt-line { color: var(--prompt); text-shadow: var(--glow-cyan); }
.out-line    { color: var(--text); }
.error-line  { color: var(--danger); }
.section-link {
  color: var(--accent);
  margin-right: 1.5ch;
  text-decoration: none;
  transition: text-shadow 0.15s ease;
}
.section-link:hover { text-shadow: var(--glow-cyan); text-decoration: underline; }
.hint { color: var(--text-dim); font-size: var(--fs-xs); }
.cmd-form { display: flex; gap: 1ch; align-items: baseline; margin-top: 4px; }
.cmd-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: inherit;
  font-size: var(--fs-sm);
  caret-color: var(--cyan);
}
</style>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/__tests__/TerminalHome.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/TerminalHome.vue src/components/__tests__/TerminalHome.test.js
git commit -m "feat(terminal): TerminalHome with router links + typed-command shell"
```

---

## Task 6: ReturnLink component

**Files:**
- Modify: `src/components/ReturnLink.vue` (create real component; no stub existed)
- Test: `src/components/__tests__/ReturnLink.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/ReturnLink.test.js`:
```js
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import ReturnLink from '../ReturnLink.vue';
import { routes } from '../../router/index.js';

describe('ReturnLink', () => {
  let router;
  beforeEach(async () => {
    router = createRouter({ history: createMemoryHistory(), routes });
    router.push('/about');
    await router.isReady();
  });

  it('links back to the terminal home', () => {
    const wrapper = mount(ReturnLink, { global: { plugins: [router] } });
    const link = wrapper.find('a.return-link');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('/');
    expect(link.text()).toContain('return to terminal');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/__tests__/ReturnLink.test.js`
Expected: FAIL — cannot resolve `../ReturnLink.vue`.

- [ ] **Step 3: Create the component**

Create `src/components/ReturnLink.vue`:
```vue
<template>
  <RouterLink to="/" class="return-link">
    <span class="prompt">visitor@bari.dev:~$</span>
    <span class="cmd">cd&nbsp;~</span>
    <span class="label">&gt; return to terminal</span>
  </RouterLink>
</template>

<style scoped>
.return-link {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.75ch;
  align-items: baseline;
  margin-top: var(--rhythm);
  font-size: var(--fs-sm);
  text-decoration: none;
  color: var(--text-dim);
}
.prompt { color: var(--prompt); text-shadow: var(--glow-cyan); }
.cmd { color: var(--text-dim); }
.label { color: var(--accent); }
.return-link:hover .label { text-shadow: var(--glow-cyan); text-decoration: underline; }
</style>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/__tests__/ReturnLink.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/ReturnLink.vue src/components/__tests__/ReturnLink.test.js
git commit -m "feat(nav): ReturnLink back-to-terminal component"
```

---

## Task 7: Section page wrappers

**Files:**
- Modify: `src/pages/AboutPage.vue`, `ExperiencePage.vue`, `SkillsPage.vue`, `EducationPage.vue`, `ContactPage.vue` (replace stubs)
- Test: `src/pages/__tests__/pages.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/pages/__tests__/pages.test.js`:
```js
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { routes } from '../../router/index.js';
import AboutPage from '../AboutPage.vue';
import ExperiencePage from '../ExperiencePage.vue';
import SkillsPage from '../SkillsPage.vue';
import EducationPage from '../EducationPage.vue';
import ContactPage from '../ContactPage.vue';

const cases = [
  ['About', AboutPage, 'about'],
  ['Experience', ExperiencePage, 'experience'],
  ['Skills', SkillsPage, 'skills'],
  ['Education', EducationPage, 'education'],
  ['Contact', ContactPage, 'contact'],
];

describe('section pages', () => {
  let router;
  beforeEach(async () => {
    router = createRouter({ history: createMemoryHistory(), routes });
    router.push('/');
    await router.isReady();
  });

  it.each(cases)('%s page renders its section header and a return link', (_name, Page, sectionName) => {
    const wrapper = mount(Page, { global: { plugins: [router] } });
    expect(wrapper.find('.section-header').exists()).toBe(true);
    expect(wrapper.find('.section-header').text()).toContain(`${sectionName}.md`);
    expect(wrapper.find('a.return-link').exists()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/__tests__/pages.test.js`
Expected: FAIL — stub pages render no `.section-header`.

- [ ] **Step 3: Implement the five pages**

Replace `src/pages/AboutPage.vue`:
```vue
<script setup>
import AboutSection from '../components/AboutSection.vue';
import ReturnLink from '../components/ReturnLink.vue';
</script>
<template>
  <main class="page">
    <AboutSection />
    <ReturnLink />
  </main>
</template>
<style scoped>
.page { position: relative; z-index: 1; max-width: var(--content-max); margin: 0 auto; padding: 80px 24px 96px; }
</style>
```

Replace `src/pages/ExperiencePage.vue`:
```vue
<script setup>
import ExperienceSection from '../components/ExperienceSection.vue';
import ReturnLink from '../components/ReturnLink.vue';
</script>
<template>
  <main class="page">
    <ExperienceSection />
    <ReturnLink />
  </main>
</template>
<style scoped>
.page { position: relative; z-index: 1; max-width: var(--content-max); margin: 0 auto; padding: 80px 24px 96px; }
</style>
```

Replace `src/pages/SkillsPage.vue`:
```vue
<script setup>
import SkillsSection from '../components/SkillsSection.vue';
import ReturnLink from '../components/ReturnLink.vue';
</script>
<template>
  <main class="page">
    <SkillsSection />
    <ReturnLink />
  </main>
</template>
<style scoped>
.page { position: relative; z-index: 1; max-width: var(--content-max); margin: 0 auto; padding: 80px 24px 96px; }
</style>
```

Replace `src/pages/EducationPage.vue`:
```vue
<script setup>
import EducationSection from '../components/EducationSection.vue';
import ReturnLink from '../components/ReturnLink.vue';
</script>
<template>
  <main class="page">
    <EducationSection />
    <ReturnLink />
  </main>
</template>
<style scoped>
.page { position: relative; z-index: 1; max-width: var(--content-max); margin: 0 auto; padding: 80px 24px 96px; }
</style>
```

Replace `src/pages/ContactPage.vue`:
```vue
<script setup>
import ContactSection from '../components/ContactSection.vue';
import ReturnLink from '../components/ReturnLink.vue';
</script>
<template>
  <main class="page">
    <ContactSection />
    <ReturnLink />
  </main>
</template>
<style scoped>
.page { position: relative; z-index: 1; max-width: var(--content-max); margin: 0 auto; padding: 80px 24px 96px; }
</style>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/pages/__tests__/pages.test.js`
Expected: PASS (5 cases).

Note: the test asserts `.section-header` text contains `<section>.md` — this matches the existing `SectionHeader.vue` which renders `cat <name>.md`. Each existing section component (`AboutSection` etc.) already renders `SectionHeader` with the correct `name`.

- [ ] **Step 5: Commit**

```bash
git add src/pages
git commit -m "feat(pages): section page wrappers with return-to-terminal link"
```

---

## Task 8: Wire App.vue + main.js, retire SiteNav & TerminalHero

**Files:**
- Modify: `src/App.vue`
- Modify: `src/main.js`
- Delete: `src/components/SiteNav.vue`, `src/components/__tests__/SiteNav.test.js`
- Delete: `src/components/TerminalHero.vue`, `src/components/__tests__/TerminalHero.test.js`

- [ ] **Step 1: Rewrite App.vue**

Replace `src/App.vue` with:
```vue
<script setup>
import AtmosphereFX from './components/AtmosphereFX.vue';
</script>

<template>
  <AtmosphereFX />
  <RouterView />
</template>
```

- [ ] **Step 2: Wire the router in main.js**

Replace `src/main.js` with:
```js
import { createApp } from 'vue';
import './assets/styles/main.css';

// Restore the original path stashed by public/404.html (GitHub Pages SPA fallback).
// MUST run before the router reads window.location.
const stashed = sessionStorage.getItem('spa-redirect-path');
if (stashed) {
  sessionStorage.removeItem('spa-redirect-path');
  history.replaceState(null, '', stashed);
}

const path = window.location.pathname;
const isMyZone = path === '/my-zone' || path === '/my-zone/';

if (isMyZone) {
  import('./my-zone/MyZoneApp.vue').then(({ default: MyZoneApp }) => {
    createApp(MyZoneApp).mount('#app');
  });
} else {
  Promise.all([
    import('./App.vue'),
    import('./router/index.js'),
  ]).then(([{ default: App }, { router }]) => {
    createApp(App).use(router).mount('#app');
  });
}
```

- [ ] **Step 3: Delete retired files**

Run:
```bash
git rm src/components/SiteNav.vue src/components/__tests__/SiteNav.test.js \
       src/components/TerminalHero.vue src/components/__tests__/TerminalHero.test.js
```
Expected: four files removed.

- [ ] **Step 4: Run the full suite**

Run: `npx vitest run`
Expected: PASS. No test references `SiteNav` or `TerminalHero` anymore (their tests were deleted). All section, page, terminal, parser, router, and FX tests pass.

If any leftover test imports a deleted file, remove that import/test — those were the retired components.

- [ ] **Step 5: Commit**

```bash
git add src/App.vue src/main.js
git commit -m "feat(app): router-view shell + atmosphere; retire SiteNav and TerminalHero"
```

---

## Task 9: Build verification and visual polish

**Files:**
- Possibly modify: `src/assets/styles/main.css`, `src/components/AtmosphereFX.vue` (tuning only)

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: build succeeds, exit 0, `dist/` produced, no unresolved imports.

- [ ] **Step 2: Full test suite**

Run: `npx vitest run`
Expected: all tests PASS.

- [ ] **Step 3: Manual smoke (dev server)**

Run: `npm run dev`, open the local URL. Verify:
- `/` shows terminal only (no sections below), fog + scanlines visible.
- Clicking a section link routes to that page; URL updates.
- Typing `cd skills` + Enter routes to `/skills`; `help` prints commands; `badcmd` prints `command not found: badcmd`.
- Each page shows its content + `> return to terminal`, which returns to `/`.
- Deep-link: reload on `/about` resolves correctly (404 fallback path).
- Toggle OS "reduce motion": fog/scanline/flicker animations stop, palette stays readable.
- `/my-zone` still loads the notes app unchanged.

Tune fog opacity / scanline strength / glow in `main.css` or `AtmosphereFX.vue` only if readability suffers.

- [ ] **Step 4: Commit any tuning**

```bash
git add -A
git commit -m "chore(theme): readability tuning for atmospheric FX"
```

(Skip if no changes.)

---

## Self-Review Notes

- **Spec coverage:** routing (T1), BR2049 palette + fonts + glow (T2), atmospheric FX gated by reduced-motion (T2 keyframes + existing media block + T3), terminal links + typed commands (T4 parser, T5 component), back-to-terminal-only nav (T6 ReturnLink, T7 pages, T8 SiteNav removal), all five pages reusing existing components (T7), my-zone untouched (T8 keeps branch), GitHub Pages restore-before-router (T8 main.js), testing per unit (every task). All spec sections mapped.
- **Token reuse:** legacy `--prompt/--accent/--warn` remapped to cyan/holo/amber so existing section components inherit the theme without edits.
- **Type consistency:** parser action shapes (`navigate`/`ls`/`help`/`clear`/`replay`/`error`/`noop`) defined in T4 are consumed identically in T5. `routes` export name used across T1/T5/T6/T7 tests. `router` named export used in T8.

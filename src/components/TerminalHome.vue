<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
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

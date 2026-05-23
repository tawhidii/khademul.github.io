<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const lines = [
  { kind: 'prompt', text: 'visitor@bari.dev:~$ whoami' },
  { kind: 'out',    text: '> Khondoker Khademul Bari' },
  { kind: 'out',    text: '> Software Engineer · Dhaka, Bangladesh' },
  { kind: 'blank',  text: '' },
  { kind: 'prompt', text: 'visitor@bari.dev:~$ cat profile.txt' },
  { kind: 'out',    text: '> 4+ years building backend systems in Python, Go, JS.' },
  { kind: 'out',    text: '> Currently @ Techjays (Sep 2025 – Apr 2026).' },
  { kind: 'blank',  text: '' },
  { kind: 'prompt', text: 'visitor@bari.dev:~$ ls sections/' },
  { kind: 'links' },
  { kind: 'blank',  text: '' },
  { kind: 'prompt', text: 'visitor@bari.dev:~$ ' },
];

const sectionLinks = [
  { href: '#about',      label: 'about/' },
  { href: '#experience', label: 'experience/' },
  { href: '#skills',     label: 'skills/' },
  { href: '#education',  label: 'education/' },
  { href: '#contact',    label: 'contact/' },
];

const visibleLines = ref([]);
const done = ref(false);
let lineIdx = 0;
let charIdx = 0;
let timer = null;

function reducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function tick() {
  if (lineIdx >= lines.length) {
    done.value = true;
    return;
  }
  const line = lines[lineIdx];

  if (line.kind === 'prompt' || line.kind === 'blank' || line.kind === 'links') {
    visibleLines.value = [...visibleLines.value, { ...line, shown: line.text || '' }];
    lineIdx += 1;
    timer = setTimeout(tick, line.kind === 'blank' ? 60 : 220);
    return;
  }

  charIdx += 1;
  const pending = line.text.slice(0, charIdx);
  const last = visibleLines.value[visibleLines.value.length - 1];
  if (last && last.kind === 'out' && last.fullText === line.text) {
    visibleLines.value = [
      ...visibleLines.value.slice(0, -1),
      { kind: 'out', shown: pending, fullText: line.text },
    ];
  } else {
    visibleLines.value = [...visibleLines.value, { kind: 'out', shown: pending, fullText: line.text }];
  }

  if (charIdx >= line.text.length) {
    lineIdx += 1;
    charIdx = 0;
    timer = setTimeout(tick, 180);
  } else {
    timer = setTimeout(tick, 30);
  }
}

function skip() {
  if (timer) clearTimeout(timer);
  visibleLines.value = lines.map((l) => ({
    ...l,
    shown: l.text || '',
    fullText: l.text || '',
  }));
  lineIdx = lines.length;
  charIdx = 0;
  done.value = true;
}

function onSkipEvent() {
  if (!done.value) skip();
}

onMounted(() => {
  if (reducedMotion()) {
    skip();
    return;
  }
  timer = setTimeout(tick, 200);
  window.addEventListener('keydown', onSkipEvent);
  window.addEventListener('scroll', onSkipEvent, { passive: true });
});

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
  window.removeEventListener('keydown', onSkipEvent);
  window.removeEventListener('scroll', onSkipEvent);
});

defineExpose({ skip });
</script>

<template>
  <header class="terminal" @click="onSkipEvent">
    <div class="window">
      <div class="title-bar">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="title">bash — visitor@bari.dev</span>
      </div>
      <pre class="body"><template v-for="(line, i) in visibleLines" :key="i"><span v-if="line.kind === 'prompt'" class="prompt-line">{{ line.shown }}</span><span v-else-if="line.kind === 'out'" class="out-line">{{ line.shown }}</span><span v-else-if="line.kind === 'links'" class="ls-line"><a v-for="l in sectionLinks" :key="l.href" :href="l.href" class="section-link">{{ l.label }}</a></span><br /></template><span v-if="done" class="cursor">_</span></pre>
    </div>
    <p class="hint" v-if="done">↓ scroll, or pick a section above</p>
  </header>
</template>

<style scoped>
.terminal {
  padding: 64px 16px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: default;
}
.window {
  width: 100%;
  max-width: 760px;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.title-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #21262d;
  border-bottom: 1px solid var(--border);
  font-size: var(--fs-xs);
  color: var(--text-dim);
}
.dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
.dot.red    { background: #ff5f56; }
.dot.yellow { background: #ffbd2e; }
.dot.green  { background: #27c93f; }
.title { margin-left: 8px; }
.body {
  margin: 0;
  padding: 20px 24px;
  font-family: inherit;
  font-size: var(--fs-sm);
  line-height: 1.7;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
}
.prompt-line { color: var(--prompt); }
.out-line    { color: var(--text); }
.ls-line     { display: inline; }
.section-link {
  color: var(--accent);
  margin-right: 1.5ch;
  text-decoration: none;
}
.section-link:hover { text-decoration: underline; }
.cursor {
  display: inline-block;
  width: 1ch;
  background: var(--text);
  color: var(--bg);
  animation: blink 1s steps(2, start) infinite;
}
@keyframes blink { to { visibility: hidden; } }
.hint {
  margin-top: 24px;
  color: var(--text-dim);
  font-size: var(--fs-xs);
}
@media (prefers-reduced-motion: reduce) {
  .cursor { animation: none; }
}
</style>

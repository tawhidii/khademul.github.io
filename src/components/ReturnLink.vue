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

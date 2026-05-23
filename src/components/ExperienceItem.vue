<script setup>
defineProps({
  item: { type: Object, required: true },
});
</script>

<template>
  <article class="exp-card">
    <header class="exp-head">
      <span class="company">{{ item.company }}</span>
      <span class="sep">·</span>
      <span class="role">{{ item.role }}</span>
    </header>
    <p class="meta">{{ item.start }} – {{ item.end }} · {{ item.location }}</p>
    <ul class="bullets">
      <li v-for="(b, i) in item.bullets" :key="i" class="bullet">{{ b }}</li>
    </ul>
    <div class="tags">
      <span v-for="t in item.tags" :key="t" class="tag">{{ t }}</span>
    </div>
  </article>
</template>

<style scoped>
.exp-card {
  border: 1px solid var(--border);
  background: var(--bg-elev);
  padding: 20px 24px;
  border-radius: 6px;
  margin-bottom: 20px;
}
.exp-head {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5ch;
  font-size: var(--fs-md);
}
.company { color: var(--prompt); font-weight: 700; }
.sep     { color: var(--text-dim); }
.role    { color: var(--warn); }
.meta {
  color: var(--text-dim);
  font-size: var(--fs-xs);
  margin: 4px 0 16px;
}
.bullets {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
}
.bullet {
  position: relative;
  padding-left: 1.6ch;
  margin: 6px 0;
  color: var(--text);
}
.bullet::before {
  content: '>';
  position: absolute;
  left: 0;
  color: var(--prompt);
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag {
  font-size: var(--fs-xs);
  color: var(--text-dim);
  border: 1px solid var(--border);
  padding: 3px 8px;
  border-radius: 3px;
}
</style>

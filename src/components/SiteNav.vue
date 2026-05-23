<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const sections = [
  { id: 'about',      label: 'about' },
  { id: 'experience', label: 'experience' },
  { id: 'skills',     label: 'skills' },
  { id: 'education',  label: 'education' },
  { id: 'contact',    label: 'contact' },
];

const active = ref('');
let observer = null;

onMounted(() => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) active.value = e.target.id;
      }
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
  );
  for (const s of sections) {
    const el = document.getElementById(s.id);
    if (el) observer.observe(el);
  }
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
});
</script>

<template>
  <nav class="site-nav" aria-label="Primary">
    <a
      v-for="s in sections"
      :key="s.id"
      :href="`#${s.id}`"
      :class="['nav-link', { active: active === s.id }]"
    >{{ s.label }}</a>
  </nav>
</template>

<style scoped>
.site-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  padding: 14px 16px;
  background: rgba(13, 17, 23, 0.85);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--border);
  font-size: var(--fs-xs);
}
.nav-link {
  color: var(--text-dim);
  text-decoration: none;
}
.nav-link:hover, .nav-link.active {
  color: var(--prompt);
}
</style>

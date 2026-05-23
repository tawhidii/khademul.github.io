<script setup>
import SectionHeader from './SectionHeader.vue';
import { education } from '../data/education.js';
</script>

<template>
  <section>
    <SectionHeader name="education" id="education" />
    <article v-for="e in education" :key="e.degree" class="edu-card">
      <header class="edu-head">{{ e.degree }}</header>
      <p class="meta">{{ e.school }} · {{ e.location }}</p>
      <p class="meta">{{ e.start }} – {{ e.end }} · GPA {{ e.gpa }}</p>
    </article>
  </section>
</template>

<style scoped>
.edu-card {
  border: 1px solid var(--border);
  background: var(--bg-elev);
  padding: 20px 24px;
  border-radius: 6px;
}
.edu-head {
  font-size: var(--fs-md);
  color: var(--warn);
  font-weight: 700;
}
.meta {
  color: var(--text-dim);
  font-size: var(--fs-xs);
  margin: 6px 0 0;
}
</style>

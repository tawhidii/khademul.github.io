<script setup>
import SectionHeader from './SectionHeader.vue';
import { profile } from '../data/profile.js';

const chips = ['4+ yrs experience', 'Backend focus', 'Open to remote'];
</script>

<template>
  <section>
    <SectionHeader name="about" id="about" />
    <p class="about-body">{{ profile.tagline }}</p>
    <p class="about-body">
      Highly motivated software engineer based in {{ profile.location }}, with deep experience
      shipping backend services across Python, Go, and JavaScript stacks. Comfortable from
      Django REST and FastAPI APIs through to AWS/GCP infrastructure and CI/CD pipelines.
    </p>
    <div class="chip-row">
      <span v-for="c in chips" :key="c" class="chip">{{ c }}</span>
    </div>
  </section>
</template>

<style scoped>
.about-body {
  margin: 0 0 16px;
  color: var(--text);
}
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}
.chip {
  border: 1px solid var(--border);
  color: var(--text-dim);
  background: var(--bg-elev);
  padding: 6px 12px;
  font-size: var(--fs-xs);
  border-radius: 4px;
}
</style>

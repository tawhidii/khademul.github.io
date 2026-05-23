<script setup>
import SectionHeader from './SectionHeader.vue';
import { skills } from '../data/skills.js';
</script>

<template>
  <section>
    <SectionHeader name="skills" id="skills" />
    <div v-for="group in skills" :key="group.group" class="skill-group">
      <h3 class="group-head">// {{ group.group }}</h3>
      <div class="skill-row">
        <span v-for="s in group.items" :key="s" class="skill">{{ s }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.skill-group { margin-bottom: 32px; }
.group-head {
  color: var(--text-dim);
  font-size: var(--fs-sm);
  font-weight: 500;
  margin-bottom: 12px;
}
.skill-row { display: flex; flex-wrap: wrap; gap: 8px; }
.skill {
  font-size: var(--fs-xs);
  color: var(--text);
  border: 1px solid var(--border);
  background: var(--bg-elev);
  padding: 6px 12px;
  border-radius: 4px;
}
</style>

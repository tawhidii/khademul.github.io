<script setup>
import SectionHeader from './SectionHeader.vue';
import ExperienceItem from './ExperienceItem.vue';
import { experience } from '../data/experience.js';
</script>

<template>
  <section>
    <SectionHeader name="experience" id="experience" />
    <ExperienceItem v-for="item in experience" :key="item.company + item.start" :item="item" />
  </section>
</template>

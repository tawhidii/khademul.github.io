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

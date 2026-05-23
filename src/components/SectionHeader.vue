<script setup>
defineProps({
  name: { type: String, required: true },
  id: { type: String, required: true },
});
</script>

<template>
  <h2 :id="id" class="section-header">
    <span class="prompt">visitor@bari.dev:~$</span>
    <span class="cmd">cat</span>
    <span class="file">{{ name }}.md</span>
  </h2>
</template>

<style scoped>
.section-header {
  font-size: var(--fs-md);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5ch;
  align-items: baseline;
  margin-bottom: 32px;
}
.prompt { color: var(--prompt); }
.cmd    { color: var(--text-dim); }
.file   { color: var(--warn); }
</style>

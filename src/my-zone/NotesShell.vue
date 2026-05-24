<script setup>
import { computed, ref } from 'vue';
import TopicSidebar from './TopicSidebar.vue';
import NoteEditor from './NoteEditor.vue';
import { useNotes } from './composables/useNotes.js';

const selectedTopicId = ref(null);
const selectedNoteId = ref(null);

const { notesByTopic } = useNotes();

const selectedNote = computed(() => {
  if (!selectedTopicId.value || !selectedNoteId.value) return null;
  const list = notesByTopic.value[selectedTopicId.value] || [];
  return list.find((n) => n.$id === selectedNoteId.value) || null;
});

function onSelectTopic(id) {
  selectedTopicId.value = id;
  selectedNoteId.value = null;
}

function onSelectNote(id) {
  selectedNoteId.value = id;
}
</script>

<template>
  <div class="shell">
    <TopicSidebar
      :selected-topic-id="selectedTopicId"
      :selected-note-id="selectedNoteId"
      @select-topic="onSelectTopic"
      @select-note="onSelectNote"
    />
    <section class="shell__main">
      <NoteEditor v-if="selectedNote" :key="selectedNote.$id" :note="selectedNote" />
      <div v-else class="shell__placeholder">
        <p v-if="!selectedTopicId">select a topic from the sidebar</p>
        <p v-else>select a note or create one</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.shell {
  flex: 1;
  display: flex;
  min-height: 0;
}

.shell__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg, #0a0a0a);
  min-width: 0;
}

.shell__placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim, #999);
  font-size: 13px;
}
</style>

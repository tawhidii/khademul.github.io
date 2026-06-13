<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useTopics } from './composables/useTopics.js';
import { useNotes } from './composables/useNotes.js';

const props = defineProps({
  selectedTopicId: { type: String, default: null },
  selectedNoteId: { type: String, default: null },
  blogActive: { type: Boolean, default: false },
});
const emit = defineEmits(['select-topic', 'select-note', 'select-blog']);

const { topics, ensureLoaded, createTopic, deleteTopic } = useTopics();
const { notesByTopic, fetchNotesForTopic, createNote, deleteNote } = useNotes();

const newName = ref('');
const adding = ref(false);
const addingNote = ref(false);

onMounted(ensureLoaded);

watch(
  () => props.selectedTopicId,
  (id) => {
    if (id && !notesByTopic.value[id]) fetchNotesForTopic(id);
  },
  { immediate: true }
);

const notes = computed(() =>
  props.selectedTopicId ? notesByTopic.value[props.selectedTopicId] || [] : []
);

const selectedTopic = computed(
  () => topics.value.find((t) => t.$id === props.selectedTopicId) || null
);

async function onAddTopic() {
  const name = newName.value.trim();
  if (!name) return;
  adding.value = true;
  try {
    const topic = await createTopic(name);
    newName.value = '';
    emit('select-topic', topic.$id);
  } finally {
    adding.value = false;
  }
}

async function onDeleteTopic(topic) {
  const ok = window.confirm(
    topic.noteCount > 0
      ? `Delete topic "${topic.name}" and lose access to its ${topic.noteCount} note(s)?`
      : `Delete topic "${topic.name}"?`
  );
  if (!ok) return;
  await deleteTopic(topic.$id);
  if (props.selectedTopicId === topic.$id) emit('select-topic', null);
}

async function onAddNote() {
  if (!props.selectedTopicId) return;
  addingNote.value = true;
  try {
    const note = await createNote(props.selectedTopicId);
    emit('select-note', note.$id);
  } finally {
    addingNote.value = false;
  }
}

async function onDeleteNote(note) {
  const ok = window.confirm(`Delete note "${note.title || 'Untitled'}"?`);
  if (!ok) return;
  await deleteNote(note);
  if (props.selectedNoteId === note.$id) emit('select-note', null);
}
</script>

<template>
  <aside class="sidebar">
    <button
      class="sidebar__blog"
      :class="{ 'sidebar__blog--active': blogActive }"
      @click="emit('select-blog')"
    >▸ blog</button>
    <section class="sidebar__section">
      <header class="sidebar__header"><span>topics</span></header>
      <ul class="sidebar__list">
        <li
          v-for="topic in topics"
          :key="topic.$id"
          class="sidebar__item"
          :class="{ 'sidebar__item--active': topic.$id === selectedTopicId }"
        >
          <button class="sidebar__select" @click="emit('select-topic', topic.$id)">
            <span>{{ topic.name }}</span>
            <span class="sidebar__count">{{ topic.noteCount || 0 }}</span>
          </button>
          <button class="sidebar__delete" title="delete topic" @click="onDeleteTopic(topic)">×</button>
        </li>
        <li v-if="topics.length === 0" class="sidebar__empty">no topics yet</li>
      </ul>
      <form class="sidebar__add" @submit.prevent="onAddTopic">
        <input v-model="newName" placeholder="+ new topic" :disabled="adding" />
      </form>
    </section>

    <section v-if="selectedTopic" class="sidebar__section">
      <header class="sidebar__header">
        <span>notes in {{ selectedTopic.name }}</span>
      </header>
      <ul class="sidebar__list">
        <li
          v-for="note in notes"
          :key="note.$id"
          class="sidebar__item"
          :class="{ 'sidebar__item--active': note.$id === selectedNoteId }"
        >
          <button class="sidebar__select" @click="emit('select-note', note.$id)">
            <span class="sidebar__note-title">{{ note.title || 'Untitled' }}</span>
          </button>
          <button class="sidebar__delete" title="delete note" @click="onDeleteNote(note)">×</button>
        </li>
        <li v-if="notes.length === 0" class="sidebar__empty">no notes yet</li>
      </ul>
      <button class="sidebar__add-note" :disabled="addingNote" @click="onAddNote">+ new note</button>
    </section>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  border-right: 1px solid var(--border, #222);
  background: var(--bg-elev, #111);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar__blog {
  display: block;
  width: 100%;
  text-align: left;
  padding: 12px 20px;
  background: transparent;
  color: var(--text-dim, #999);
  border: none;
  border-bottom: 1px solid var(--border, #222);
  font-family: inherit;
  font-size: 13px;
  letter-spacing: 0.05em;
  cursor: pointer;
}
.sidebar__blog:hover { color: var(--text, #e6e6e6); }
.sidebar__blog--active { color: var(--accent, #6cf); }

.sidebar__section {
  padding: 16px 12px;
  border-bottom: 1px solid var(--border, #222);
}

.sidebar__header {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim, #999);
  padding: 0 8px 8px;
}

.sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sidebar__item {
  display: flex;
  align-items: stretch;
}

.sidebar__item--active .sidebar__select {
  background: var(--bg, #0a0a0a);
  color: var(--text, #e6e6e6);
}

.sidebar__select {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  background: transparent;
  color: var(--text-dim, #999);
  border: none;
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.sidebar__select:hover {
  color: var(--text, #e6e6e6);
}

.sidebar__note-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar__count {
  font-size: 11px;
  opacity: 0.6;
}

.sidebar__delete {
  background: transparent;
  border: none;
  color: var(--text-dim, #999);
  cursor: pointer;
  padding: 0 8px;
  opacity: 0;
  transition: opacity 0.1s;
}

.sidebar__item:hover .sidebar__delete {
  opacity: 1;
}

.sidebar__delete:hover {
  color: #f66;
}

.sidebar__empty {
  padding: 8px;
  font-size: 12px;
  color: var(--text-dim, #999);
  font-style: italic;
}

.sidebar__add input,
.sidebar__add-note {
  width: 100%;
  margin-top: 8px;
  padding: 6px 8px;
  background: var(--bg, #0a0a0a);
  color: var(--text, #e6e6e6);
  border: 1px solid var(--border, #222);
  font-family: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.sidebar__add input:focus,
.sidebar__add-note:focus {
  outline: 1px solid var(--accent, #6cf);
}
</style>

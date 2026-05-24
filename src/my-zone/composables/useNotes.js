import { ref } from 'vue';
import { databases, DATABASE_ID, NOTES_COLLECTION_ID, ID, Query } from '../services/appwrite.js';
import { useTopics } from './useTopics.js';
import { notifyAuthError } from './useAuth.js';

const notesByTopic = ref({});
const loading = ref(false);
const error = ref(null);

async function fetchNotesForTopic(topicId) {
  if (!topicId) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await databases.listDocuments(DATABASE_ID, NOTES_COLLECTION_ID, [
      Query.equal('topicId', topicId),
      Query.orderDesc('$updatedAt'),
      Query.limit(500),
    ]);
    notesByTopic.value = { ...notesByTopic.value, [topicId]: res.documents };
  } catch (err) {
    error.value = err?.message || 'Failed to load notes';
  } finally {
    loading.value = false;
  }
}

async function createNote(topicId) {
  const doc = await databases.createDocument(DATABASE_ID, NOTES_COLLECTION_ID, ID.unique(), {
    title: 'Untitled',
    topicId,
    contentHtml: '',
    contentJson: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
    excerpt: '',
  });
  const list = notesByTopic.value[topicId] || [];
  notesByTopic.value = { ...notesByTopic.value, [topicId]: [doc, ...list] };
  useTopics().adjustNoteCount(topicId, +1);
  return doc;
}

async function updateNote(id, patch) {
  try {
    const updated = await databases.updateDocument(DATABASE_ID, NOTES_COLLECTION_ID, id, patch);
    const topicId = updated.topicId;
    const list = notesByTopic.value[topicId] || [];
    notesByTopic.value = {
      ...notesByTopic.value,
      [topicId]: list.map((n) => (n.$id === id ? updated : n)),
    };
    return updated;
  } catch (err) {
    if (err?.code === 401) notifyAuthError();
    throw err;
  }
}

async function deleteNote(note) {
  await databases.deleteDocument(DATABASE_ID, NOTES_COLLECTION_ID, note.$id);
  const list = notesByTopic.value[note.topicId] || [];
  notesByTopic.value = {
    ...notesByTopic.value,
    [note.topicId]: list.filter((n) => n.$id !== note.$id),
  };
  useTopics().adjustNoteCount(note.topicId, -1);
}

export function useNotes() {
  return { notesByTopic, loading, error, fetchNotesForTopic, createNote, updateNote, deleteNote };
}

import { ref } from 'vue';
import { databases, DATABASE_ID, TOPICS_COLLECTION_ID, ID, Query } from '../services/appwrite.js';
import { toSlug } from '../services/text.js';

const topics = ref([]);
const loading = ref(false);
const error = ref(null);
let loadedOnce = false;

async function fetchTopics() {
  loading.value = true;
  error.value = null;
  try {
    const res = await databases.listDocuments(DATABASE_ID, TOPICS_COLLECTION_ID, [
      Query.orderAsc('$createdAt'),
      Query.limit(200),
    ]);
    topics.value = res.documents;
    loadedOnce = true;
  } catch (err) {
    error.value = err?.message || 'Failed to load topics';
  } finally {
    loading.value = false;
  }
}

async function ensureLoaded() {
  if (!loadedOnce) await fetchTopics();
}

async function createTopic(name) {
  const doc = await databases.createDocument(DATABASE_ID, TOPICS_COLLECTION_ID, ID.unique(), {
    name,
    slug: toSlug(name),
    noteCount: 0,
  });
  topics.value = [...topics.value, doc];
  return doc;
}

async function renameTopic(id, name) {
  const updated = await databases.updateDocument(DATABASE_ID, TOPICS_COLLECTION_ID, id, {
    name,
    slug: toSlug(name),
  });
  topics.value = topics.value.map((t) => (t.$id === id ? updated : t));
  return updated;
}

async function deleteTopic(id) {
  await databases.deleteDocument(DATABASE_ID, TOPICS_COLLECTION_ID, id);
  topics.value = topics.value.filter((t) => t.$id !== id);
}

function adjustNoteCount(topicId, delta) {
  const topic = topics.value.find((t) => t.$id === topicId);
  if (!topic) return;
  const newCount = Math.max(0, (topic.noteCount || 0) + delta);
  topic.noteCount = newCount;
  databases
    .updateDocument(DATABASE_ID, TOPICS_COLLECTION_ID, topicId, { noteCount: newCount })
    .catch(() => {
      /* drift is acceptable per spec; a reconcile script handles it */
    });
}

export function useTopics() {
  return {
    topics,
    loading,
    error,
    ensureLoaded,
    fetchTopics,
    createTopic,
    renameTopic,
    deleteTopic,
    adjustNoteCount,
  };
}

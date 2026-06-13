import { ref } from 'vue';
import {
  databases, DATABASE_ID, POSTS_COLLECTION_ID, ID, Query, Permission, Role,
} from '../services/appwrite.js';
import { currentUser, notifyAuthError } from './useAuth.js';

const posts = ref([]);
const loading = ref(false);
const error = ref(null);

function ownerPerms(uid, publicRead) {
  const perms = [
    Permission.update(Role.user(uid)),
    Permission.delete(Role.user(uid)),
    Permission.read(Role.user(uid)),
  ];
  if (publicRead) perms.push(Permission.read(Role.any()));
  return perms;
}

async function fetchPosts() {
  loading.value = true;
  error.value = null;
  try {
    const res = await databases.listDocuments(DATABASE_ID, POSTS_COLLECTION_ID, [
      Query.orderDesc('$createdAt'),
      Query.limit(500),
    ]);
    posts.value = res.documents;
  } catch (err) {
    error.value = err?.message || 'Failed to load posts';
  } finally {
    loading.value = false;
  }
}

async function createPost() {
  const uid = currentUser.value?.$id;
  const doc = await databases.createDocument(
    DATABASE_ID,
    POSTS_COLLECTION_ID,
    ID.unique(),
    {
      title: 'Untitled',
      slug: '',
      contentHtml: '',
      contentJson: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
      excerpt: '',
      status: 'draft',
      publishedAt: null,
    },
    ownerPerms(uid, false),
  );
  posts.value = [doc, ...posts.value];
  return doc;
}

async function updatePost(id, patch) {
  try {
    const updated = await databases.updateDocument(DATABASE_ID, POSTS_COLLECTION_ID, id, patch);
    posts.value = posts.value.map((p) => (p.$id === id ? updated : p));
    return updated;
  } catch (err) {
    if (err?.code === 401) notifyAuthError();
    throw err;
  }
}

async function deletePost(post) {
  await databases.deleteDocument(DATABASE_ID, POSTS_COLLECTION_ID, post.$id);
  posts.value = posts.value.filter((p) => p.$id !== post.$id);
}

async function publish(post) {
  const uid = currentUser.value?.$id;
  const publishedAt = post.publishedAt || new Date().toISOString();
  const updated = await databases.updateDocument(
    DATABASE_ID,
    POSTS_COLLECTION_ID,
    post.$id,
    { status: 'published', publishedAt },
    ownerPerms(uid, true),
  );
  posts.value = posts.value.map((p) => (p.$id === post.$id ? updated : p));
  return updated;
}

async function unpublish(post) {
  const uid = currentUser.value?.$id;
  const updated = await databases.updateDocument(
    DATABASE_ID,
    POSTS_COLLECTION_ID,
    post.$id,
    { status: 'draft' },
    ownerPerms(uid, false),
  );
  posts.value = posts.value.map((p) => (p.$id === post.$id ? updated : p));
  return updated;
}

export function usePosts() {
  return { posts, loading, error, fetchPosts, createPost, updatePost, deletePost, publish, unpublish };
}

import { databases, DATABASE_ID, POSTS_COLLECTION_ID, Query } from './appwrite.js';

export async function listPublishedPosts() {
  const res = await databases.listDocuments(DATABASE_ID, POSTS_COLLECTION_ID, [
    Query.equal('status', 'published'),
    Query.orderDesc('publishedAt'),
    Query.limit(100),
  ]);
  return res.documents;
}

export async function getPublishedPostBySlug(slug) {
  const res = await databases.listDocuments(DATABASE_ID, POSTS_COLLECTION_ID, [
    Query.equal('slug', slug),
    Query.equal('status', 'published'),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

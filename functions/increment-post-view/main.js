import { Client, Databases } from 'node-appwrite';
import { nextViews } from './nextViews.js';

export default async ({ req, res, error }) => {
  let postId;
  try {
    const body = req.bodyJson ?? (req.body ? JSON.parse(req.body) : {});
    postId = body.postId;
  } catch {
    return res.json({ ok: false, reason: 'bad-json' }, 400);
  }
  if (!postId) return res.json({ ok: false, reason: 'missing-postId' }, 400);

  const databaseId = process.env.DATABASE_ID;
  const collectionId = process.env.POSTS_COLLECTION_ID;

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  const databases = new Databases(client);

  try {
    const doc = await databases.getDocument(databaseId, collectionId, postId);
    await databases.updateDocument(databaseId, collectionId, postId, { views: nextViews(doc) });
    return res.json({ ok: true });
  } catch (err) {
    error(`increment-post-view failed: ${err?.message || err}`);
    return res.json({ ok: false, reason: 'update-failed' }, 500);
  }
};

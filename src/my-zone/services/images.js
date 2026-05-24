import { storage, IMAGES_BUCKET_ID, ID } from './appwrite.js';

export async function uploadImage(file) {
  const created = await storage.createFile(IMAGES_BUCKET_ID, ID.unique(), file);
  return storage.getFileView(IMAGES_BUCKET_ID, created.$id).toString();
}

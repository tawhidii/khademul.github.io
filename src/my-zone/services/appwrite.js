import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  throw new Error(
    'Missing Appwrite env vars. Copy .env.example to .env and fill in your project values.'
  );
}

const client = new Client().setEndpoint(endpoint).setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID, Query, Permission, Role };

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const TOPICS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TOPICS_COLLECTION_ID;
export const NOTES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_NOTES_COLLECTION_ID;
export const IMAGES_BUCKET_ID = import.meta.env.VITE_APPWRITE_IMAGES_BUCKET_ID;
export const POSTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID;

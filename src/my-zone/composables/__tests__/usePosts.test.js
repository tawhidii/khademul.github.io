import { describe, it, expect, vi, beforeEach } from 'vitest';

const updateDocument = vi.fn();
const createDocument = vi.fn();
const deleteDocument = vi.fn();
const listDocuments = vi.fn();

vi.mock('../../services/appwrite.js', () => ({
  databases: {
    updateDocument: (...a) => updateDocument(...a),
    createDocument: (...a) => createDocument(...a),
    deleteDocument: (...a) => deleteDocument(...a),
    listDocuments: (...a) => listDocuments(...a),
  },
  DATABASE_ID: 'db',
  POSTS_COLLECTION_ID: 'posts',
  ID: { unique: () => 'newid' },
  Query: { orderDesc: (f) => `orderDesc:${f}`, limit: (n) => `limit:${n}` },
  Permission: { read: (r) => `read:${r}`, update: (r) => `update:${r}`, delete: (r) => `delete:${r}` },
  Role: { any: () => 'any', user: (id) => `user:${id}` },
}));

vi.mock('../useAuth.js', () => ({
  currentUser: { value: { $id: 'u1' } },
  notifyAuthError: vi.fn(),
}));

import { usePosts } from '../usePosts.js';

beforeEach(() => {
  updateDocument.mockReset();
  createDocument.mockReset();
  deleteDocument.mockReset();
  listDocuments.mockReset();
});

describe('usePosts', () => {
  it('createPost defaults to draft with owner permissions', async () => {
    createDocument.mockResolvedValue({ $id: 'newid', status: 'draft' });
    const { createPost } = usePosts();
    await createPost();
    const [, , , data, perms] = createDocument.mock.calls[0];
    expect(data.status).toBe('draft');
    expect(perms).toContain('read:user:u1');
    expect(perms).not.toContain('read:any');
  });

  it('publish sets status, publishedAt, and public read', async () => {
    updateDocument.mockResolvedValue({ $id: 'p1', status: 'published' });
    const { publish } = usePosts();
    await publish({ $id: 'p1', status: 'draft', publishedAt: null });
    const [, , id, data, perms] = updateDocument.mock.calls[0];
    expect(id).toBe('p1');
    expect(data.status).toBe('published');
    expect(typeof data.publishedAt).toBe('string');
    expect(perms).toContain('read:any');
  });

  it('publish keeps an existing publishedAt', async () => {
    updateDocument.mockResolvedValue({ $id: 'p1' });
    const { publish } = usePosts();
    await publish({ $id: 'p1', status: 'draft', publishedAt: '2020-01-01T00:00:00.000Z' });
    const [, , , data] = updateDocument.mock.calls[0];
    expect(data.publishedAt).toBe('2020-01-01T00:00:00.000Z');
  });

  it('unpublish drops public read and sets draft', async () => {
    updateDocument.mockResolvedValue({ $id: 'p1', status: 'draft' });
    const { unpublish } = usePosts();
    await unpublish({ $id: 'p1', status: 'published', publishedAt: '2020-01-01T00:00:00.000Z' });
    const [, , , data, perms] = updateDocument.mock.calls[0];
    expect(data.status).toBe('draft');
    expect(perms).not.toContain('read:any');
  });
});

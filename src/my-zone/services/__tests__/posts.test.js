import { describe, it, expect, vi, beforeEach } from 'vitest';

const listDocuments = vi.fn();
vi.mock('../appwrite.js', () => ({
  databases: { listDocuments: (...a) => listDocuments(...a) },
  DATABASE_ID: 'db',
  POSTS_COLLECTION_ID: 'posts',
  Query: {
    equal: (f, v) => `equal:${f}:${v}`,
    orderDesc: (f) => `orderDesc:${f}`,
    limit: (n) => `limit:${n}`,
  },
}));

import { listPublishedPosts, getPublishedPostBySlug } from '../posts.js';

beforeEach(() => listDocuments.mockReset());

describe('posts read service', () => {
  it('lists published posts ordered by publishedAt', async () => {
    listDocuments.mockResolvedValue({ documents: [{ $id: 'p1' }] });
    const res = await listPublishedPosts();
    expect(res).toHaveLength(1);
    const [, , queries] = listDocuments.mock.calls[0];
    expect(queries).toContain('equal:status:published');
    expect(queries).toContain('orderDesc:publishedAt');
  });

  it('returns a single post by slug or null', async () => {
    listDocuments.mockResolvedValue({ documents: [{ $id: 'p1', slug: 'hello' }] });
    const found = await getPublishedPostBySlug('hello');
    expect(found.slug).toBe('hello');

    listDocuments.mockResolvedValue({ documents: [] });
    const none = await getPublishedPostBySlug('nope');
    expect(none).toBeNull();
  });
});

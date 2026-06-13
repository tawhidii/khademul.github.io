import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { routes } from '../../router/index.js';

const listPublishedPosts = vi.fn();
const getPublishedPostBySlug = vi.fn();
vi.mock('../../my-zone/services/posts.js', () => ({
  listPublishedPosts: (...a) => listPublishedPosts(...a),
  getPublishedPostBySlug: (...a) => getPublishedPostBySlug(...a),
}));

import BlogListPage from '../BlogListPage.vue';
import BlogPostPage from '../BlogPostPage.vue';

function router() {
  const r = createRouter({ history: createMemoryHistory(), routes });
  r.push('/');
  return r;
}

beforeEach(() => {
  listPublishedPosts.mockReset();
  getPublishedPostBySlug.mockReset();
});

describe('BlogListPage', () => {
  it('renders one entry per published post', async () => {
    listPublishedPosts.mockResolvedValue([
      { $id: 'p1', title: 'First', slug: 'first', excerpt: 'hi', publishedAt: '2026-01-01T00:00:00.000Z' },
      { $id: 'p2', title: 'Second', slug: 'second', excerpt: 'yo', publishedAt: '2026-01-02T00:00:00.000Z' },
    ]);
    const r = router();
    await r.isReady();
    const wrapper = mount(BlogListPage, { global: { plugins: [r] } });
    await flushPromises();
    expect(wrapper.findAll('.blog-list__item')).toHaveLength(2);
  });
});

describe('BlogPostPage', () => {
  it('renders the post body when found', async () => {
    getPublishedPostBySlug.mockResolvedValue({ title: 'First', contentHtml: '<p>Body here</p>', publishedAt: '2026-01-01T00:00:00.000Z' });
    const r = router();
    r.push('/blog/first');
    await r.isReady();
    const wrapper = mount(BlogPostPage, { global: { plugins: [r] } });
    await flushPromises();
    expect(wrapper.find('.post-body').html()).toContain('Body here');
  });

  it('shows a not-found state when missing', async () => {
    getPublishedPostBySlug.mockResolvedValue(null);
    const r = router();
    r.push('/blog/nope');
    await r.isReady();
    const wrapper = mount(BlogPostPage, { global: { plugins: [r] } });
    await flushPromises();
    expect(wrapper.text().toLowerCase()).toContain('not found');
  });
});

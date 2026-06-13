import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

const fetchPosts = vi.fn().mockResolvedValue();
const createPost = vi.fn().mockResolvedValue({ $id: 'new' });
const publish = vi.fn().mockResolvedValue({});
const unpublish = vi.fn().mockResolvedValue({});
const deletePost = vi.fn().mockResolvedValue();
const posts = ref([
  { $id: 'p1', title: 'First', status: 'published' },
  { $id: 'p2', title: 'Draft one', status: 'draft' },
]);

vi.mock('../composables/usePosts.js', () => ({
  usePosts: () => ({ posts, loading: ref(false), error: ref(null), fetchPosts, createPost, updatePost: vi.fn(), deletePost, publish, unpublish }),
}));
vi.mock('../PostEditor.vue', () => ({ default: { name: 'PostEditor', props: ['post'], template: '<div class="post-editor-stub" />' } }));

import BlogShell from '../BlogShell.vue';

describe('BlogShell', () => {
  it('lists posts with a status badge', async () => {
    const wrapper = mount(BlogShell);
    await flushPromises();
    const items = wrapper.findAll('.blog__item');
    expect(items).toHaveLength(2);
    expect(wrapper.text()).toContain('published');
    expect(wrapper.text()).toContain('draft');
  });

  it('creates a post via the new button', async () => {
    const wrapper = mount(BlogShell);
    await flushPromises();
    await wrapper.find('.blog__new').trigger('click');
    expect(createPost).toHaveBeenCalled();
  });
});

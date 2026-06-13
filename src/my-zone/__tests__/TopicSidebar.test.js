import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('../composables/useTopics.js', () => ({
  useTopics: () => ({
    topics: { value: [] },
    ensureLoaded: vi.fn(),
    createTopic: vi.fn(),
    deleteTopic: vi.fn(),
  }),
}));
vi.mock('../composables/useNotes.js', () => ({
  useNotes: () => ({
    notesByTopic: { value: {} },
    fetchNotesForTopic: vi.fn(),
    createNote: vi.fn(),
    deleteNote: vi.fn(),
  }),
}));

import TopicSidebar from '../TopicSidebar.vue';

describe('TopicSidebar', () => {
  it('emits select-blog when the blog item is clicked', async () => {
    const wrapper = mount(TopicSidebar, { props: { selectedTopicId: null, selectedNoteId: null, blogActive: false } });
    await wrapper.find('.sidebar__blog').trigger('click');
    expect(wrapper.emitted('select-blog')).toBeTruthy();
  });
});

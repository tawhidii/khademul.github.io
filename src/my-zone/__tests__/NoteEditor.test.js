import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('../composables/useNotes.js', () => ({
  useNotes: () => ({ updateNote: vi.fn().mockResolvedValue({}) }),
}));
vi.mock('../services/images.js', () => ({ uploadImage: vi.fn() }));
vi.mock('../composables/useAuth.js', () => ({ onAuthError: () => () => {} }));

import NoteEditor from '../NoteEditor.vue';

describe('NoteEditor', () => {
  const note = { $id: 'n1', title: 'Hi', contentJson: '', contentHtml: '' };

  it('renders the title and toolbar after refactor', async () => {
    const wrapper = mount(NoteEditor, { props: { note } });
    await new Promise((r) => setTimeout(r, 0));
    expect(wrapper.find('.editor__title').element.value).toBe('Hi');
    expect(wrapper.find('.editor__toolbar').exists()).toBe(true);
  });
});

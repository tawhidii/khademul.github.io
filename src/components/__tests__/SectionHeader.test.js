import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SectionHeader from '../SectionHeader.vue';

describe('SectionHeader', () => {
  it('renders the cat prompt and exposes the anchor id', () => {
    const wrapper = mount(SectionHeader, {
      props: { name: 'about', id: 'about' },
    });
    const text = wrapper.text();
    expect(text).toContain('visitor@bari.dev:~$');
    expect(text).toContain('cat');
    expect(text).toContain('about.md');
    expect(wrapper.find('h2').attributes('id')).toBe('about');
  });
});

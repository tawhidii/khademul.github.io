import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AboutSection from '../AboutSection.vue';
import { profile } from '../../data/profile.js';

describe('AboutSection', () => {
  it('renders the tagline and three stat chips', () => {
    const wrapper = mount(AboutSection);
    expect(wrapper.text()).toContain(profile.tagline);
    const chips = wrapper.findAll('.chip');
    expect(chips).toHaveLength(3);
    expect(chips[0].text()).toBe('4+ yrs experience');
    expect(chips[1].text()).toBe('Backend focus');
    expect(chips[2].text()).toBe('Open to remote');
  });
});

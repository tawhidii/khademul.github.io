import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ExperienceSection from '../ExperienceSection.vue';
import { experience } from '../../data/experience.js';

describe('ExperienceSection', () => {
  it('renders one card per entry in data order', () => {
    const wrapper = mount(ExperienceSection);
    const cards = wrapper.findAll('article.exp-card');
    expect(cards).toHaveLength(experience.length);
    expect(cards[0].text()).toContain(experience[0].company);
    expect(cards.at(-1).text()).toContain(experience.at(-1).company);
  });
});

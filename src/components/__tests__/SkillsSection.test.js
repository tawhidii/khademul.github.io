import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SkillsSection from '../SkillsSection.vue';
import { skills } from '../../data/skills.js';

describe('SkillsSection', () => {
  it('renders one group block per skills group with all items', () => {
    const wrapper = mount(SkillsSection);
    const groups = wrapper.findAll('.skill-group');
    expect(groups).toHaveLength(skills.length);
    for (let i = 0; i < skills.length; i += 1) {
      const groupEl = groups[i];
      expect(groupEl.find('h3').text()).toBe(`// ${skills[i].group}`);
      const items = groupEl.findAll('.skill');
      expect(items).toHaveLength(skills[i].items.length);
    }
  });
});

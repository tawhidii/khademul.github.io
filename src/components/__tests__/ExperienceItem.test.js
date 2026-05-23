import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ExperienceItem from '../ExperienceItem.vue';

const sample = {
  company: 'Techjays',
  role: 'Software Engineering Associate',
  start: 'Sep 2025',
  end: 'Apr 2026',
  location: 'Remote',
  bullets: ['First bullet', 'Second bullet'],
  tags: ['DRF', 'GCP'],
};

describe('ExperienceItem', () => {
  it('renders company, role, date range, location, bullets, tags', () => {
    const wrapper = mount(ExperienceItem, { props: { item: sample } });
    const text = wrapper.text();
    expect(text).toContain('Techjays');
    expect(text).toContain('Software Engineering Associate');
    expect(text).toContain('Sep 2025');
    expect(text).toContain('Apr 2026');
    expect(text).toContain('Remote');
    expect(wrapper.findAll('li.bullet')).toHaveLength(2);
    expect(wrapper.findAll('.tag')).toHaveLength(2);
  });
});

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EducationSection from '../EducationSection.vue';

describe('EducationSection', () => {
  it('renders the B.Sc. entry with school, dates, and GPA', () => {
    const wrapper = mount(EducationSection);
    const text = wrapper.text();
    expect(text).toContain('B.Sc. in Software Engineering');
    expect(text).toContain('Daffodil International University');
    expect(text).toContain('2015');
    expect(text).toContain('2019');
    expect(text).toContain('GPA 3.10 / 4.00');
  });
});

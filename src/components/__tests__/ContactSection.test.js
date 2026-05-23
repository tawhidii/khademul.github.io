import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ContactSection from '../ContactSection.vue';

describe('ContactSection', () => {
  it('renders four contact rows with correct hrefs', () => {
    const wrapper = mount(ContactSection);
    const rows = wrapper.findAll('a.contact-row');
    expect(rows).toHaveLength(4);
    const hrefs = rows.map((r) => r.attributes('href'));
    expect(hrefs).toEqual([
      'mailto:barii.py@gmail.com',
      'tel:+8801616716072',
      'https://github.com/tawhidii',
      'https://linkedin.com/in/kkbari',
    ]);
  });
});

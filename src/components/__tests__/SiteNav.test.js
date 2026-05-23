import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SiteNav from '../SiteNav.vue';

describe('SiteNav', () => {
  it('renders five section anchor links', () => {
    const wrapper = mount(SiteNav);
    const links = wrapper.findAll('a');
    expect(links).toHaveLength(5);
    expect(links.map((l) => l.attributes('href'))).toEqual([
      '#about', '#experience', '#skills', '#education', '#contact',
    ]);
  });
});

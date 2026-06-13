import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import ReturnLink from '../ReturnLink.vue';
import { routes } from '../../router/index.js';

describe('ReturnLink', () => {
  let router;
  beforeEach(async () => {
    router = createRouter({ history: createMemoryHistory(), routes });
    router.push('/about');
    await router.isReady();
  });

  it('links back to the terminal home', () => {
    const wrapper = mount(ReturnLink, { global: { plugins: [router] } });
    const link = wrapper.find('a.return-link');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('/');
    expect(link.text()).toContain('return to terminal');
  });
});

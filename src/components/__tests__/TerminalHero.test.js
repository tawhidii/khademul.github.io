import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import TerminalHero from '../TerminalHero.vue';

describe('TerminalHero', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('exposes a skip() that immediately renders the final state', async () => {
    const wrapper = mount(TerminalHero);
    expect(wrapper.text()).not.toContain('ls sections/');
    wrapper.vm.skip();
    await flushPromises();
    expect(wrapper.text()).toContain('whoami');
    expect(wrapper.text()).toContain('cat profile.txt');
    expect(wrapper.text()).toContain('ls sections/');
    expect(wrapper.find('.cursor').exists()).toBe(true);
  });

  it('renders the final state immediately when reduced motion is preferred', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: () => {}, removeEventListener: () => {} });
    const wrapper = mount(TerminalHero);
    await flushPromises();
    expect(wrapper.text()).toContain('ls sections/');
  });

  it('clicking anywhere on the terminal skips the animation', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
    const wrapper = mount(TerminalHero);
    await wrapper.find('.terminal').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('ls sections/');
  });

  it('renders interactive section links in the ls output', async () => {
    const wrapper = mount(TerminalHero);
    wrapper.vm.skip();
    await flushPromises();
    const links = wrapper.findAll('a.section-link');
    expect(links.length).toBe(5);
    expect(links.map((l) => l.attributes('href'))).toEqual(['#about', '#experience', '#skills', '#education', '#contact']);
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import TerminalHome from '../TerminalHome.vue';
import { routes } from '../../router/index.js';

function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes });
}

// Force the reduced-motion path so the boot sequence is skipped synchronously
// on mount; this renders the section links and command input immediately.
function mockReducedMotion() {
  window.matchMedia = (query) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() { return false; },
  });
}

describe('TerminalHome', () => {
  let router;
  beforeEach(async () => {
    mockReducedMotion();
    router = makeRouter();
    router.push('/');
    await router.isReady();
  });

  afterEach(() => {
    delete window.matchMedia;
  });

  it('renders a clickable link per section plus blog', async () => {
    const wrapper = mount(TerminalHome, { global: { plugins: [router] } });
    await nextTick();
    const links = wrapper.findAll('.section-link');
    expect(links).toHaveLength(6);
    expect(wrapper.text()).toContain('blog/');
  });

  it('navigates when a section link is clicked', async () => {
    const wrapper = mount(TerminalHome, { global: { plugins: [router] } });
    await nextTick();
    await wrapper.findAll('.section-link')[0].trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/about');
  });

  it('navigates when a typed command is submitted', async () => {
    const wrapper = mount(TerminalHome, { global: { plugins: [router] } });
    await nextTick();
    const input = wrapper.find('input.cmd-input');
    await input.setValue('cd skills');
    await wrapper.find('form.cmd-form').trigger('submit.prevent');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/skills');
  });

  it('shows an error line for unknown commands', async () => {
    const wrapper = mount(TerminalHome, { global: { plugins: [router] } });
    await nextTick();
    const input = wrapper.find('input.cmd-input');
    await input.setValue('badcmd');
    await wrapper.find('form.cmd-form').trigger('submit.prevent');
    expect(wrapper.text()).toContain('command not found: badcmd');
  });
});

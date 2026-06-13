import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AtmosphereFX from '../AtmosphereFX.vue';

describe('AtmosphereFX', () => {
  it('renders aria-hidden fog and scanline layers', () => {
    const wrapper = mount(AtmosphereFX);
    const root = wrapper.find('.atmosphere');
    expect(root.exists()).toBe(true);
    expect(root.attributes('aria-hidden')).toBe('true');
    expect(wrapper.find('.fog').exists()).toBe(true);
    expect(wrapper.find('.scanlines').exists()).toBe(true);
  });
});

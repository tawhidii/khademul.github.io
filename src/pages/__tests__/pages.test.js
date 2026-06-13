import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { routes } from '../../router/index.js';
import AboutPage from '../AboutPage.vue';
import ExperiencePage from '../ExperiencePage.vue';
import SkillsPage from '../SkillsPage.vue';
import EducationPage from '../EducationPage.vue';
import ContactPage from '../ContactPage.vue';

const cases = [
  ['About', AboutPage, 'about'],
  ['Experience', ExperiencePage, 'experience'],
  ['Skills', SkillsPage, 'skills'],
  ['Education', EducationPage, 'education'],
  ['Contact', ContactPage, 'contact'],
];

describe('section pages', () => {
  let router;
  beforeEach(async () => {
    router = createRouter({ history: createMemoryHistory(), routes });
    router.push('/');
    await router.isReady();
  });

  it.each(cases)('%s page renders its section header and a return link', (_name, Page, sectionName) => {
    const wrapper = mount(Page, { global: { plugins: [router] } });
    expect(wrapper.find('.section-header').exists()).toBe(true);
    expect(wrapper.find('.section-header').text()).toContain(`${sectionName}.md`);
    expect(wrapper.find('a.return-link').exists()).toBe(true);
  });
});

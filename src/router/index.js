import { createRouter, createWebHistory } from 'vue-router';
import TerminalHome from '../components/TerminalHome.vue';
import AboutPage from '../pages/AboutPage.vue';
import ExperiencePage from '../pages/ExperiencePage.vue';
import SkillsPage from '../pages/SkillsPage.vue';
import EducationPage from '../pages/EducationPage.vue';
import ContactPage from '../pages/ContactPage.vue';

export const routes = [
  { path: '/', name: 'home', component: TerminalHome },
  { path: '/about', name: 'about', component: AboutPage },
  { path: '/experience', name: 'experience', component: ExperiencePage },
  { path: '/skills', name: 'skills', component: SkillsPage },
  { path: '/education', name: 'education', component: EducationPage },
  { path: '/contact', name: 'contact', component: ContactPage },
  { path: '/blog', name: 'blog', component: () => import('../pages/BlogListPage.vue') },
  { path: '/blog/:slug', name: 'blog-post', component: () => import('../pages/BlogPostPage.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHistory('/'),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

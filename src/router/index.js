import { createRouter, createWebHistory } from 'vue-router';
import TerminalHome from '../components/TerminalHome.vue';
import AboutPage from '../pages/AboutPage.vue';
import ExperiencePage from '../pages/ExperiencePage.vue';
import SkillsPage from '../pages/SkillsPage.vue';
import EducationPage from '../pages/EducationPage.vue';
import ContactPage from '../pages/ContactPage.vue';
import BlogListPage from '../pages/BlogListPage.vue';
import BlogPostPage from '../pages/BlogPostPage.vue';

export const routes = [
  { path: '/', name: 'home', component: TerminalHome },
  { path: '/about', name: 'about', component: AboutPage },
  { path: '/experience', name: 'experience', component: ExperiencePage },
  { path: '/skills', name: 'skills', component: SkillsPage },
  { path: '/education', name: 'education', component: EducationPage },
  { path: '/contact', name: 'contact', component: ContactPage },
  { path: '/blog', name: 'blog', component: BlogListPage },
  { path: '/blog/:slug', name: 'blog-post', component: BlogPostPage },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
  history: createWebHistory('/'),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

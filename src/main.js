import { createApp } from 'vue';
import './assets/styles/main.css';

// Restore the original path stashed by public/404.html (GitHub Pages SPA fallback).
const stashed = sessionStorage.getItem('spa-redirect-path');
if (stashed) {
  sessionStorage.removeItem('spa-redirect-path');
  history.replaceState(null, '', stashed);
}

const path = window.location.pathname;
const isMyZone = path === '/my-zone' || path === '/my-zone/';

if (isMyZone) {
  import('./my-zone/MyZoneApp.vue').then(({ default: MyZoneApp }) => {
    createApp(MyZoneApp).mount('#app');
  });
} else {
  import('./App.vue').then(({ default: App }) => {
    createApp(App).mount('#app');
  });
}

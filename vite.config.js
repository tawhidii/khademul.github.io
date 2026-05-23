import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/my-folio/',
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});

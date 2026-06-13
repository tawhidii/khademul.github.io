<script setup>
import { onMounted, ref } from 'vue';
import { listPublishedPosts } from '../my-zone/services/posts.js';
import ReturnLink from '../components/ReturnLink.vue';

const posts = ref([]);
const loading = ref(true);
const error = ref(null);

function fmtDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return ''; }
}

onMounted(async () => {
  try {
    posts.value = await listPublishedPosts();
  } catch (err) {
    error.value = err?.message || 'failed to load posts';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="page">
    <h2 class="blog-list__heading">~/blog</h2>
    <p v-if="loading" class="blog-list__status">loading…</p>
    <p v-else-if="error" class="blog-list__status">{{ error }}</p>
    <p v-else-if="posts.length === 0" class="blog-list__status">no posts yet</p>
    <ul v-else class="blog-list">
      <li v-for="post in posts" :key="post.$id" class="blog-list__item">
        <RouterLink :to="`/blog/${post.slug}`" class="blog-list__link">
          <span class="blog-list__title">{{ post.title || 'Untitled' }}</span>
          <span class="blog-list__date">{{ fmtDate(post.publishedAt) }}</span>
        </RouterLink>
        <p class="blog-list__excerpt">{{ post.excerpt }}</p>
      </li>
    </ul>
    <ReturnLink />
  </main>
</template>

<style scoped>
.page { position: relative; z-index: 1; max-width: var(--content-max); margin: 0 auto; padding: 80px 24px 96px; }
.blog-list__heading { margin-bottom: 32px; }
.blog-list__status { color: var(--text-dim); }
.blog-list { list-style: none; margin: 0; padding: 0; }
.blog-list__item { padding: 20px 0; border-bottom: 1px solid var(--border); }
.blog-list__link { display: flex; justify-content: space-between; gap: 1ch; align-items: baseline; color: var(--accent); text-decoration: none; }
.blog-list__link:hover .blog-list__title { text-shadow: var(--glow-cyan); }
.blog-list__title { font-size: var(--fs-md); }
.blog-list__date { color: var(--text-dim); font-size: var(--fs-xs); }
.blog-list__excerpt { margin: 8px 0 0; color: var(--text-dim); }
</style>

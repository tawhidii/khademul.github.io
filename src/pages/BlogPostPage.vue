<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getPublishedPostBySlug } from '../my-zone/services/posts.js';
import ReturnLink from '../components/ReturnLink.vue';

const route = useRoute();
const post = ref(null);
const loading = ref(true);
const notFound = ref(false);

function fmtDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return ''; }
}

async function load(slug) {
  loading.value = true;
  notFound.value = false;
  post.value = null;
  try {
    const found = await getPublishedPostBySlug(slug);
    if (found) post.value = found;
    else notFound.value = true;
  } catch {
    notFound.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => load(route.params.slug));
watch(() => route.params.slug, (slug) => { if (slug) load(slug); });
</script>

<template>
  <main class="page">
    <p v-if="loading" class="post__status">loading…</p>
    <template v-else-if="notFound">
      <h2>post not found</h2>
      <p class="post__status">that post does not exist or is not published.</p>
    </template>
    <template v-else>
      <h2 class="post__title">{{ post.title }}</h2>
      <p class="post__date">{{ fmtDate(post.publishedAt) }}</p>
      <article class="post-body" v-html="post.contentHtml"></article>
    </template>
    <ReturnLink />
  </main>
</template>

<style scoped>
.page { position: relative; z-index: 1; max-width: var(--content-max); margin: 0 auto; padding: 80px 24px 96px; }
.post__status { color: var(--text-dim); }
.post__title { margin-bottom: 8px; }
.post__date { color: var(--text-dim); font-size: var(--fs-xs); margin-bottom: 32px; }
.post-body { color: var(--text); line-height: 1.8; }
.post-body :deep(h1), .post-body :deep(h2), .post-body :deep(h3) { font-family: var(--font-display); margin: 24px 0 12px; }
.post-body :deep(a) { color: var(--accent); text-decoration: underline; }
.post-body :deep(img) { max-width: 100%; height: auto; }
.post-body :deep(pre) { background: var(--bg-elev); padding: 12px; overflow-x: auto; border-radius: 4px; }
.post-body :deep(code) { background: var(--bg-elev); padding: 1px 6px; border-radius: 2px; }
.post-body :deep(blockquote) { border-left: 2px solid var(--border); padding-left: 16px; color: var(--text-dim); }
</style>

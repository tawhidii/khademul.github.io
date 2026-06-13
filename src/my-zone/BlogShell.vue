<script setup>
import { computed, onMounted, ref } from 'vue';
import PostEditor from './PostEditor.vue';
import { usePosts } from './composables/usePosts.js';

const { posts, createPost, deletePost, publish, unpublish, fetchPosts } = usePosts();
const selectedId = ref(null);

onMounted(fetchPosts);

const selectedPost = computed(() => posts.value.find((p) => p.$id === selectedId.value) || null);

async function onNew() {
  const post = await createPost();
  selectedId.value = post.$id;
}
async function onDelete(post) {
  if (!window.confirm(`Delete post "${post.title || 'Untitled'}"?`)) return;
  await deletePost(post);
  if (selectedId.value === post.$id) selectedId.value = null;
}
function onTogglePublish(post) {
  return post.status === 'published' ? unpublish(post) : publish(post);
}
</script>

<template>
  <div class="blog">
    <aside class="blog__list-pane">
      <header class="blog__header"><span>posts</span></header>
      <ul class="blog__list">
        <li
          v-for="post in posts"
          :key="post.$id"
          class="blog__item"
          :class="{ 'blog__item--active': post.$id === selectedId }"
        >
          <button class="blog__select" @click="selectedId = post.$id">
            <span class="blog__title">{{ post.title || 'Untitled' }}</span>
            <span :class="['blog__badge', `blog__badge--${post.status}`]">{{ post.status }}</span>
            <span class="blog__views">· {{ post.views || 0 }} views</span>
          </button>
          <button class="blog__pub" :title="post.status === 'published' ? 'unpublish' : 'publish'" @click="onTogglePublish(post)">
            {{ post.status === 'published' ? '↓' : '↑' }}
          </button>
          <button class="blog__delete" title="delete post" @click="onDelete(post)">×</button>
        </li>
        <li v-if="posts.length === 0" class="blog__empty">no posts yet</li>
      </ul>
      <button class="blog__new" @click="onNew">+ new post</button>
    </aside>
    <section class="blog__editor-pane">
      <PostEditor v-if="selectedPost" :key="selectedPost.$id" :post="selectedPost" />
      <div v-else class="blog__placeholder"><p>select a post or create one</p></div>
    </section>
  </div>
</template>

<style scoped>
.blog { flex: 1; display: flex; min-height: 0; }
.blog__list-pane { width: 280px; border-right: 1px solid var(--border, #222); background: var(--bg-elev, #111); display: flex; flex-direction: column; overflow-y: auto; padding: 16px 12px; }
.blog__header { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim, #999); padding: 0 8px 8px; }
.blog__list { list-style: none; margin: 0; padding: 0; }
.blog__item { display: flex; align-items: stretch; }
.blog__item--active .blog__select { background: var(--bg, #0a0a0a); color: var(--text, #e6e6e6); }
.blog__select { flex: 1; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px; background: transparent; color: var(--text-dim, #999); border: none; font-family: inherit; font-size: 13px; text-align: left; cursor: pointer; }
.blog__title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.blog__badge { font-size: 10px; padding: 1px 6px; border: 1px solid var(--border, #222); border-radius: 2px; }
.blog__badge--published { color: var(--accent, #6cf); border-color: var(--accent, #6cf); }
.blog__views { font-size: 10px; color: var(--text-dim, #999); white-space: nowrap; }
.blog__pub, .blog__delete { background: transparent; border: none; color: var(--text-dim, #999); cursor: pointer; padding: 0 8px; }
.blog__delete:hover { color: #f66; }
.blog__empty { padding: 8px; font-size: 12px; color: var(--text-dim, #999); font-style: italic; }
.blog__new { width: 100%; margin-top: 8px; padding: 6px 8px; background: var(--bg, #0a0a0a); color: var(--text, #e6e6e6); border: 1px solid var(--border, #222); font-family: inherit; font-size: 12px; text-align: left; cursor: pointer; }
.blog__editor-pane { flex: 1; display: flex; flex-direction: column; background: var(--bg, #0a0a0a); min-width: 0; }
.blog__placeholder { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-dim, #999); font-size: 13px; }
</style>

<script setup>
import './styles/my-zone.css';
import { useAuth } from './composables/useAuth.js';
import LoginForm from './LoginForm.vue';
import NotesShell from './NotesShell.vue';

const { currentUser, loading, logout } = useAuth();
</script>

<template>
  <div class="my-zone">
    <header class="my-zone__header">
      <span class="my-zone__title">my-zone</span>
      <button v-if="currentUser" class="my-zone__logout" @click="logout">logout</button>
    </header>
    <template v-if="loading">
      <main class="my-zone__body"><p>…</p></main>
    </template>
    <template v-else-if="!currentUser">
      <main class="my-zone__body"><LoginForm /></main>
    </template>
    <template v-else>
      <NotesShell />
    </template>
  </div>
</template>

<style scoped>
.my-zone__logout {
  background: transparent;
  color: var(--text-dim, #999);
  border: 1px solid var(--border, #222);
  padding: 4px 10px;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}
</style>

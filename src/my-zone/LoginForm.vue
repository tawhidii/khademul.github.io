<script setup>
import { ref } from 'vue';
import { useAuth } from './composables/useAuth.js';

const { login, error } = useAuth();
const email = ref('');
const password = ref('');
const submitting = ref(false);

async function onSubmit() {
  submitting.value = true;
  await login(email.value, password.value);
  submitting.value = false;
}
</script>

<template>
  <form class="login" @submit.prevent="onSubmit">
    <h1 class="login__title">my-zone</h1>
    <label class="login__field">
      <span>email</span>
      <input v-model="email" type="email" required autocomplete="email" :disabled="submitting" />
    </label>
    <label class="login__field">
      <span>password</span>
      <input v-model="password" type="password" required autocomplete="current-password" :disabled="submitting" />
    </label>
    <button type="submit" :disabled="submitting">
      {{ submitting ? 'signing in…' : 'sign in' }}
    </button>
    <p v-if="error" class="login__error">{{ error }}</p>
  </form>
</template>

<style scoped>
.login {
  width: 320px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 32px;
  border: 1px solid var(--border, #222);
  background: var(--bg-elev, #111);
}

.login__title {
  margin: 0 0 8px;
  font-size: 18px;
  letter-spacing: 0.05em;
  color: var(--text-dim, #999);
}

.login__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--text-dim, #999);
}

.login__field input {
  padding: 8px 10px;
  background: var(--bg, #0a0a0a);
  color: var(--text, #e6e6e6);
  border: 1px solid var(--border, #222);
  font-family: inherit;
  font-size: 14px;
}

.login__field input:focus {
  outline: 1px solid var(--accent, #6cf);
}

button {
  padding: 10px;
  background: var(--accent, #6cf);
  color: #000;
  border: none;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login__error {
  margin: 0;
  color: #f66;
  font-size: 12px;
}
</style>

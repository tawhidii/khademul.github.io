import { ref } from 'vue';
import { account } from '../services/appwrite.js';

export const currentUser = ref(null);
const loading = ref(true);
const error = ref(null);
let bootstrapped = false;

async function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;
  try {
    currentUser.value = await account.get();
  } catch {
    currentUser.value = null;
  } finally {
    loading.value = false;
  }
}

async function login(email, password) {
  error.value = null;
  try {
    await account.createEmailPasswordSession(email, password);
    currentUser.value = await account.get();
    return true;
  } catch (err) {
    error.value = err?.message || 'Login failed';
    return false;
  }
}

async function logout() {
  try {
    await account.deleteSession('current');
  } catch {
    /* even if the session is already gone, fall through */
  }
  currentUser.value = null;
}

const authErrorListeners = new Set();

export function onAuthError(fn) {
  authErrorListeners.add(fn);
  return () => authErrorListeners.delete(fn);
}

export function notifyAuthError() {
  currentUser.value = null;
  for (const fn of authErrorListeners) fn();
}

export function useAuth() {
  bootstrap();
  return { currentUser, loading, error, login, logout };
}

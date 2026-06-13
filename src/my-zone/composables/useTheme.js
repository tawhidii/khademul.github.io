import { ref } from 'vue';

const STORAGE_KEY = 'my-zone:theme';

function read() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'dark';
  } catch {
    return 'dark';
  }
}

const theme = ref(read());

function apply() {
  try { localStorage.setItem(STORAGE_KEY, theme.value); } catch { /* ignore */ }
}

function toggle() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  apply();
}

export function useTheme() {
  return { theme, toggle };
}

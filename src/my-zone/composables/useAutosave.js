import { ref } from 'vue';

export function useAutosave(save, snapshot, { delay = 1000 } = {}) {
  const status = ref({ state: 'idle', at: null, message: '' });
  let debounceHandle = null;
  let inFlight = false;
  let pending = false;

  function schedule() {
    status.value = { state: 'editing', at: Date.now(), message: '' };
    if (debounceHandle) clearTimeout(debounceHandle);
    debounceHandle = setTimeout(flush, delay);
  }

  async function flush() {
    const payload = snapshot();
    if (!payload) return;
    if (inFlight) { pending = true; return; }
    inFlight = true;
    status.value = { state: 'saving', at: Date.now(), message: '' };
    try {
      await save(payload);
      status.value = { state: 'saved', at: Date.now(), message: '' };
    } catch (err) {
      status.value = { state: 'error', at: Date.now(), message: err?.message || 'save failed' };
    } finally {
      inFlight = false;
      if (pending) { pending = false; schedule(); }
    }
  }

  function retry() { flush(); }

  function cancel() {
    if (debounceHandle) clearTimeout(debounceHandle);
    debounceHandle = null;
  }

  function statusText() {
    switch (status.value.state) {
      case 'editing': return 'editing…';
      case 'saving': return 'saving…';
      case 'saved': {
        const secs = Math.max(1, Math.round((Date.now() - status.value.at) / 1000));
        return `saved · ${secs}s ago`;
      }
      case 'error': return `save failed — ${status.value.message}`;
      default: return '';
    }
  }

  return { status, schedule, flush, retry, cancel, statusText };
}

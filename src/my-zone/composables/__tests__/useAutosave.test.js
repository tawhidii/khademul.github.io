import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAutosave } from '../useAutosave.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useAutosave', () => {
  it('debounces and calls save with the snapshot', async () => {
    const save = vi.fn().mockResolvedValue({});
    const snapshot = () => ({ title: 'x' });
    const a = useAutosave(save, snapshot, { delay: 1000 });

    a.schedule();
    expect(save).not.toHaveBeenCalled();
    expect(a.status.value.state).toBe('editing');

    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenCalledWith({ title: 'x' });
    expect(a.status.value.state).toBe('saved');
  });

  it('records an error status when save rejects', async () => {
    const save = vi.fn().mockRejectedValue(new Error('boom'));
    const a = useAutosave(save, () => ({ title: 'x' }), { delay: 500 });
    a.schedule();
    await vi.advanceTimersByTimeAsync(500);
    expect(a.status.value.state).toBe('error');
    expect(a.status.value.message).toBe('boom');
  });

  it('cancel prevents a pending save', async () => {
    const save = vi.fn().mockResolvedValue({});
    const a = useAutosave(save, () => ({ title: 'x' }), { delay: 1000 });
    a.schedule();
    a.cancel();
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).not.toHaveBeenCalled();
  });
});

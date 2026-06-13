import { describe, it, expect, vi, beforeEach } from 'vitest';

const createExecution = vi.fn();
vi.mock('../appwrite.js', () => ({
  functions: { createExecution: (...a) => createExecution(...a) },
  VIEW_FUNCTION_ID: 'fn1',
}));

import { recordView } from '../views.js';

beforeEach(() => {
  createExecution.mockReset();
  localStorage.clear();
});

describe('recordView', () => {
  it('executes once and sets the dedupe flag when unseen', async () => {
    createExecution.mockResolvedValue({});
    await recordView('p1');
    expect(createExecution).toHaveBeenCalledTimes(1);
    const [params] = createExecution.mock.calls[0];
    expect(params.functionId).toBe('fn1');
    expect(JSON.parse(params.body)).toEqual({ postId: 'p1' });
    expect(params.async).toBe(true);
    expect(localStorage.getItem('blog:viewed:p1')).toBe('1');
  });

  it('does nothing when already flagged', async () => {
    localStorage.setItem('blog:viewed:p1', '1');
    await recordView('p1');
    expect(createExecution).not.toHaveBeenCalled();
  });

  it('swallows execution errors and still resolves', async () => {
    createExecution.mockRejectedValue(new Error('network'));
    await expect(recordView('p1')).resolves.toBeUndefined();
  });

  it('ignores a missing postId', async () => {
    await recordView(undefined);
    expect(createExecution).not.toHaveBeenCalled();
  });
});

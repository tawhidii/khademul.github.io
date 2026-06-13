import { functions, VIEW_FUNCTION_ID } from './appwrite.js';

export async function recordView(postId) {
  if (!postId) return;
  const key = `blog:viewed:${postId}`;
  try {
    if (localStorage.getItem(key)) return;
  } catch {
    // localStorage unavailable — fall through and try to record once
  }
  try {
    await functions.createExecution({
      functionId: VIEW_FUNCTION_ID,
      body: JSON.stringify({ postId }),
      async: true,
    });
  } catch {
    // view tracking is best-effort; never surface to the reader
    return;
  }
  try {
    localStorage.setItem(key, '1');
  } catch {
    // ignore storage failures
  }
}

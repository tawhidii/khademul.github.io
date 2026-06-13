# Blog View Counter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Count opens per published post (deduped per browser) via an Appwrite Function that increments a `views` integer, and show the count to the author in `/my-zone`.

**Architecture:** The public post page fires a fire-and-forget Appwrite Function execution on first open per browser (localStorage dedupe). The Function increments `POSTS.views` with a server API key. The author reads `post.views` in the existing blog list.

**Tech Stack:** Vue 3, Appwrite web SDK (`functions.createExecution`), node-appwrite (Function runtime), Vitest.

---

## File Structure

**Create:**
- `src/my-zone/services/views.js` — `recordView(postId)` client trigger.
- `src/my-zone/services/__tests__/views.test.js`.
- `functions/increment-post-view/nextViews.js` — pure increment helper.
- `functions/increment-post-view/__tests__/nextViews.test.js`.
- `functions/increment-post-view/main.js` — Appwrite Function entrypoint.
- `functions/increment-post-view/package.json` — Function deps.
- `functions/increment-post-view/README.md` — deploy instructions.

**Modify:**
- `.env.example` — add `VITE_APPWRITE_VIEW_FUNCTION_ID`.
- `src/my-zone/services/appwrite.js` — export `functions` instance + `VIEW_FUNCTION_ID`.
- `src/my-zone/services/posts.js` — (no change needed; `views` rides along on documents).
- `src/pages/BlogPostPage.vue` — call `recordView` after the post loads.
- `src/my-zone/BlogShell.vue` — show `· {views} views` per post.
- `src/my-zone/__tests__/BlogShell.test.js` — assert the count renders.

---

## Task 1: Appwrite functions wiring

**Files:**
- Modify: `.env.example`
- Modify: `src/my-zone/services/appwrite.js`

No unit test (config). Verified by build in Task 6.

- [ ] **Step 1: Add the env var**

Append to `.env.example`:
```
VITE_APPWRITE_VIEW_FUNCTION_ID=
```

- [ ] **Step 2: Export a Functions instance and the function id**

In `src/my-zone/services/appwrite.js`:
- Add `Functions` to the existing `appwrite` import:
```js
import { Client, Account, Databases, Storage, Functions, ID, Query, Permission, Role } from 'appwrite';
```
- After the `export const storage = new Storage(client);` line, add:
```js
export const functions = new Functions(client);
```
- After the `POSTS_COLLECTION_ID` export line, add:
```js
export const VIEW_FUNCTION_ID = import.meta.env.VITE_APPWRITE_VIEW_FUNCTION_ID;
```

- [ ] **Step 3: Commit**

```bash
git add .env.example src/my-zone/services/appwrite.js
git commit -m "feat(views): export Functions client + view function id"
```

---

## Task 2: recordView client service

**Files:**
- Create: `src/my-zone/services/views.js`
- Test: `src/my-zone/services/__tests__/views.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/my-zone/services/__tests__/views.test.js`:
```js
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
    const [fnId, body, asyncFlag] = createExecution.mock.calls[0];
    expect(fnId).toBe('fn1');
    expect(JSON.parse(body)).toEqual({ postId: 'p1' });
    expect(asyncFlag).toBe(true);
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/my-zone/services/__tests__/views.test.js`
Expected: FAIL — cannot resolve `../views.js`.

- [ ] **Step 3: Implement recordView**

Create `src/my-zone/services/views.js`:
```js
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
    await functions.createExecution(VIEW_FUNCTION_ID, JSON.stringify({ postId }), true);
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/my-zone/services/__tests__/views.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/my-zone/services/views.js src/my-zone/services/__tests__/views.test.js
git commit -m "feat(views): recordView client trigger with per-browser dedupe"
```

---

## Task 3: Trigger view recording on the public post page

**Files:**
- Modify: `src/pages/BlogPostPage.vue`

No new unit test — `recordView` is covered in Task 2 and the page test mocks the posts service only. This wiring is verified in the Task 6 smoke check.

- [ ] **Step 1: Import recordView**

In `src/pages/BlogPostPage.vue`, add to the `<script setup>` imports (after the `getPublishedPostBySlug` import):
```js
import { recordView } from '../my-zone/services/views.js';
```

- [ ] **Step 2: Call it after a post loads**

In the `load(slug)` function, change the success branch so it records a view. Replace:
```js
    const found = await getPublishedPostBySlug(slug);
    if (found) post.value = found;
    else notFound.value = true;
```
with:
```js
    const found = await getPublishedPostBySlug(slug);
    if (found) {
      post.value = found;
      recordView(found.$id);
    } else {
      notFound.value = true;
    }
```

- [ ] **Step 3: Verify existing page tests still pass**

Run: `npx vitest run src/pages/__tests__/blog-pages.test.js`
Expected: PASS (3 tests). The tests mock `../../my-zone/services/posts.js`; `views.js` imports the real `appwrite.js`, which throws without env vars — so confirm the test still passes. If it now errors on the appwrite import, add a mock to the top of `src/pages/__tests__/blog-pages.test.js`:
```js
vi.mock('../../my-zone/services/views.js', () => ({ recordView: vi.fn() }));
```
Re-run and expect PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/BlogPostPage.vue src/pages/__tests__/blog-pages.test.js
git commit -m "feat(views): record a view when a published post opens"
```

---

## Task 4: Show the view count in the author blog list

**Files:**
- Modify: `src/my-zone/BlogShell.vue`
- Modify: `src/my-zone/__tests__/BlogShell.test.js`

- [ ] **Step 1: Update the BlogShell test to expect the count**

In `src/my-zone/__tests__/BlogShell.test.js`, update the mocked posts to include `views` and add an assertion. Change the `posts` ref to:
```js
const posts = ref([
  { $id: 'p1', title: 'First', status: 'published', views: 42 },
  { $id: 'p2', title: 'Draft one', status: 'draft', views: 0 },
]);
```
And inside the `it('lists posts with a status badge', …)` test, after the existing assertions, add:
```js
    expect(wrapper.text()).toContain('42 views');
```

- [ ] **Step 2: Run it to verify failure**

Run: `npx vitest run src/my-zone/__tests__/BlogShell.test.js`
Expected: FAIL — `42 views` not rendered yet.

- [ ] **Step 3: Render the view count**

In `src/my-zone/BlogShell.vue`, inside the `.blog__select` button, after the status badge `<span>`, add a views span. Replace:
```html
            <span :class="['blog__badge', `blog__badge--${post.status}`]">{{ post.status }}</span>
          </button>
```
with:
```html
            <span :class="['blog__badge', `blog__badge--${post.status}`]">{{ post.status }}</span>
            <span class="blog__views">· {{ post.views || 0 }} views</span>
          </button>
```
And add to the `<style scoped>` block:
```css
.blog__views { font-size: 10px; color: var(--text-dim, #999); white-space: nowrap; }
```

- [ ] **Step 4: Run it to verify pass**

Run: `npx vitest run src/my-zone/__tests__/BlogShell.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/my-zone/BlogShell.vue src/my-zone/__tests__/BlogShell.test.js
git commit -m "feat(views): show per-post view count in the blog list"
```

---

## Task 5: Appwrite Function package

**Files:**
- Create: `functions/increment-post-view/nextViews.js`
- Create: `functions/increment-post-view/__tests__/nextViews.test.js`
- Create: `functions/increment-post-view/main.js`
- Create: `functions/increment-post-view/package.json`
- Create: `functions/increment-post-view/README.md`

- [ ] **Step 1: Write the failing test for the pure helper**

Create `functions/increment-post-view/__tests__/nextViews.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { nextViews } from '../nextViews.js';

describe('nextViews', () => {
  it('increments an existing count', () => {
    expect(nextViews({ views: 5 })).toBe(6);
  });
  it('treats missing or zero as zero', () => {
    expect(nextViews({})).toBe(1);
    expect(nextViews({ views: 0 })).toBe(1);
  });
  it('handles a null document', () => {
    expect(nextViews(null)).toBe(1);
  });
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `npx vitest run functions/increment-post-view/__tests__/nextViews.test.js`
Expected: FAIL — cannot resolve `../nextViews.js`.

- [ ] **Step 3: Implement the helper**

Create `functions/increment-post-view/nextViews.js`:
```js
export function nextViews(doc) {
  return ((doc && doc.views) || 0) + 1;
}
```

- [ ] **Step 4: Run it to verify pass**

Run: `npx vitest run functions/increment-post-view/__tests__/nextViews.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the Function entrypoint**

Create `functions/increment-post-view/main.js`:
```js
import { Client, Databases } from 'node-appwrite';
import { nextViews } from './nextViews.js';

export default async ({ req, res, error }) => {
  let postId;
  try {
    const body = req.bodyJson ?? (req.body ? JSON.parse(req.body) : {});
    postId = body.postId;
  } catch {
    return res.json({ ok: false, reason: 'bad-json' }, 400);
  }
  if (!postId) return res.json({ ok: false, reason: 'missing-postId' }, 400);

  const databaseId = process.env.DATABASE_ID;
  const collectionId = process.env.POSTS_COLLECTION_ID;

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  const databases = new Databases(client);

  try {
    const doc = await databases.getDocument(databaseId, collectionId, postId);
    await databases.updateDocument(databaseId, collectionId, postId, { views: nextViews(doc) });
    return res.json({ ok: true });
  } catch (err) {
    error(`increment-post-view failed: ${err?.message || err}`);
    return res.json({ ok: false, reason: 'update-failed' }, 500);
  }
};
```

- [ ] **Step 6: Write the Function package.json**

Create `functions/increment-post-view/package.json`:
```json
{
  "name": "increment-post-view",
  "version": "1.0.0",
  "type": "module",
  "main": "main.js",
  "dependencies": {
    "node-appwrite": "^14.0.0"
  }
}
```

- [ ] **Step 7: Write the deploy README**

Create `functions/increment-post-view/README.md`:
```markdown
# increment-post-view

Appwrite Function that increments `views` on a POSTS document.

## Deploy

1. Appwrite Console → Functions → Create function.
   - Runtime: Node 18+
   - Entrypoint: `main.js`
   - Build command: `npm install`
   - Execute access: **Any** (anonymous visitors must be able to call it).
2. Upload this folder (or connect the repo path `functions/increment-post-view`).
3. Function environment variables:
   - `APPWRITE_API_KEY` — an API key with `databases.read` + `databases.write`.
   - `DATABASE_ID` — your database id.
   - `POSTS_COLLECTION_ID` — the POSTS collection id.
   (`APPWRITE_FUNCTION_API_ENDPOINT` and `APPWRITE_FUNCTION_PROJECT_ID` are injected
   automatically by Appwrite.)
4. Copy the function id into the site `.env` as `VITE_APPWRITE_VIEW_FUNCTION_ID`
   and into GitHub Actions secrets.

## Request

Body: `{ "postId": "<document id>" }`. Returns `{ "ok": true }` on success.
```

- [ ] **Step 8: Commit**

```bash
git add functions/increment-post-view
git commit -m "feat(views): increment-post-view Appwrite Function + helper"
```

---

## Task 6: Verification

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: all tests PASS (including the new views + nextViews tests).

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds, exit 0. The `functions/` folder is not imported by the app, so it must not appear in the bundle.

- [ ] **Step 3: Confirm functions/ is excluded from the app build**

Run: `grep -rl "node-appwrite" dist 2>/dev/null || echo "clean: node-appwrite not bundled"`
Expected: `clean: node-appwrite not bundled`.

- [ ] **Step 4: Manual smoke (requires deployed Function + env)**

After adding the `views` attribute to POSTS, deploying the Function, and setting
`VITE_APPWRITE_VIEW_FUNCTION_ID`: run `npm run dev`, open a published post at
`/blog/<slug>` once — the author's `/my-zone` blog list should show the count
increase by 1; reloading the same post in the same browser must NOT increase it
again (localStorage dedupe); opening in a different browser/incognito should.

- [ ] **Step 5: Commit any tuning**

```bash
git add -A
git commit -m "chore(views): post-verification tuning"
```
(Skip if no changes.)

---

## Self-Review Notes

- **Spec coverage:** `views` attribute (T1 env + manual console note; the attribute is created manually, documented in T5 README and the spec); Appwrite Function increment with `nextViews` (T5); per-browser dedupe via localStorage in `recordView` (T2); trigger on public post open (T3); author-only count display in BlogShell (T4); tests for recordView, nextViews, BlogShell (T2/T4/T5). All spec sections mapped.
- **Naming consistency:** `recordView(postId)` (T2) is imported and called in BlogPostPage (T3). `functions` + `VIEW_FUNCTION_ID` exported from appwrite.js (T1) are consumed by views.js (T2). `nextViews(doc)` (T5 helper) used by the Function entrypoint (T5 main.js). localStorage key `blog:viewed:<postId>` matches between spec and T2.
- **Manual-step note:** the `views` integer attribute on POSTS and the Function deployment are user actions; flagged in T5 README and the verification smoke step.
- **Placeholder scan:** none found.

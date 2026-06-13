# Blog + my-zone Theme Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author/manage blog posts in `/my-zone` (new Appwrite POSTS collection, draft↔published), display published posts on the public BR2049 site at `/blog` and `/blog/:slug`, and add a persisted dark/light theme toggle scoped to `/my-zone`.

**Architecture:** A new `POSTS` collection stores posts with document-level security; publishing adds a public read permission. A shared autosave engine (`useAutosave`) and TipTap setup (`useDocEditor`) are extracted so notes and posts share editing logic. Public pages read published posts through a thin read service. A `useTheme` composable toggles `data-theme` on the my-zone root.

**Tech Stack:** Vue 3 (`<script setup>`), vue-router 4, Appwrite SDK, TipTap, Vitest + @vue/test-utils.

---

## File Structure

**Create:**
- `src/my-zone/services/text.js` — `toSlug`, `makeExcerpt` (framework-free, shared).
- `src/my-zone/services/posts.js` — public read access: `listPublishedPosts`, `getPublishedPostBySlug`.
- `src/my-zone/composables/useAutosave.js` — debounced save state machine (no editor dependency).
- `src/my-zone/composables/useDocEditor.js` — TipTap editor + image/link command helpers.
- `src/my-zone/composables/usePosts.js` — post list state + CRUD + publish/unpublish.
- `src/my-zone/composables/useTheme.js` — dark/light theme, persisted.
- `src/my-zone/PostEditor.vue` — post editor (reuses useDocEditor + useAutosave).
- `src/my-zone/BlogShell.vue` — post list + editor pane for blog mode.
- `src/pages/BlogListPage.vue`, `src/pages/BlogPostPage.vue` — public blog pages.
- Tests: `__tests__/text.test.js`, `__tests__/posts.test.js` (services), `composables/__tests__/useAutosave.test.js`, `usePosts.test.js`, `useTheme.test.js`, `src/my-zone/__tests__/TopicSidebar.test.js`, `BlogShell.test.js`, `src/pages/__tests__/blog-pages.test.js`.

**Modify:**
- `src/my-zone/services/appwrite.js` — export `POSTS_COLLECTION_ID`.
- `.env.example` — add `VITE_APPWRITE_POSTS_COLLECTION_ID`.
- `src/my-zone/composables/useTopics.js` — import `toSlug` from `text.js`.
- `src/my-zone/NoteEditor.vue` — refactor onto `useDocEditor` + `useAutosave`.
- `src/my-zone/TopicSidebar.vue` — pinned "blog" item + `select-blog` event.
- `src/my-zone/NotesShell.vue` — blog mode.
- `src/my-zone/MyZoneApp.vue` — theme toggle + `data-theme`.
- `src/my-zone/styles/my-zone.css` — light palette under `[data-theme="light"]`.
- `src/router/index.js` — `/blog`, `/blog/:slug` routes.
- `src/terminal/commands.js` — `blog` nav target.
- `src/components/TerminalHome.vue` — `blog/` link.
- `src/terminal/__tests__/commands.test.js`, `src/components/__tests__/TerminalHome.test.js` — updated expectations.

---

## Task 1: POSTS Appwrite wiring

**Files:**
- Modify: `.env.example`
- Modify: `src/my-zone/services/appwrite.js`

No unit test (env-driven config). Verified by build in Task 11.

- [ ] **Step 1: Add the env var**

Append to `.env.example`:
```
VITE_APPWRITE_POSTS_COLLECTION_ID=
```

- [ ] **Step 2: Export the collection id**

In `src/my-zone/services/appwrite.js`, after the `IMAGES_BUCKET_ID` export line, add:
```js
export const POSTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID;
```

- [ ] **Step 3: Record the manual Appwrite setup**

This is a human action (no code). In the Appwrite console create a collection `POSTS` with **Document Security ON** and attributes: `title` (string 256), `slug` (string 128), `contentHtml` (string 1000000), `contentJson` (string 1000000), `excerpt` (string 512), `status` (enum: `draft`,`published`), `publishedAt` (datetime, not required). Add key indexes on `slug`, `status`, `publishedAt`. Put the collection id in `.env` as `VITE_APPWRITE_POSTS_COLLECTION_ID` and in the GitHub Actions secrets. (Implementation can proceed before this is done; runtime needs it.)

- [ ] **Step 4: Commit**

```bash
git add .env.example src/my-zone/services/appwrite.js
git commit -m "feat(blog): wire POSTS collection env + service export"
```

---

## Task 2: Shared text helpers

**Files:**
- Create: `src/my-zone/services/text.js`
- Test: `src/my-zone/services/__tests__/text.test.js`
- Modify: `src/my-zone/composables/useTopics.js`

- [ ] **Step 1: Write the failing test**

Create `src/my-zone/services/__tests__/text.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { toSlug, makeExcerpt } from '../text.js';

describe('toSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(toSlug('Hello World!')).toBe('hello-world');
  });
  it('trims leading/trailing separators', () => {
    expect(toSlug('  --Foo Bar--  ')).toBe('foo-bar');
  });
  it('falls back when empty', () => {
    expect(toSlug('!!!')).toBe('post');
  });
});

describe('makeExcerpt', () => {
  it('takes the first 300 chars by default', () => {
    const long = 'a'.repeat(400);
    expect(makeExcerpt(long)).toHaveLength(300);
  });
  it('handles empty input', () => {
    expect(makeExcerpt('')).toBe('');
    expect(makeExcerpt(undefined)).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/my-zone/services/__tests__/text.test.js`
Expected: FAIL — cannot resolve `../text.js`.

- [ ] **Step 3: Implement the helpers**

Create `src/my-zone/services/text.js`:
```js
export function toSlug(name) {
  return (
    String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'post'
  );
}

export function makeExcerpt(text, max = 300) {
  return String(text || '').slice(0, max);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/my-zone/services/__tests__/text.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Refactor useTopics to use the shared slug**

In `src/my-zone/composables/useTopics.js`, delete the local `toSlug` function (lines defining it) and add an import at the top after the existing imports:
```js
import { toSlug } from '../services/text.js';
```
The fallback string differs (`'topic'` → `'post'`); this is acceptable — slugs are derived display values and topics are not slugged externally. Leave the rest of useTopics unchanged.

- [ ] **Step 6: Run the my-zone-adjacent tests**

Run: `npx vitest run src/my-zone`
Expected: PASS (text tests; no other my-zone tests yet).

- [ ] **Step 7: Commit**

```bash
git add src/my-zone/services/text.js src/my-zone/services/__tests__/text.test.js src/my-zone/composables/useTopics.js
git commit -m "feat(blog): shared toSlug + makeExcerpt; reuse in useTopics"
```

---

## Task 3: useAutosave composable

**Files:**
- Create: `src/my-zone/composables/useAutosave.js`
- Test: `src/my-zone/composables/__tests__/useAutosave.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/my-zone/composables/__tests__/useAutosave.test.js`:
```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/my-zone/composables/__tests__/useAutosave.test.js`
Expected: FAIL — cannot resolve `../useAutosave.js`.

- [ ] **Step 3: Implement the composable**

Create `src/my-zone/composables/useAutosave.js`:
```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/my-zone/composables/__tests__/useAutosave.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/my-zone/composables/useAutosave.js src/my-zone/composables/__tests__/useAutosave.test.js
git commit -m "feat(blog): extract debounced useAutosave engine"
```

---

## Task 4: usePosts composable

**Files:**
- Create: `src/my-zone/composables/usePosts.js`
- Test: `src/my-zone/composables/__tests__/usePosts.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/my-zone/composables/__tests__/usePosts.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const updateDocument = vi.fn();
const createDocument = vi.fn();
const deleteDocument = vi.fn();
const listDocuments = vi.fn();

vi.mock('../../services/appwrite.js', () => ({
  databases: {
    updateDocument: (...a) => updateDocument(...a),
    createDocument: (...a) => createDocument(...a),
    deleteDocument: (...a) => deleteDocument(...a),
    listDocuments: (...a) => listDocuments(...a),
  },
  DATABASE_ID: 'db',
  POSTS_COLLECTION_ID: 'posts',
  ID: { unique: () => 'newid' },
  Query: { orderDesc: (f) => `orderDesc:${f}`, limit: (n) => `limit:${n}` },
  Permission: { read: (r) => `read:${r}`, update: (r) => `update:${r}`, delete: (r) => `delete:${r}` },
  Role: { any: () => 'any', user: (id) => `user:${id}` },
}));

vi.mock('../useAuth.js', () => ({
  currentUser: { value: { $id: 'u1' } },
  notifyAuthError: vi.fn(),
}));

import { usePosts } from '../usePosts.js';

beforeEach(() => {
  updateDocument.mockReset();
  createDocument.mockReset();
  deleteDocument.mockReset();
  listDocuments.mockReset();
});

describe('usePosts', () => {
  it('createPost defaults to draft with owner permissions', async () => {
    createDocument.mockResolvedValue({ $id: 'newid', status: 'draft' });
    const { createPost } = usePosts();
    await createPost();
    const [, , , data, perms] = createDocument.mock.calls[0];
    expect(data.status).toBe('draft');
    expect(perms).toContain('read:user:u1');
    expect(perms).not.toContain('read:any');
  });

  it('publish sets status, publishedAt, and public read', async () => {
    updateDocument.mockResolvedValue({ $id: 'p1', status: 'published' });
    const { publish } = usePosts();
    await publish({ $id: 'p1', status: 'draft', publishedAt: null });
    const [, , id, data, perms] = updateDocument.mock.calls[0];
    expect(id).toBe('p1');
    expect(data.status).toBe('published');
    expect(typeof data.publishedAt).toBe('string');
    expect(perms).toContain('read:any');
  });

  it('publish keeps an existing publishedAt', async () => {
    updateDocument.mockResolvedValue({ $id: 'p1' });
    const { publish } = usePosts();
    await publish({ $id: 'p1', status: 'draft', publishedAt: '2020-01-01T00:00:00.000Z' });
    const [, , , data] = updateDocument.mock.calls[0];
    expect(data.publishedAt).toBe('2020-01-01T00:00:00.000Z');
  });

  it('unpublish drops public read and sets draft', async () => {
    updateDocument.mockResolvedValue({ $id: 'p1', status: 'draft' });
    const { unpublish } = usePosts();
    await unpublish({ $id: 'p1', status: 'published', publishedAt: '2020-01-01T00:00:00.000Z' });
    const [, , , data, perms] = updateDocument.mock.calls[0];
    expect(data.status).toBe('draft');
    expect(perms).not.toContain('read:any');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/my-zone/composables/__tests__/usePosts.test.js`
Expected: FAIL — cannot resolve `../usePosts.js`.

- [ ] **Step 3: Implement the composable**

Create `src/my-zone/composables/usePosts.js`:
```js
import { ref } from 'vue';
import {
  databases, DATABASE_ID, POSTS_COLLECTION_ID, ID, Query, Permission, Role,
} from '../services/appwrite.js';
import { currentUser, notifyAuthError } from './useAuth.js';

const posts = ref([]);
const loading = ref(false);
const error = ref(null);

function ownerPerms(uid, publicRead) {
  const perms = [
    Permission.update(Role.user(uid)),
    Permission.delete(Role.user(uid)),
    Permission.read(Role.user(uid)),
  ];
  if (publicRead) perms.push(Permission.read(Role.any()));
  return perms;
}

async function fetchPosts() {
  loading.value = true;
  error.value = null;
  try {
    const res = await databases.listDocuments(DATABASE_ID, POSTS_COLLECTION_ID, [
      Query.orderDesc('$createdAt'),
      Query.limit(500),
    ]);
    posts.value = res.documents;
  } catch (err) {
    error.value = err?.message || 'Failed to load posts';
  } finally {
    loading.value = false;
  }
}

async function createPost() {
  const uid = currentUser.value?.$id;
  const doc = await databases.createDocument(
    DATABASE_ID,
    POSTS_COLLECTION_ID,
    ID.unique(),
    {
      title: 'Untitled',
      slug: '',
      contentHtml: '',
      contentJson: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
      excerpt: '',
      status: 'draft',
      publishedAt: null,
    },
    ownerPerms(uid, false),
  );
  posts.value = [doc, ...posts.value];
  return doc;
}

async function updatePost(id, patch) {
  try {
    const updated = await databases.updateDocument(DATABASE_ID, POSTS_COLLECTION_ID, id, patch);
    posts.value = posts.value.map((p) => (p.$id === id ? updated : p));
    return updated;
  } catch (err) {
    if (err?.code === 401) notifyAuthError();
    throw err;
  }
}

async function deletePost(post) {
  await databases.deleteDocument(DATABASE_ID, POSTS_COLLECTION_ID, post.$id);
  posts.value = posts.value.filter((p) => p.$id !== post.$id);
}

async function publish(post) {
  const uid = currentUser.value?.$id;
  const publishedAt = post.publishedAt || new Date().toISOString();
  const updated = await databases.updateDocument(
    DATABASE_ID,
    POSTS_COLLECTION_ID,
    post.$id,
    { status: 'published', publishedAt },
    ownerPerms(uid, true),
  );
  posts.value = posts.value.map((p) => (p.$id === post.$id ? updated : p));
  return updated;
}

async function unpublish(post) {
  const uid = currentUser.value?.$id;
  const updated = await databases.updateDocument(
    DATABASE_ID,
    POSTS_COLLECTION_ID,
    post.$id,
    { status: 'draft' },
    ownerPerms(uid, false),
  );
  posts.value = posts.value.map((p) => (p.$id === post.$id ? updated : p));
  return updated;
}

export function usePosts() {
  return { posts, loading, error, fetchPosts, createPost, updatePost, deletePost, publish, unpublish };
}
```

Note: `updatePost` (used by autosave) does NOT pass a permissions array, so Appwrite preserves the document's existing permissions across content saves. Only `publish`/`unpublish`/`createPost` set permissions explicitly.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/my-zone/composables/__tests__/usePosts.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/my-zone/composables/usePosts.js src/my-zone/composables/__tests__/usePosts.test.js
git commit -m "feat(blog): usePosts CRUD + publish/unpublish with permissions"
```

---

## Task 5: useTheme composable

**Files:**
- Create: `src/my-zone/composables/useTheme.js`
- Test: `src/my-zone/composables/__tests__/useTheme.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/my-zone/composables/__tests__/useTheme.test.js`:
```js
import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe('useTheme', () => {
  it('defaults to dark', async () => {
    const { useTheme } = await import('../useTheme.js');
    const { theme } = useTheme();
    expect(theme.value).toBe('dark');
  });

  it('toggle flips and persists', async () => {
    const { useTheme } = await import('../useTheme.js');
    const { theme, toggle } = useTheme();
    toggle();
    expect(theme.value).toBe('light');
    expect(localStorage.getItem('my-zone:theme')).toBe('light');
    toggle();
    expect(theme.value).toBe('dark');
  });

  it('reads a stored preference on init', async () => {
    localStorage.setItem('my-zone:theme', 'light');
    const { useTheme } = await import('../useTheme.js');
    const { theme } = useTheme();
    expect(theme.value).toBe('light');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/my-zone/composables/__tests__/useTheme.test.js`
Expected: FAIL — cannot resolve `../useTheme.js`.

- [ ] **Step 3: Implement the composable**

Create `src/my-zone/composables/useTheme.js`:
```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/my-zone/composables/__tests__/useTheme.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/my-zone/composables/useTheme.js src/my-zone/composables/__tests__/useTheme.test.js
git commit -m "feat(my-zone): persisted dark/light useTheme composable"
```

---

## Task 6: useDocEditor + refactor NoteEditor + PostEditor

**Files:**
- Create: `src/my-zone/composables/useDocEditor.js`
- Modify: `src/my-zone/NoteEditor.vue`
- Create: `src/my-zone/PostEditor.vue`
- Test: `src/my-zone/__tests__/NoteEditor.test.js`

- [ ] **Step 1: Write the failing smoke test for NoteEditor**

Create `src/my-zone/__tests__/NoteEditor.test.js`:
```js
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('../composables/useNotes.js', () => ({
  useNotes: () => ({ updateNote: vi.fn().mockResolvedValue({}) }),
}));
vi.mock('../services/images.js', () => ({ uploadImage: vi.fn() }));
vi.mock('../composables/useAuth.js', () => ({ onAuthError: () => () => {} }));

import NoteEditor from '../NoteEditor.vue';

describe('NoteEditor', () => {
  const note = { $id: 'n1', title: 'Hi', contentJson: '', contentHtml: '' };

  it('renders the title and toolbar after refactor', async () => {
    const wrapper = mount(NoteEditor, { props: { note } });
    await new Promise((r) => setTimeout(r, 0));
    expect(wrapper.find('.editor__title').element.value).toBe('Hi');
    expect(wrapper.find('.editor__toolbar').exists()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails or errors**

Run: `npx vitest run src/my-zone/__tests__/NoteEditor.test.js`
Expected: FAIL/ERROR (toolbar only renders when the editor initialises; this test locks current behaviour before the refactor). If it unexpectedly passes against the current NoteEditor, that is fine — it becomes the regression guard for the refactor.

- [ ] **Step 3: Implement useDocEditor**

Create `src/my-zone/composables/useDocEditor.js`:
```js
import { useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { uploadImage } from '../services/images.js';

function parseContent(raw) {
  if (!raw) return undefined;
  try { return JSON.parse(raw); } catch { return undefined; }
}

export function useDocEditor({ contentJson, placeholder = 'start writing…', onUpdate }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener' } }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content: parseContent(contentJson),
    onUpdate,
    editorProps: {
      handlePaste(view, event) { onPaste(event); return false; },
    },
  });

  async function insertImageFromFile(file) {
    try {
      const url = await uploadImage(file);
      editor.value?.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      window.alert(`image upload failed: ${err?.message || err}`);
    }
  }

  function onPaste(event) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) { event.preventDefault(); insertImageFromFile(file); return; }
      }
    }
  }

  function onLinkClick() {
    if (!editor.value) return;
    const previous = editor.value.getAttributes('link').href;
    const url = window.prompt('URL', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  function setContent(raw) {
    editor.value?.commands.setContent(parseContent(raw) || '', false);
  }

  return { editor, insertImageFromFile, onLinkClick, setContent };
}
```

- [ ] **Step 4: Refactor NoteEditor onto the shared pieces**

Replace the `<script setup>` block of `src/my-zone/NoteEditor.vue` (lines 1–222, everything between the script tags) with:
```js
import { onBeforeUnmount, ref, watch } from 'vue';
import { EditorContent } from '@tiptap/vue-3';
import { useNotes } from './composables/useNotes.js';
import { onAuthError } from './composables/useAuth.js';
import { useDocEditor } from './composables/useDocEditor.js';
import { useAutosave } from './composables/useAutosave.js';
import { makeExcerpt } from './services/text.js';

const props = defineProps({ note: { type: Object, required: true } });

const { updateNote } = useNotes();
const title = ref(props.note.title || '');
const fileInput = ref(null);

const { editor, insertImageFromFile, onLinkClick, setContent } = useDocEditor({
  contentJson: props.note.contentJson,
  onUpdate: () => save.schedule(),
});

function snapshot() {
  if (!editor.value) return null;
  return {
    title: title.value,
    contentHtml: editor.value.getHTML(),
    contentJson: JSON.stringify(editor.value.getJSON()),
    excerpt: makeExcerpt(editor.value.getText()),
  };
}

const save = useAutosave((patch) => updateNote(props.note.$id, patch), snapshot);
const status = save.status;
const statusText = save.statusText;

function onTitleInput() { save.schedule(); }
function onImageClick() { fileInput.value?.click(); }
async function onFilePicked(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (file) await insertImageFromFile(file);
}
function retry() { save.retry(); }

watch(
  () => props.note.$id,
  () => {
    title.value = props.note.title || '';
    setContent(props.note.contentJson);
    save.cancel();
  },
);

const offAuthError = onAuthError(() => {
  const payload = snapshot();
  if (payload) {
    try {
      sessionStorage.setItem(`my-zone:unsaved:${props.note.$id}`, JSON.stringify({ ...payload, savedAt: Date.now() }));
    } catch { /* best effort */ }
  }
});

onBeforeUnmount(() => {
  save.cancel();
  offAuthError();
  editor.value?.destroy();
});
```
No template change is needed. `status` is now a ref returned by `useAutosave` and `statusText` is a function; in `<script setup>` a top-level ref named `status` is auto-unwrapped in the template, so the existing `status.state` and `{{ statusText() }}` markup keeps working. Leave the entire `<template>` and both `<style>` blocks of `NoteEditor.vue` unchanged.

Note: the previous session-restore confirm-on-load behaviour is intentionally simplified to the stash-on-auth-error path only; the smoke test does not depend on restore.

- [ ] **Step 5: Run the NoteEditor smoke test**

Run: `npx vitest run src/my-zone/__tests__/NoteEditor.test.js`
Expected: PASS. If TipTap fails to initialise under jsdom (no toolbar), adjust the test to assert only `.editor__title` value and the presence of `.editor` root, and keep going — the autosave logic is covered by Task 3.

- [ ] **Step 6: Create PostEditor**

Create `src/my-zone/PostEditor.vue`:
```vue
<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';
import { EditorContent } from '@tiptap/vue-3';
import { usePosts } from './composables/usePosts.js';
import { useDocEditor } from './composables/useDocEditor.js';
import { useAutosave } from './composables/useAutosave.js';
import { makeExcerpt, toSlug } from './services/text.js';

const props = defineProps({ post: { type: Object, required: true } });

const { updatePost } = usePosts();
const title = ref(props.post.title || '');
const fileInput = ref(null);

const { editor, insertImageFromFile, onLinkClick, setContent } = useDocEditor({
  contentJson: props.post.contentJson,
  placeholder: 'write your post…',
  onUpdate: () => save.schedule(),
});

function snapshot() {
  if (!editor.value) return null;
  return {
    title: title.value,
    slug: toSlug(title.value || 'Untitled'),
    contentHtml: editor.value.getHTML(),
    contentJson: JSON.stringify(editor.value.getJSON()),
    excerpt: makeExcerpt(editor.value.getText()),
  };
}

const save = useAutosave((patch) => updatePost(props.post.$id, patch), snapshot);
const status = save.status;
const statusText = save.statusText;

function onTitleInput() { save.schedule(); }
function onImageClick() { fileInput.value?.click(); }
async function onFilePicked(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (file) await insertImageFromFile(file);
}
function retry() { save.retry(); }

watch(
  () => props.post.$id,
  () => {
    title.value = props.post.title || '';
    setContent(props.post.contentJson);
    save.cancel();
  },
);

onBeforeUnmount(() => {
  save.cancel();
  editor.value?.destroy();
});
</script>

<template>
  <div class="editor">
    <input v-model="title" class="editor__title" placeholder="Untitled" @input="onTitleInput" />
    <div v-if="editor" class="editor__toolbar">
      <button type="button" :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()"><b>B</b></button>
      <button type="button" :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()"><i>I</i></button>
      <button type="button" :class="{ active: editor.isActive('underline') }" @click="editor.chain().focus().toggleUnderline().run()"><u>U</u></button>
      <span class="editor__sep"></span>
      <button type="button" :class="{ active: editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
      <button type="button" :class="{ active: editor.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">H3</button>
      <span class="editor__sep"></span>
      <button type="button" :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()">•</button>
      <button type="button" :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()">1.</button>
      <button type="button" :class="{ active: editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()">"</button>
      <span class="editor__sep"></span>
      <button type="button" :class="{ active: editor.isActive('codeBlock') }" @click="editor.chain().focus().toggleCodeBlock().run()">{ }</button>
      <button type="button" @click="onLinkClick">link</button>
      <button type="button" @click="onImageClick">image</button>
      <input ref="fileInput" type="file" accept="image/*" class="editor__file" @change="onFilePicked" />
    </div>
    <EditorContent v-if="editor" :editor="editor" class="editor__content" />
    <footer class="editor__status">
      <span :class="['editor__status-text', `editor__status-text--${status.state}`]">{{ statusText() }}</span>
      <button v-if="status.state === 'error'" class="editor__retry" type="button" @click="retry">retry</button>
    </footer>
  </div>
</template>

<style scoped>
.editor { flex: 1; display: flex; flex-direction: column; padding: 24px 32px; overflow-y: auto; }
.editor__title { background: transparent; border: none; color: var(--text, #e6e6e6); font-family: inherit; font-size: 24px; padding: 8px 0; margin-bottom: 16px; }
.editor__title:focus { outline: none; }
.editor__toolbar { display: flex; align-items: center; gap: 4px; padding: 6px 0; margin-bottom: 12px; border-bottom: 1px solid var(--border, #222); }
.editor__toolbar button { background: transparent; color: var(--text-dim, #999); border: 1px solid transparent; padding: 4px 8px; font-family: inherit; font-size: 13px; cursor: pointer; min-width: 28px; }
.editor__toolbar button:hover { color: var(--text, #e6e6e6); border-color: var(--border, #222); }
.editor__toolbar button.active { color: var(--accent, #6cf); border-color: var(--accent, #6cf); }
.editor__sep { width: 1px; height: 16px; background: var(--border, #222); margin: 0 4px; }
.editor__content { flex: 1; color: var(--text, #e6e6e6); font-size: 15px; line-height: 1.7; }
.editor__status { display: flex; align-items: center; gap: 12px; padding: 12px 0 0; font-size: 11px; color: var(--text-dim, #999); }
.editor__status-text--error { color: #f66; }
.editor__retry { background: transparent; color: var(--text-dim, #999); border: 1px solid var(--border, #222); padding: 2px 8px; font-family: inherit; font-size: 11px; cursor: pointer; }
.editor__file { display: none; }
</style>
```

- [ ] **Step 7: Run the my-zone suite**

Run: `npx vitest run src/my-zone`
Expected: PASS (text, useAutosave, usePosts, useTheme, NoteEditor smoke).

- [ ] **Step 8: Commit**

```bash
git add src/my-zone/composables/useDocEditor.js src/my-zone/NoteEditor.vue src/my-zone/PostEditor.vue src/my-zone/__tests__/NoteEditor.test.js
git commit -m "refactor(my-zone): shared useDocEditor; NoteEditor onto useAutosave; add PostEditor"
```

---

## Task 7: my-zone blog UI + theme toggle

**Files:**
- Modify: `src/my-zone/TopicSidebar.vue`
- Create: `src/my-zone/BlogShell.vue`
- Modify: `src/my-zone/NotesShell.vue`
- Modify: `src/my-zone/MyZoneApp.vue`
- Modify: `src/my-zone/styles/my-zone.css`
- Test: `src/my-zone/__tests__/TopicSidebar.test.js`, `src/my-zone/__tests__/BlogShell.test.js`

- [ ] **Step 1: Write the failing TopicSidebar test**

Create `src/my-zone/__tests__/TopicSidebar.test.js`:
```js
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('../composables/useTopics.js', () => ({
  useTopics: () => ({
    topics: { value: [] },
    ensureLoaded: vi.fn(),
    createTopic: vi.fn(),
    deleteTopic: vi.fn(),
  }),
}));
vi.mock('../composables/useNotes.js', () => ({
  useNotes: () => ({
    notesByTopic: { value: {} },
    fetchNotesForTopic: vi.fn(),
    createNote: vi.fn(),
    deleteNote: vi.fn(),
  }),
}));

import TopicSidebar from '../TopicSidebar.vue';

describe('TopicSidebar', () => {
  it('emits select-blog when the blog item is clicked', async () => {
    const wrapper = mount(TopicSidebar, { props: { selectedTopicId: null, selectedNoteId: null, blogActive: false } });
    await wrapper.find('.sidebar__blog').trigger('click');
    expect(wrapper.emitted('select-blog')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `npx vitest run src/my-zone/__tests__/TopicSidebar.test.js`
Expected: FAIL — no `.sidebar__blog` element.

- [ ] **Step 3: Add the pinned blog item to TopicSidebar**

In `src/my-zone/TopicSidebar.vue`, add `blogActive` to props:
```js
const props = defineProps({
  selectedTopicId: { type: String, default: null },
  selectedNoteId: { type: String, default: null },
  blogActive: { type: Boolean, default: false },
});
const emit = defineEmits(['select-topic', 'select-note', 'select-blog']);
```
Then, in the template, immediately after `<aside class="sidebar">` and before the first `<section ...>`, insert:
```html
    <button
      class="sidebar__blog"
      :class="{ 'sidebar__blog--active': blogActive }"
      @click="emit('select-blog')"
    >▸ blog</button>
```
And add to the `<style scoped>` block:
```css
.sidebar__blog {
  display: block;
  width: 100%;
  text-align: left;
  padding: 12px 20px;
  background: transparent;
  color: var(--text-dim, #999);
  border: none;
  border-bottom: 1px solid var(--border, #222);
  font-family: inherit;
  font-size: 13px;
  letter-spacing: 0.05em;
  cursor: pointer;
}
.sidebar__blog:hover { color: var(--text, #e6e6e6); }
.sidebar__blog--active { color: var(--accent, #6cf); }
```

- [ ] **Step 4: Run the TopicSidebar test**

Run: `npx vitest run src/my-zone/__tests__/TopicSidebar.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Write the failing BlogShell test**

Create `src/my-zone/__tests__/BlogShell.test.js`:
```js
import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

const fetchPosts = vi.fn().mockResolvedValue();
const createPost = vi.fn().mockResolvedValue({ $id: 'new' });
const publish = vi.fn().mockResolvedValue({});
const unpublish = vi.fn().mockResolvedValue({});
const deletePost = vi.fn().mockResolvedValue();
const posts = { value: [
  { $id: 'p1', title: 'First', status: 'published' },
  { $id: 'p2', title: 'Draft one', status: 'draft' },
] };

vi.mock('../composables/usePosts.js', () => ({
  usePosts: () => ({ posts, loading: { value: false }, error: { value: null }, fetchPosts, createPost, updatePost: vi.fn(), deletePost, publish, unpublish }),
}));
vi.mock('../PostEditor.vue', () => ({ default: { name: 'PostEditor', props: ['post'], template: '<div class="post-editor-stub" />' } }));

import BlogShell from '../BlogShell.vue';

describe('BlogShell', () => {
  it('lists posts with a status badge', async () => {
    const wrapper = mount(BlogShell);
    await flushPromises();
    const items = wrapper.findAll('.blog__item');
    expect(items).toHaveLength(2);
    expect(wrapper.text()).toContain('published');
    expect(wrapper.text()).toContain('draft');
  });

  it('creates a post via the new button', async () => {
    const wrapper = mount(BlogShell);
    await flushPromises();
    await wrapper.find('.blog__new').trigger('click');
    expect(createPost).toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Run it to verify failure**

Run: `npx vitest run src/my-zone/__tests__/BlogShell.test.js`
Expected: FAIL — cannot resolve `../BlogShell.vue`.

- [ ] **Step 7: Implement BlogShell**

Create `src/my-zone/BlogShell.vue`:
```vue
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
.blog__pub, .blog__delete { background: transparent; border: none; color: var(--text-dim, #999); cursor: pointer; padding: 0 8px; }
.blog__delete:hover { color: #f66; }
.blog__empty { padding: 8px; font-size: 12px; color: var(--text-dim, #999); font-style: italic; }
.blog__new { width: 100%; margin-top: 8px; padding: 6px 8px; background: var(--bg, #0a0a0a); color: var(--text, #e6e6e6); border: 1px solid var(--border, #222); font-family: inherit; font-size: 12px; text-align: left; cursor: pointer; }
.blog__editor-pane { flex: 1; display: flex; flex-direction: column; background: var(--bg, #0a0a0a); min-width: 0; }
.blog__placeholder { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-dim, #999); font-size: 13px; }
</style>
```

- [ ] **Step 8: Run the BlogShell test**

Run: `npx vitest run src/my-zone/__tests__/BlogShell.test.js`
Expected: PASS (2 tests).

- [ ] **Step 9: Wire blog mode into NotesShell**

Replace `src/my-zone/NotesShell.vue` `<script setup>` and template with blog awareness. Replace the `<script setup>` block contents with:
```js
import { computed, ref } from 'vue';
import TopicSidebar from './TopicSidebar.vue';
import NoteEditor from './NoteEditor.vue';
import BlogShell from './BlogShell.vue';
import { useNotes } from './composables/useNotes.js';

const selectedTopicId = ref(null);
const selectedNoteId = ref(null);
const blogActive = ref(false);

const { notesByTopic } = useNotes();

const selectedNote = computed(() => {
  if (!selectedTopicId.value || !selectedNoteId.value) return null;
  const list = notesByTopic.value[selectedTopicId.value] || [];
  return list.find((n) => n.$id === selectedNoteId.value) || null;
});

function onSelectTopic(id) {
  blogActive.value = false;
  selectedTopicId.value = id;
  selectedNoteId.value = null;
}
function onSelectNote(id) { selectedNoteId.value = id; }
function onSelectBlog() {
  blogActive.value = true;
  selectedTopicId.value = null;
  selectedNoteId.value = null;
}
```
Replace the template block with:
```html
<template>
  <div class="shell">
    <TopicSidebar
      :selected-topic-id="selectedTopicId"
      :selected-note-id="selectedNoteId"
      :blog-active="blogActive"
      @select-topic="onSelectTopic"
      @select-note="onSelectNote"
      @select-blog="onSelectBlog"
    />
    <BlogShell v-if="blogActive" />
    <section v-else class="shell__main">
      <NoteEditor v-if="selectedNote" :key="selectedNote.$id" :note="selectedNote" />
      <div v-else class="shell__placeholder">
        <p v-if="!selectedTopicId">select a topic from the sidebar</p>
        <p v-else>select a note or create one</p>
      </div>
    </section>
  </div>
</template>
```
Leave the `<style scoped>` block unchanged.

- [ ] **Step 10: Add the theme toggle to MyZoneApp + light palette**

Replace the entire `<script setup>` block of `src/my-zone/MyZoneApp.vue` (the opening tag, body, and closing tag) with exactly:
```vue
<script setup>
import './styles/my-zone.css';
import { useAuth } from './composables/useAuth.js';
import { useTheme } from './composables/useTheme.js';
import LoginForm from './LoginForm.vue';
import NotesShell from './NotesShell.vue';

const { currentUser, loading, logout } = useAuth();
const { theme, toggle } = useTheme();
</script>
```

In the template, change the root and header. Replace:
```html
  <div class="my-zone">
    <header class="my-zone__header">
      <span class="my-zone__title">my-zone</span>
      <button v-if="currentUser" class="my-zone__logout" @click="logout">logout</button>
    </header>
```
with:
```html
  <div class="my-zone" :data-theme="theme">
    <header class="my-zone__header">
      <span class="my-zone__title">my-zone</span>
      <div class="my-zone__actions">
        <button class="my-zone__theme" @click="toggle">{{ theme === 'dark' ? '☀ light' : '☾ dark' }}</button>
        <button v-if="currentUser" class="my-zone__logout" @click="logout">logout</button>
      </div>
    </header>
```
Add to the `<style scoped>` block of MyZoneApp.vue:
```css
.my-zone__actions { display: flex; gap: 8px; align-items: center; }
.my-zone__theme {
  background: transparent;
  color: var(--text-dim, #999);
  border: 1px solid var(--border, #222);
  padding: 4px 10px;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}
```

In `src/my-zone/styles/my-zone.css`, append the light palette:
```css
.my-zone[data-theme='light'] {
  --bg: #f5f5f2;
  --bg-elev: #ffffff;
  --text: #1a1a1a;
  --text-dim: #555;
  --border: #d8d8d2;
  --accent: #2b6cff;
}
```
And ensure the `.my-zone` root consumes these via the existing `var(--bg, …)` usages (already the case).

- [ ] **Step 11: Run the my-zone suite**

Run: `npx vitest run src/my-zone`
Expected: PASS (all my-zone tests).

- [ ] **Step 12: Commit**

```bash
git add src/my-zone
git commit -m "feat(my-zone): blog mode (sidebar + BlogShell) and dark/light theme toggle"
```

---

## Task 8: Public posts read service

**Files:**
- Create: `src/my-zone/services/posts.js`
- Test: `src/my-zone/services/__tests__/posts.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/my-zone/services/__tests__/posts.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const listDocuments = vi.fn();
vi.mock('../appwrite.js', () => ({
  databases: { listDocuments: (...a) => listDocuments(...a) },
  DATABASE_ID: 'db',
  POSTS_COLLECTION_ID: 'posts',
  Query: {
    equal: (f, v) => `equal:${f}:${v}`,
    orderDesc: (f) => `orderDesc:${f}`,
    limit: (n) => `limit:${n}`,
  },
}));

import { listPublishedPosts, getPublishedPostBySlug } from '../posts.js';

beforeEach(() => listDocuments.mockReset());

describe('posts read service', () => {
  it('lists published posts ordered by publishedAt', async () => {
    listDocuments.mockResolvedValue({ documents: [{ $id: 'p1' }] });
    const res = await listPublishedPosts();
    expect(res).toHaveLength(1);
    const [, , queries] = listDocuments.mock.calls[0];
    expect(queries).toContain('equal:status:published');
    expect(queries).toContain('orderDesc:publishedAt');
  });

  it('returns a single post by slug or null', async () => {
    listDocuments.mockResolvedValue({ documents: [{ $id: 'p1', slug: 'hello' }] });
    const found = await getPublishedPostBySlug('hello');
    expect(found.slug).toBe('hello');

    listDocuments.mockResolvedValue({ documents: [] });
    const none = await getPublishedPostBySlug('nope');
    expect(none).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `npx vitest run src/my-zone/services/__tests__/posts.test.js`
Expected: FAIL — cannot resolve `../posts.js`.

- [ ] **Step 3: Implement the read service**

Create `src/my-zone/services/posts.js`:
```js
import { databases, DATABASE_ID, POSTS_COLLECTION_ID, Query } from './appwrite.js';

export async function listPublishedPosts() {
  const res = await databases.listDocuments(DATABASE_ID, POSTS_COLLECTION_ID, [
    Query.equal('status', 'published'),
    Query.orderDesc('publishedAt'),
    Query.limit(100),
  ]);
  return res.documents;
}

export async function getPublishedPostBySlug(slug) {
  const res = await databases.listDocuments(DATABASE_ID, POSTS_COLLECTION_ID, [
    Query.equal('slug', slug),
    Query.equal('status', 'published'),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}
```

- [ ] **Step 4: Run it to verify pass**

Run: `npx vitest run src/my-zone/services/__tests__/posts.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/my-zone/services/posts.js src/my-zone/services/__tests__/posts.test.js
git commit -m "feat(blog): public read service for published posts"
```

---

## Task 9: Public blog pages + routes

**Files:**
- Create: `src/pages/BlogListPage.vue`, `src/pages/BlogPostPage.vue`
- Modify: `src/router/index.js`
- Test: `src/pages/__tests__/blog-pages.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/pages/__tests__/blog-pages.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { routes } from '../../router/index.js';

const listPublishedPosts = vi.fn();
const getPublishedPostBySlug = vi.fn();
vi.mock('../../my-zone/services/posts.js', () => ({
  listPublishedPosts: (...a) => listPublishedPosts(...a),
  getPublishedPostBySlug: (...a) => getPublishedPostBySlug(...a),
}));

import BlogListPage from '../BlogListPage.vue';
import BlogPostPage from '../BlogPostPage.vue';

function router() {
  const r = createRouter({ history: createMemoryHistory(), routes });
  r.push('/');
  return r;
}

beforeEach(() => {
  listPublishedPosts.mockReset();
  getPublishedPostBySlug.mockReset();
});

describe('BlogListPage', () => {
  it('renders one entry per published post', async () => {
    listPublishedPosts.mockResolvedValue([
      { $id: 'p1', title: 'First', slug: 'first', excerpt: 'hi', publishedAt: '2026-01-01T00:00:00.000Z' },
      { $id: 'p2', title: 'Second', slug: 'second', excerpt: 'yo', publishedAt: '2026-01-02T00:00:00.000Z' },
    ]);
    const r = router();
    await r.isReady();
    const wrapper = mount(BlogListPage, { global: { plugins: [r] } });
    await flushPromises();
    expect(wrapper.findAll('.blog-list__item')).toHaveLength(2);
  });
});

describe('BlogPostPage', () => {
  it('renders the post body when found', async () => {
    getPublishedPostBySlug.mockResolvedValue({ title: 'First', contentHtml: '<p>Body here</p>', publishedAt: '2026-01-01T00:00:00.000Z' });
    const r = router();
    r.push('/blog/first');
    await r.isReady();
    const wrapper = mount(BlogPostPage, { global: { plugins: [r] } });
    await flushPromises();
    expect(wrapper.find('.post-body').html()).toContain('Body here');
  });

  it('shows a not-found state when missing', async () => {
    getPublishedPostBySlug.mockResolvedValue(null);
    const r = router();
    r.push('/blog/nope');
    await r.isReady();
    const wrapper = mount(BlogPostPage, { global: { plugins: [r] } });
    await flushPromises();
    expect(wrapper.text().toLowerCase()).toContain('not found');
  });
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `npx vitest run src/pages/__tests__/blog-pages.test.js`
Expected: FAIL — cannot resolve `../BlogListPage.vue` (and routes lack blog entries).

- [ ] **Step 3: Create BlogListPage**

Create `src/pages/BlogListPage.vue`:
```vue
<script setup>
import { onMounted, ref } from 'vue';
import { listPublishedPosts } from '../my-zone/services/posts.js';
import ReturnLink from '../components/ReturnLink.vue';

const posts = ref([]);
const loading = ref(true);
const error = ref(null);

function fmtDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return ''; }
}

onMounted(async () => {
  try {
    posts.value = await listPublishedPosts();
  } catch (err) {
    error.value = err?.message || 'failed to load posts';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="page">
    <h2 class="blog-list__heading">~/blog</h2>
    <p v-if="loading" class="blog-list__status">loading…</p>
    <p v-else-if="error" class="blog-list__status">{{ error }}</p>
    <p v-else-if="posts.length === 0" class="blog-list__status">no posts yet</p>
    <ul v-else class="blog-list">
      <li v-for="post in posts" :key="post.$id" class="blog-list__item">
        <RouterLink :to="`/blog/${post.slug}`" class="blog-list__link">
          <span class="blog-list__title">{{ post.title || 'Untitled' }}</span>
          <span class="blog-list__date">{{ fmtDate(post.publishedAt) }}</span>
        </RouterLink>
        <p class="blog-list__excerpt">{{ post.excerpt }}</p>
      </li>
    </ul>
    <ReturnLink />
  </main>
</template>

<style scoped>
.page { position: relative; z-index: 1; max-width: var(--content-max); margin: 0 auto; padding: 80px 24px 96px; }
.blog-list__heading { margin-bottom: 32px; }
.blog-list__status { color: var(--text-dim); }
.blog-list { list-style: none; margin: 0; padding: 0; }
.blog-list__item { padding: 20px 0; border-bottom: 1px solid var(--border); }
.blog-list__link { display: flex; justify-content: space-between; gap: 1ch; align-items: baseline; color: var(--accent); text-decoration: none; }
.blog-list__link:hover .blog-list__title { text-shadow: var(--glow-cyan); }
.blog-list__title { font-size: var(--fs-md); }
.blog-list__date { color: var(--text-dim); font-size: var(--fs-xs); }
.blog-list__excerpt { margin: 8px 0 0; color: var(--text-dim); }
</style>
```

- [ ] **Step 4: Create BlogPostPage**

Create `src/pages/BlogPostPage.vue`:
```vue
<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getPublishedPostBySlug } from '../my-zone/services/posts.js';
import ReturnLink from '../components/ReturnLink.vue';

const route = useRoute();
const post = ref(null);
const loading = ref(true);
const notFound = ref(false);

function fmtDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return ''; }
}

async function load(slug) {
  loading.value = true;
  notFound.value = false;
  post.value = null;
  try {
    const found = await getPublishedPostBySlug(slug);
    if (found) post.value = found;
    else notFound.value = true;
  } catch {
    notFound.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => load(route.params.slug));
watch(() => route.params.slug, (slug) => { if (slug) load(slug); });
</script>

<template>
  <main class="page">
    <p v-if="loading" class="post__status">loading…</p>
    <template v-else-if="notFound">
      <h2>post not found</h2>
      <p class="post__status">that post does not exist or is not published.</p>
    </template>
    <template v-else>
      <h2 class="post__title">{{ post.title }}</h2>
      <p class="post__date">{{ fmtDate(post.publishedAt) }}</p>
      <article class="post-body" v-html="post.contentHtml"></article>
    </template>
    <ReturnLink />
  </main>
</template>

<style scoped>
.page { position: relative; z-index: 1; max-width: var(--content-max); margin: 0 auto; padding: 80px 24px 96px; }
.post__status { color: var(--text-dim); }
.post__title { margin-bottom: 8px; }
.post__date { color: var(--text-dim); font-size: var(--fs-xs); margin-bottom: 32px; }
.post-body { color: var(--text); line-height: 1.8; }
.post-body :deep(h1), .post-body :deep(h2), .post-body :deep(h3) { font-family: var(--font-display); margin: 24px 0 12px; }
.post-body :deep(a) { color: var(--accent); text-decoration: underline; }
.post-body :deep(img) { max-width: 100%; height: auto; }
.post-body :deep(pre) { background: var(--bg-elev); padding: 12px; overflow-x: auto; border-radius: 4px; }
.post-body :deep(code) { background: var(--bg-elev); padding: 1px 6px; border-radius: 2px; }
.post-body :deep(blockquote) { border-left: 2px solid var(--border); padding-left: 16px; color: var(--text-dim); }
</style>
```

- [ ] **Step 5: Add the routes**

In `src/router/index.js`, add imports after the `ContactPage` import:
```js
import BlogListPage from '../pages/BlogListPage.vue';
import BlogPostPage from '../pages/BlogPostPage.vue';
```
And add these route entries to the `routes` array immediately before the `'/:pathMatch(.*)*'` catch-all:
```js
  { path: '/blog', name: 'blog', component: BlogListPage },
  { path: '/blog/:slug', name: 'blog-post', component: BlogPostPage },
```

- [ ] **Step 6: Run the blog-pages test**

Run: `npx vitest run src/pages/__tests__/blog-pages.test.js`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add src/pages/BlogListPage.vue src/pages/BlogPostPage.vue src/pages/__tests__/blog-pages.test.js src/router/index.js
git commit -m "feat(blog): public /blog list + /blog/:slug post pages"
```

---

## Task 10: Terminal blog navigation

**Files:**
- Modify: `src/terminal/commands.js`
- Modify: `src/terminal/__tests__/commands.test.js`
- Modify: `src/components/TerminalHome.vue`
- Modify: `src/components/__tests__/TerminalHome.test.js`

- [ ] **Step 1: Update the parser test for blog**

In `src/terminal/__tests__/commands.test.js`, add these cases inside the `describe('parseCommand', …)` block:
```js
  it('navigates to blog on bare/cd/open', () => {
    expect(parseCommand('blog')).toEqual({ type: 'navigate', to: '/blog' });
    expect(parseCommand('cd blog')).toEqual({ type: 'navigate', to: '/blog' });
    expect(parseCommand('open blog')).toEqual({ type: 'navigate', to: '/blog' });
  });
```
The existing `SECTIONS` equality test stays unchanged — `SECTIONS` remains the five portfolio sections.

- [ ] **Step 2: Run it to verify failure**

Run: `npx vitest run src/terminal/__tests__/commands.test.js`
Expected: FAIL — `parseCommand('blog')` currently returns `command not found`.

- [ ] **Step 3: Add blog as a nav target in the parser**

In `src/terminal/commands.js`, add a nav-targets constant and use it. Replace the file body with:
```js
export const SECTIONS = ['about', 'experience', 'skills', 'education', 'contact'];
export const NAV_TARGETS = [...SECTIONS, 'blog'];

export function parseCommand(input) {
  const raw = String(input).trim();
  if (raw === '') return { type: 'noop' };

  const [cmd, ...args] = raw.split(/\s+/);
  const arg = args[0];

  switch (cmd) {
    case 'ls':
      return { type: 'ls' };
    case 'help':
      return { type: 'help' };
    case 'clear':
      return { type: 'clear' };
    case 'whoami':
      return { type: 'replay', key: 'whoami' };
    case 'cat':
      if (arg === 'profile.txt') return { type: 'replay', key: 'profile' };
      return { type: 'error', message: `cat: ${arg ?? ''}: No such file` };
    case 'cd':
    case 'open':
      if (NAV_TARGETS.includes(arg)) return { type: 'navigate', to: `/${arg}` };
      return { type: 'error', message: `${cmd}: no such section: ${arg ?? ''}` };
    default:
      if (NAV_TARGETS.includes(cmd)) return { type: 'navigate', to: `/${cmd}` };
      return { type: 'error', message: `command not found: ${cmd}` };
  }
}
```

- [ ] **Step 4: Run it to verify pass**

Run: `npx vitest run src/terminal/__tests__/commands.test.js`
Expected: PASS (SECTIONS test + 8 original + new blog case).

- [ ] **Step 5: Update the TerminalHome test for the blog link**

In `src/components/__tests__/TerminalHome.test.js`, change the "renders a clickable link per section" test to account for the extra blog link:
```js
  it('renders a clickable link per section plus blog', async () => {
    const wrapper = mount(TerminalHome, { global: { plugins: [router] } });
    await nextTick();
    const links = wrapper.findAll('.section-link');
    expect(links).toHaveLength(6);
    expect(wrapper.text()).toContain('blog/');
  });
```

- [ ] **Step 6: Run it to verify failure**

Run: `npx vitest run src/components/__tests__/TerminalHome.test.js`
Expected: FAIL — only 5 links rendered.

- [ ] **Step 7: Add the blog link in TerminalHome**

In `src/components/TerminalHome.vue`, change the `sectionLinks` definition:
```js
const sectionLinks = [...SECTIONS.map((s) => ({ to: `/${s}`, label: `${s}/` })), { to: '/blog', label: 'blog/' }];
```
No template change is needed — both the boot `links` line and the `ls` output iterate `sectionLinks`.

- [ ] **Step 8: Run it to verify pass**

Run: `npx vitest run src/components/__tests__/TerminalHome.test.js`
Expected: PASS (4 tests, link count now 6).

- [ ] **Step 9: Commit**

```bash
git add src/terminal/commands.js src/terminal/__tests__/commands.test.js src/components/TerminalHome.vue src/components/__tests__/TerminalHome.test.js
git commit -m "feat(blog): terminal blog/ link + blog nav command"
```

---

## Task 11: Full verification

**Files:** none (verification only; tuning allowed in touched files).

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: all tests PASS.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds, exit 0, no unresolved imports.

- [ ] **Step 3: Manual smoke (requires a real Appwrite POSTS collection + env)**

Confirm `.env` has `VITE_APPWRITE_POSTS_COLLECTION_ID` set and the collection exists (Task 1, Step 3). Run `npm run dev`, then verify:
- `/my-zone` → login → header shows a theme toggle; toggling switches light/dark and persists across reload.
- Sidebar shows a "▸ blog" item; selecting it shows the post list. "+ new post" creates a draft; editing autosaves; publish flips the badge to `published`; unpublish reverts.
- Public `/blog` lists only published posts; clicking one opens `/blog/<slug>` rendering its body; an unknown slug shows "post not found".
- Terminal homepage lists `blog/`; typing `blog` (or `cd blog`) routes to `/blog`.
- Notes still create/edit/save (NoteEditor refactor regression check).

- [ ] **Step 4: Commit any tuning**

```bash
git add -A
git commit -m "chore(blog): post-verification tuning"
```
(Skip if no changes.)

---

## Self-Review Notes

- **Spec coverage:** POSTS collection + env (T1); auto slug/excerpt via shared helpers (T2); draft↔published with publishedAt + public-read permission flip (T4); blog-as-sidebar-item + BlogShell management (T7); shared editor reuse via useDocEditor/useAutosave (T3, T6); public /blog + /blog/:slug reading published via Role.any (T8, T9); terminal blog link/command (T10); my-zone-only persisted dark/light toggle (T5, T7). All spec sections mapped.
- **Type/name consistency:** `usePosts` exposes `fetchPosts/createPost/updatePost/deletePost/publish/unpublish` — consumed by BlogShell (T7) and tested (T4). `useAutosave(save, snapshot, opts)` returns `{ status, schedule, flush, retry, cancel, statusText }` — used identically in NoteEditor and PostEditor (T6) and tested (T3). `useTheme` returns `{ theme, toggle }` — used in MyZoneApp (T7) and tested (T5). Read service names `listPublishedPosts`/`getPublishedPostBySlug` match across T8/T9. `SECTIONS` stays five; `NAV_TARGETS` adds blog (T10), consistent with router routes (T9).
- **Risk note:** No pre-existing my-zone tests guard the NoteEditor refactor; T6 adds a smoke test and Task 3 covers the autosave logic independently of TipTap/jsdom. If TipTap cannot initialise under jsdom, T6 Step 5 narrows the assertion rather than blocking.
- **Placeholder scan:** none found.

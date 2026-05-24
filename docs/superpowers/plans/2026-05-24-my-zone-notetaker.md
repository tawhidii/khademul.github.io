# /my-zone Notetaker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private, single-user notetaker at hidden URL `/my-zone` on the existing Vue 3 portfolio site, with topic organization, a TipTap WYSIWYG editor, image upload, and Appwrite Cloud persistence.

**Architecture:** Two roots share one `index.html`. `main.js` checks `window.location.pathname` and lazy-mounts either the existing portfolio `App.vue` or a new `MyZoneApp.vue`. GitHub Pages serves `/my-zone` via a `404.html` SPA fallback. Notes UI uses composables wrapping the Appwrite Web SDK; permissions are enforced at the Appwrite collection level so the client code stays clean.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Vite, Appwrite Web SDK (`appwrite`), TipTap (`@tiptap/vue-3`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`, `@tiptap/extension-underline`).

**No tests:** Per user preference, this feature ships without automated tests. Each task ends with a manual verification step in the dev server before commit. Existing Vitest tests in the repo are left untouched.

---

## Reference: Spec

This plan implements `docs/superpowers/specs/2026-05-24-my-zone-notetaker-design.md`. Read that spec before starting.

## File Map

```
public/
  404.html                         # NEW — SPA fallback for unknown paths
.env                               # NEW — local Appwrite credentials (gitignored)
.env.example                       # NEW — committed template
.gitignore                         # MODIFY — add .env
src/
  main.js                          # MODIFY — restore stashed path + dispatch root
  my-zone/
    MyZoneApp.vue                  # NEW — owns auth state, renders LoginForm or NotesShell
    LoginForm.vue                  # NEW — email/password
    NotesShell.vue                 # NEW — two-pane layout, selection state, logout
    TopicSidebar.vue               # NEW — topics list + selected topic's notes list
    NoteEditor.vue                 # NEW — title + TipTap editor + save indicator
    composables/
      useAuth.js                   # NEW
      useTopics.js                 # NEW
      useNotes.js                  # NEW
    services/
      appwrite.js                  # NEW — single Appwrite client
      images.js                    # NEW — image upload helper
    styles/
      my-zone.css                  # NEW — scoped to /my-zone
```

---

## Task 1: Appwrite Cloud setup (out-of-band)

**Files:** none (manual steps in the Appwrite Cloud console)

This task produces the IDs the rest of the plan needs. Do it before any code work. Keep the values in a temp note — you'll write them into `.env` in Task 2.

- [ ] **Step 1: Create the project**

Go to https://cloud.appwrite.io → Create project. Name it (e.g. `my-folio-notes`). Record the **Project ID** and the **API Endpoint** shown on the project dashboard (usually `https://cloud.appwrite.io/v1` or a region-specific one like `https://fra.cloud.appwrite.io/v1`).

- [ ] **Step 2: Register web platforms**

In project settings → Platforms → Add platform → Web. Add two:
- Name: `local`, Hostname: `localhost`
- Name: `prod`, Hostname: `khademulbari.com`

- [ ] **Step 3: Create the single user account**

Auth → Users → Create user. Use your real email and a strong password. Record the resulting **User ID**.

- [ ] **Step 4: Disable signups**

Auth → Security → toggle off any "allow new users to sign up" / "user registration" option so the account you just made is the only one that can ever exist.

- [ ] **Step 5: Create the database**

Databases → Create database. Name: `notes-db`. Record the **Database ID**.

- [ ] **Step 6: Create the `topics` collection**

Inside `notes-db` → Create collection. Name: `topics`. Record the **Collection ID**.

Attributes (Add attribute):
- `name` — String, size 80, required
- `slug` — String, size 100, required
- `noteCount` — Integer, default 0, required
- `createdAt` — Datetime, required
- `updatedAt` — Datetime, required

Indexes (Indexes tab → Create index):
- `slug_unique` — type `unique`, attribute `slug`
- `createdAt_idx` — type `key`, attribute `createdAt`

Permissions (Settings tab of the collection) — for each of Read, Create, Update, Delete, add a role: **User** → paste your User ID from Step 3. Leave "Document Security" OFF (collection-level perms apply to all documents).

- [ ] **Step 7: Create the `notes` collection**

Inside `notes-db` → Create collection. Name: `notes`. Record the **Collection ID**.

Attributes:
- `title` — String, size 200, required
- `topicId` — String, size 64, required
- `contentHtml` — String, size 1000000 (1M), required (default empty string is OK)
- `contentJson` — String, size 1000000, required
- `excerpt` — String, size 300, not required
- `createdAt` — Datetime, required
- `updatedAt` — Datetime, required

Indexes:
- `topicId_idx` — type `key`, attribute `topicId`
- `updatedAt_idx` — type `key`, attribute `updatedAt`, order `desc`

Permissions: same as topics — Read/Create/Update/Delete for User role with your User ID. Document Security OFF.

- [ ] **Step 8: Create the storage bucket**

Storage → Create bucket. Name: `note-images`. Record the **Bucket ID**.

In bucket Settings:
- File security: **OFF** (bucket-level perms apply)
- Permissions: Read/Create/Update/Delete for User role with your User ID
- Allowed file extensions: `png, jpg, jpeg, gif, webp, svg`
- Maximum file size: `5 MB`

- [ ] **Step 9: Verify**

Open Auth → Users — your single user shows. Open Databases → notes-db — both collections show with the right attributes. Open Storage — `note-images` bucket shows.

You should now have on hand:
- API Endpoint
- Project ID
- User ID
- Database ID
- Topics Collection ID
- Notes Collection ID
- Bucket ID

---

## Task 2: Environment file setup

**Files:**
- Create: `.env`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Add `.env` to `.gitignore`**

Edit `.gitignore`. Find the line `*.local` and add `.env` on the next line. The new section should look like:

```
node_modules
dist
dist-ssr
*.local
.env
```

- [ ] **Step 2: Create `.env.example`**

Create the file with content:

```
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=
VITE_APPWRITE_DATABASE_ID=
VITE_APPWRITE_TOPICS_COLLECTION_ID=
VITE_APPWRITE_NOTES_COLLECTION_ID=
VITE_APPWRITE_IMAGES_BUCKET_ID=
```

- [ ] **Step 3: Create `.env` with real values**

Copy `.env.example` to `.env` and fill in the IDs you collected in Task 1.

- [ ] **Step 4: Verify `.env` is ignored**

Run: `git status`
Expected: `.env.example` and modified `.gitignore` appear; `.env` does NOT appear.

- [ ] **Step 5: Commit**

```bash
git add .env.example .gitignore
git commit -m "config: add Appwrite env template and ignore .env"
```

---

## Task 3: SPA fallback `404.html`

**Files:**
- Create: `public/404.html`

When GitHub Pages can't find a path it serves `404.html`. We use that page to stash the original path and bounce to `/`, where `main.js` will restore it.

- [ ] **Step 1: Create `public/404.html`**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Redirecting…</title>
    <script>
      (function () {
        var target = window.location.pathname + window.location.search + window.location.hash;
        try {
          sessionStorage.setItem('spa-redirect-path', target);
        } catch (e) {}
        window.location.replace('/');
      })();
    </script>
  </head>
  <body></body>
</html>
```

- [ ] **Step 2: Manual verification**

Run: `npm run build && npm run preview`
Expected: build completes, preview server starts. Open `http://localhost:4173/anything-random` — you should be bounced to `http://localhost:4173/` (the portfolio loads). Stop the preview server when done (Ctrl+C).

(Vite's preview server doesn't run the GH Pages fallback exactly the same way — it may show a Vite 404. If so, this is OK; the real test is after deploy. Move on.)

- [ ] **Step 3: Commit**

```bash
git add public/404.html
git commit -m "feat(my-zone): SPA 404 fallback for GitHub Pages"
```

---

## Task 4: `main.js` path dispatch

**Files:**
- Modify: `src/main.js`

Replace the eager App import with a path check that lazy-imports the right root. Restore any path stashed by `404.html` first.

- [ ] **Step 1: Rewrite `src/main.js`**

```js
import { createApp } from 'vue';
import './assets/styles/main.css';

// Restore the original path stashed by public/404.html (GitHub Pages SPA fallback).
const stashed = sessionStorage.getItem('spa-redirect-path');
if (stashed) {
  sessionStorage.removeItem('spa-redirect-path');
  history.replaceState(null, '', stashed);
}

const path = window.location.pathname;
const isMyZone = path === '/my-zone' || path === '/my-zone/';

if (isMyZone) {
  import('./my-zone/MyZoneApp.vue').then(({ default: MyZoneApp }) => {
    createApp(MyZoneApp).mount('#app');
  });
} else {
  import('./App.vue').then(({ default: App }) => {
    createApp(App).mount('#app');
  });
}
```

- [ ] **Step 2: Manual verification (portfolio still works)**

Run: `npm run dev`
Open `http://localhost:5173/` — portfolio should render identically to before. Stop the dev server.

Expected: no console errors, all existing sections (nav, hero, about, experience, skills, education, contact) render. The bundle for `/my-zone` is not loaded (no Network request for `MyZoneApp.vue`).

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "feat(my-zone): pathname-based root dispatch"
```

---

## Task 5: `MyZoneApp.vue` placeholder

**Files:**
- Create: `src/my-zone/MyZoneApp.vue`
- Create: `src/my-zone/styles/my-zone.css`

A minimal placeholder so we can confirm `/my-zone` routes correctly before adding auth.

- [ ] **Step 1: Create `src/my-zone/styles/my-zone.css`**

```css
.my-zone {
  min-height: 100vh;
  background: var(--bg, #0a0a0a);
  color: var(--text, #e6e6e6);
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  display: flex;
  flex-direction: column;
}

.my-zone__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border, #222);
}

.my-zone__title {
  font-size: 14px;
  letter-spacing: 0.05em;
  color: var(--text-dim, #999);
}

.my-zone__body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim, #999);
}
```

- [ ] **Step 2: Create `src/my-zone/MyZoneApp.vue`**

```vue
<script setup>
import './styles/my-zone.css';
</script>

<template>
  <div class="my-zone">
    <header class="my-zone__header">
      <span class="my-zone__title">my-zone</span>
    </header>
    <main class="my-zone__body">
      <p>my-zone is live.</p>
    </main>
  </div>
</template>
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`
Open `http://localhost:5173/my-zone` — should render the placeholder with `my-zone is live.`. Open `http://localhost:5173/` — portfolio still renders.
Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/my-zone/MyZoneApp.vue src/my-zone/styles/my-zone.css
git commit -m "feat(my-zone): placeholder root component"
```

---

## Task 6: Install Appwrite, create client service

**Files:**
- Modify: `package.json` (via `npm install`)
- Create: `src/my-zone/services/appwrite.js`

- [ ] **Step 1: Install the SDK**

Run: `npm install appwrite`
Expected: command completes; `package.json` shows `appwrite` in dependencies.

- [ ] **Step 2: Create `src/my-zone/services/appwrite.js`**

```js
import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  throw new Error(
    'Missing Appwrite env vars. Copy .env.example to .env and fill in your project values.'
  );
}

const client = new Client().setEndpoint(endpoint).setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID, Query, Permission, Role };

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const TOPICS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TOPICS_COLLECTION_ID;
export const NOTES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_NOTES_COLLECTION_ID;
export const IMAGES_BUCKET_ID = import.meta.env.VITE_APPWRITE_IMAGES_BUCKET_ID;
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`
Open `http://localhost:5173/my-zone` — placeholder still renders, no console errors. (No import of `appwrite.js` happens yet; this just verifies the install didn't break the build.)
Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/my-zone/services/appwrite.js
git commit -m "feat(my-zone): Appwrite client service"
```

---

## Task 7: `useAuth` composable

**Files:**
- Create: `src/my-zone/composables/useAuth.js`

A reactive auth state singleton: `currentUser`, `login`, `logout`, `loading`.

- [ ] **Step 1: Create `src/my-zone/composables/useAuth.js`**

```js
import { ref } from 'vue';
import { account } from '../services/appwrite.js';

const currentUser = ref(null);
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

export function useAuth() {
  bootstrap();
  return { currentUser, loading, error, login, logout };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/my-zone/composables/useAuth.js
git commit -m "feat(my-zone): useAuth composable"
```

---

## Task 8: `LoginForm.vue`

**Files:**
- Create: `src/my-zone/LoginForm.vue`

- [ ] **Step 1: Create `src/my-zone/LoginForm.vue`**

```vue
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
```

- [ ] **Step 2: Commit**

```bash
git add src/my-zone/LoginForm.vue
git commit -m "feat(my-zone): LoginForm component"
```

---

## Task 9: Wire login gate into `MyZoneApp.vue`

**Files:**
- Modify: `src/my-zone/MyZoneApp.vue`

- [ ] **Step 1: Replace `src/my-zone/MyZoneApp.vue`**

```vue
<script setup>
import './styles/my-zone.css';
import { useAuth } from './composables/useAuth.js';
import LoginForm from './LoginForm.vue';

const { currentUser, loading, logout } = useAuth();
</script>

<template>
  <div class="my-zone">
    <header class="my-zone__header">
      <span class="my-zone__title">my-zone</span>
      <button v-if="currentUser" class="my-zone__logout" @click="logout">logout</button>
    </header>
    <main class="my-zone__body">
      <p v-if="loading">…</p>
      <LoginForm v-else-if="!currentUser" />
      <p v-else>signed in as {{ currentUser.email }} — notes UI coming next</p>
    </main>
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
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`
Open `http://localhost:5173/my-zone`. Expected:
1. Login form appears.
2. Enter the credentials you created in Task 1 Step 3. After submit, the body should change to `signed in as your@email — notes UI coming next` and a `logout` button appears in the header.
3. Reload the page — you should still be signed in (Appwrite persists the session).
4. Click `logout` — login form returns.
5. Try wrong credentials — red error message under the button.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/my-zone/MyZoneApp.vue
git commit -m "feat(my-zone): auth gate in MyZoneApp"
```

---

## Task 10: `useTopics` composable

**Files:**
- Create: `src/my-zone/composables/useTopics.js`

- [ ] **Step 1: Create `src/my-zone/composables/useTopics.js`**

```js
import { ref } from 'vue';
import { databases, DATABASE_ID, TOPICS_COLLECTION_ID, ID, Query } from '../services/appwrite.js';

const topics = ref([]);
const loading = ref(false);
const error = ref(null);
let loadedOnce = false;

function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'topic';
}

async function fetchTopics() {
  loading.value = true;
  error.value = null;
  try {
    const res = await databases.listDocuments(DATABASE_ID, TOPICS_COLLECTION_ID, [
      Query.orderAsc('createdAt'),
      Query.limit(200),
    ]);
    topics.value = res.documents;
    loadedOnce = true;
  } catch (err) {
    error.value = err?.message || 'Failed to load topics';
  } finally {
    loading.value = false;
  }
}

async function ensureLoaded() {
  if (!loadedOnce) await fetchTopics();
}

async function createTopic(name) {
  const now = new Date().toISOString();
  const doc = await databases.createDocument(DATABASE_ID, TOPICS_COLLECTION_ID, ID.unique(), {
    name,
    slug: toSlug(name),
    noteCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  topics.value = [...topics.value, doc];
  return doc;
}

async function renameTopic(id, name) {
  const now = new Date().toISOString();
  const updated = await databases.updateDocument(DATABASE_ID, TOPICS_COLLECTION_ID, id, {
    name,
    slug: toSlug(name),
    updatedAt: now,
  });
  topics.value = topics.value.map((t) => (t.$id === id ? updated : t));
  return updated;
}

async function deleteTopic(id) {
  await databases.deleteDocument(DATABASE_ID, TOPICS_COLLECTION_ID, id);
  topics.value = topics.value.filter((t) => t.$id !== id);
}

function adjustNoteCount(topicId, delta) {
  const topic = topics.value.find((t) => t.$id === topicId);
  if (!topic) return;
  const newCount = Math.max(0, (topic.noteCount || 0) + delta);
  topic.noteCount = newCount;
  databases
    .updateDocument(DATABASE_ID, TOPICS_COLLECTION_ID, topicId, { noteCount: newCount })
    .catch(() => {
      /* drift is acceptable per spec; a reconcile script handles it */
    });
}

export function useTopics() {
  return {
    topics,
    loading,
    error,
    ensureLoaded,
    fetchTopics,
    createTopic,
    renameTopic,
    deleteTopic,
    adjustNoteCount,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/my-zone/composables/useTopics.js
git commit -m "feat(my-zone): useTopics composable"
```

---

## Task 11: `TopicSidebar.vue` — topics section

**Files:**
- Create: `src/my-zone/TopicSidebar.vue`

The sidebar starts with just the topics half. Notes section is added in Task 14.

- [ ] **Step 1: Create `src/my-zone/TopicSidebar.vue`**

```vue
<script setup>
import { onMounted, ref } from 'vue';
import { useTopics } from './composables/useTopics.js';

const props = defineProps({
  selectedTopicId: { type: String, default: null },
});
const emit = defineEmits(['select-topic']);

const { topics, ensureLoaded, createTopic, deleteTopic } = useTopics();
const newName = ref('');
const adding = ref(false);

onMounted(ensureLoaded);

async function onAdd() {
  const name = newName.value.trim();
  if (!name) return;
  adding.value = true;
  try {
    const topic = await createTopic(name);
    newName.value = '';
    emit('select-topic', topic.$id);
  } finally {
    adding.value = false;
  }
}

async function onDelete(topic) {
  const ok = window.confirm(
    topic.noteCount > 0
      ? `Delete topic "${topic.name}" and lose access to its ${topic.noteCount} note(s)?`
      : `Delete topic "${topic.name}"?`
  );
  if (!ok) return;
  await deleteTopic(topic.$id);
  if (props.selectedTopicId === topic.$id) emit('select-topic', null);
}
</script>

<template>
  <aside class="sidebar">
    <section class="sidebar__section">
      <header class="sidebar__header">
        <span>topics</span>
      </header>
      <ul class="sidebar__list">
        <li
          v-for="topic in topics"
          :key="topic.$id"
          class="sidebar__item"
          :class="{ 'sidebar__item--active': topic.$id === selectedTopicId }"
        >
          <button class="sidebar__select" @click="emit('select-topic', topic.$id)">
            <span>{{ topic.name }}</span>
            <span class="sidebar__count">{{ topic.noteCount || 0 }}</span>
          </button>
          <button class="sidebar__delete" title="delete topic" @click="onDelete(topic)">×</button>
        </li>
        <li v-if="topics.length === 0" class="sidebar__empty">no topics yet</li>
      </ul>
      <form class="sidebar__add" @submit.prevent="onAdd">
        <input v-model="newName" placeholder="+ new topic" :disabled="adding" />
      </form>
    </section>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  border-right: 1px solid var(--border, #222);
  background: var(--bg-elev, #111);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar__section {
  padding: 16px 12px;
  border-bottom: 1px solid var(--border, #222);
}

.sidebar__header {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim, #999);
  padding: 0 8px 8px;
}

.sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sidebar__item {
  display: flex;
  align-items: stretch;
}

.sidebar__item--active .sidebar__select {
  background: var(--bg, #0a0a0a);
  color: var(--text, #e6e6e6);
}

.sidebar__select {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  background: transparent;
  color: var(--text-dim, #999);
  border: none;
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.sidebar__select:hover {
  color: var(--text, #e6e6e6);
}

.sidebar__count {
  font-size: 11px;
  opacity: 0.6;
}

.sidebar__delete {
  background: transparent;
  border: none;
  color: var(--text-dim, #999);
  cursor: pointer;
  padding: 0 8px;
  opacity: 0;
  transition: opacity 0.1s;
}

.sidebar__item:hover .sidebar__delete {
  opacity: 1;
}

.sidebar__delete:hover {
  color: #f66;
}

.sidebar__empty {
  padding: 8px;
  font-size: 12px;
  color: var(--text-dim, #999);
  font-style: italic;
}

.sidebar__add input {
  width: 100%;
  margin-top: 8px;
  padding: 6px 8px;
  background: var(--bg, #0a0a0a);
  color: var(--text, #e6e6e6);
  border: 1px solid var(--border, #222);
  font-family: inherit;
  font-size: 12px;
}

.sidebar__add input:focus {
  outline: 1px solid var(--accent, #6cf);
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/my-zone/TopicSidebar.vue
git commit -m "feat(my-zone): TopicSidebar topics section"
```

---

## Task 12: `useNotes` composable

**Files:**
- Create: `src/my-zone/composables/useNotes.js`

- [ ] **Step 1: Create `src/my-zone/composables/useNotes.js`**

```js
import { ref } from 'vue';
import { databases, DATABASE_ID, NOTES_COLLECTION_ID, ID, Query } from '../services/appwrite.js';
import { useTopics } from './useTopics.js';

const notesByTopic = ref({});
const loading = ref(false);
const error = ref(null);

async function fetchNotesForTopic(topicId) {
  if (!topicId) return;
  loading.value = true;
  error.value = null;
  try {
    const res = await databases.listDocuments(DATABASE_ID, NOTES_COLLECTION_ID, [
      Query.equal('topicId', topicId),
      Query.orderDesc('updatedAt'),
      Query.limit(500),
    ]);
    notesByTopic.value = { ...notesByTopic.value, [topicId]: res.documents };
  } catch (err) {
    error.value = err?.message || 'Failed to load notes';
  } finally {
    loading.value = false;
  }
}

async function createNote(topicId) {
  const now = new Date().toISOString();
  const doc = await databases.createDocument(DATABASE_ID, NOTES_COLLECTION_ID, ID.unique(), {
    title: 'Untitled',
    topicId,
    contentHtml: '',
    contentJson: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
    excerpt: '',
    createdAt: now,
    updatedAt: now,
  });
  const list = notesByTopic.value[topicId] || [];
  notesByTopic.value = { ...notesByTopic.value, [topicId]: [doc, ...list] };
  useTopics().adjustNoteCount(topicId, +1);
  return doc;
}

async function updateNote(id, patch) {
  const now = new Date().toISOString();
  const updated = await databases.updateDocument(DATABASE_ID, NOTES_COLLECTION_ID, id, {
    ...patch,
    updatedAt: now,
  });
  const topicId = updated.topicId;
  const list = notesByTopic.value[topicId] || [];
  notesByTopic.value = {
    ...notesByTopic.value,
    [topicId]: list.map((n) => (n.$id === id ? updated : n)),
  };
  return updated;
}

async function deleteNote(note) {
  await databases.deleteDocument(DATABASE_ID, NOTES_COLLECTION_ID, note.$id);
  const list = notesByTopic.value[note.topicId] || [];
  notesByTopic.value = {
    ...notesByTopic.value,
    [note.topicId]: list.filter((n) => n.$id !== note.$id),
  };
  useTopics().adjustNoteCount(note.topicId, -1);
}

export function useNotes() {
  return { notesByTopic, loading, error, fetchNotesForTopic, createNote, updateNote, deleteNote };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/my-zone/composables/useNotes.js
git commit -m "feat(my-zone): useNotes composable"
```

---

## Task 13: `TopicSidebar.vue` — notes section

**Files:**
- Modify: `src/my-zone/TopicSidebar.vue`

Add a second section below topics: notes belonging to the selected topic. The sidebar now also emits `select-note`.

- [ ] **Step 1: Replace `src/my-zone/TopicSidebar.vue` with this expanded version**

```vue
<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useTopics } from './composables/useTopics.js';
import { useNotes } from './composables/useNotes.js';

const props = defineProps({
  selectedTopicId: { type: String, default: null },
  selectedNoteId: { type: String, default: null },
});
const emit = defineEmits(['select-topic', 'select-note']);

const { topics, ensureLoaded, createTopic, deleteTopic } = useTopics();
const { notesByTopic, fetchNotesForTopic, createNote, deleteNote } = useNotes();

const newName = ref('');
const adding = ref(false);
const addingNote = ref(false);

onMounted(ensureLoaded);

watch(
  () => props.selectedTopicId,
  (id) => {
    if (id && !notesByTopic.value[id]) fetchNotesForTopic(id);
  },
  { immediate: true }
);

const notes = computed(() =>
  props.selectedTopicId ? notesByTopic.value[props.selectedTopicId] || [] : []
);

const selectedTopic = computed(() =>
  topics.value.find((t) => t.$id === props.selectedTopicId) || null
);

async function onAddTopic() {
  const name = newName.value.trim();
  if (!name) return;
  adding.value = true;
  try {
    const topic = await createTopic(name);
    newName.value = '';
    emit('select-topic', topic.$id);
  } finally {
    adding.value = false;
  }
}

async function onDeleteTopic(topic) {
  const ok = window.confirm(
    topic.noteCount > 0
      ? `Delete topic "${topic.name}" and lose access to its ${topic.noteCount} note(s)?`
      : `Delete topic "${topic.name}"?`
  );
  if (!ok) return;
  await deleteTopic(topic.$id);
  if (props.selectedTopicId === topic.$id) emit('select-topic', null);
}

async function onAddNote() {
  if (!props.selectedTopicId) return;
  addingNote.value = true;
  try {
    const note = await createNote(props.selectedTopicId);
    emit('select-note', note.$id);
  } finally {
    addingNote.value = false;
  }
}

async function onDeleteNote(note) {
  const ok = window.confirm(`Delete note "${note.title || 'Untitled'}"?`);
  if (!ok) return;
  await deleteNote(note);
  if (props.selectedNoteId === note.$id) emit('select-note', null);
}
</script>

<template>
  <aside class="sidebar">
    <section class="sidebar__section">
      <header class="sidebar__header"><span>topics</span></header>
      <ul class="sidebar__list">
        <li
          v-for="topic in topics"
          :key="topic.$id"
          class="sidebar__item"
          :class="{ 'sidebar__item--active': topic.$id === selectedTopicId }"
        >
          <button class="sidebar__select" @click="emit('select-topic', topic.$id)">
            <span>{{ topic.name }}</span>
            <span class="sidebar__count">{{ topic.noteCount || 0 }}</span>
          </button>
          <button class="sidebar__delete" title="delete topic" @click="onDeleteTopic(topic)">×</button>
        </li>
        <li v-if="topics.length === 0" class="sidebar__empty">no topics yet</li>
      </ul>
      <form class="sidebar__add" @submit.prevent="onAddTopic">
        <input v-model="newName" placeholder="+ new topic" :disabled="adding" />
      </form>
    </section>

    <section v-if="selectedTopic" class="sidebar__section">
      <header class="sidebar__header">
        <span>notes in {{ selectedTopic.name }}</span>
      </header>
      <ul class="sidebar__list">
        <li
          v-for="note in notes"
          :key="note.$id"
          class="sidebar__item"
          :class="{ 'sidebar__item--active': note.$id === selectedNoteId }"
        >
          <button class="sidebar__select" @click="emit('select-note', note.$id)">
            <span class="sidebar__note-title">{{ note.title || 'Untitled' }}</span>
          </button>
          <button class="sidebar__delete" title="delete note" @click="onDeleteNote(note)">×</button>
        </li>
        <li v-if="notes.length === 0" class="sidebar__empty">no notes yet</li>
      </ul>
      <button class="sidebar__add-note" :disabled="addingNote" @click="onAddNote">+ new note</button>
    </section>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  border-right: 1px solid var(--border, #222);
  background: var(--bg-elev, #111);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar__section {
  padding: 16px 12px;
  border-bottom: 1px solid var(--border, #222);
}

.sidebar__header {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim, #999);
  padding: 0 8px 8px;
}

.sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sidebar__item {
  display: flex;
  align-items: stretch;
}

.sidebar__item--active .sidebar__select {
  background: var(--bg, #0a0a0a);
  color: var(--text, #e6e6e6);
}

.sidebar__select {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  background: transparent;
  color: var(--text-dim, #999);
  border: none;
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.sidebar__select:hover {
  color: var(--text, #e6e6e6);
}

.sidebar__note-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar__count {
  font-size: 11px;
  opacity: 0.6;
}

.sidebar__delete {
  background: transparent;
  border: none;
  color: var(--text-dim, #999);
  cursor: pointer;
  padding: 0 8px;
  opacity: 0;
  transition: opacity 0.1s;
}

.sidebar__item:hover .sidebar__delete {
  opacity: 1;
}

.sidebar__delete:hover {
  color: #f66;
}

.sidebar__empty {
  padding: 8px;
  font-size: 12px;
  color: var(--text-dim, #999);
  font-style: italic;
}

.sidebar__add input,
.sidebar__add-note {
  width: 100%;
  margin-top: 8px;
  padding: 6px 8px;
  background: var(--bg, #0a0a0a);
  color: var(--text, #e6e6e6);
  border: 1px solid var(--border, #222);
  font-family: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.sidebar__add input:focus,
.sidebar__add-note:focus {
  outline: 1px solid var(--accent, #6cf);
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/my-zone/TopicSidebar.vue
git commit -m "feat(my-zone): TopicSidebar notes section"
```

---

## Task 14: Install TipTap + base `NoteEditor.vue`

**Files:**
- Modify: `package.json` (via `npm install`)
- Create: `src/my-zone/NoteEditor.vue`

The base editor: title input + TipTap, emits a `change` event with html/json. No toolbar, no autosave yet.

- [ ] **Step 1: Install TipTap packages**

Run:
```
npm install @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-placeholder @tiptap/extension-underline
```
Expected: command completes; all six packages appear in `package.json` dependencies.

- [ ] **Step 2: Create `src/my-zone/NoteEditor.vue`**

```vue
<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';

const props = defineProps({
  note: { type: Object, required: true },
});
const emit = defineEmits(['change']);

const title = ref(props.note.title || '');

function parseContent(raw) {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener' } }),
    Image,
    Placeholder.configure({ placeholder: 'start writing…' }),
  ],
  content: parseContent(props.note.contentJson),
  onUpdate({ editor }) {
    emit('change', {
      title: title.value,
      contentHtml: editor.getHTML(),
      contentJson: JSON.stringify(editor.getJSON()),
      excerpt: editor.getText().slice(0, 300),
    });
  },
});

watch(
  () => props.note.$id,
  () => {
    title.value = props.note.title || '';
    editor.value?.commands.setContent(parseContent(props.note.contentJson) || '', false);
  }
);

function onTitleInput() {
  if (!editor.value) return;
  emit('change', {
    title: title.value,
    contentHtml: editor.value.getHTML(),
    contentJson: JSON.stringify(editor.value.getJSON()),
    excerpt: editor.value.getText().slice(0, 300),
  });
}

onBeforeUnmount(() => editor.value?.destroy());
</script>

<template>
  <div class="editor">
    <input
      v-model="title"
      class="editor__title"
      placeholder="Untitled"
      @input="onTitleInput"
    />
    <EditorContent v-if="editor" :editor="editor" class="editor__content" />
  </div>
</template>

<style scoped>
.editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 32px;
  overflow-y: auto;
}

.editor__title {
  background: transparent;
  border: none;
  color: var(--text, #e6e6e6);
  font-family: inherit;
  font-size: 24px;
  padding: 8px 0;
  margin-bottom: 16px;
}

.editor__title:focus {
  outline: none;
}

.editor__content {
  flex: 1;
  color: var(--text, #e6e6e6);
  font-size: 15px;
  line-height: 1.7;
}
</style>

<style>
/* unscoped — TipTap renders content outside scoped styles */
.editor__content .ProseMirror {
  outline: none;
  min-height: 200px;
}

.editor__content .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--text-dim, #666);
  pointer-events: none;
  height: 0;
}

.editor__content h1 { font-size: 22px; margin: 16px 0 8px; }
.editor__content h2 { font-size: 18px; margin: 14px 0 6px; }
.editor__content h3 { font-size: 16px; margin: 12px 0 6px; }
.editor__content ul, .editor__content ol { padding-left: 24px; }
.editor__content code {
  background: var(--bg-elev, #111);
  padding: 1px 6px;
  font-size: 13px;
  border-radius: 2px;
}
.editor__content pre {
  background: var(--bg-elev, #111);
  padding: 12px;
  overflow-x: auto;
  font-size: 13px;
  border-radius: 2px;
}
.editor__content pre code { background: transparent; padding: 0; }
.editor__content a { color: var(--accent, #6cf); text-decoration: underline; }
.editor__content img { max-width: 100%; height: auto; }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json src/my-zone/NoteEditor.vue
git commit -m "feat(my-zone): TipTap NoteEditor base"
```

---

## Task 15: NoteEditor toolbar

**Files:**
- Modify: `src/my-zone/NoteEditor.vue`

Add a toolbar above the content area. Buttons toggle TipTap marks/nodes.

- [ ] **Step 1: Modify `src/my-zone/NoteEditor.vue`**

Inside the `<template>`, between the title input and `<EditorContent>`, add:

```vue
    <div v-if="editor" class="editor__toolbar">
      <button type="button" :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()"><b>B</b></button>
      <button type="button" :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()"><i>I</i></button>
      <button type="button" :class="{ active: editor.isActive('underline') }" @click="editor.chain().focus().toggleUnderline().run()"><u>U</u></button>
      <span class="editor__sep"></span>
      <button type="button" :class="{ active: editor.isActive('heading', { level: 1 }) }" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()">H1</button>
      <button type="button" :class="{ active: editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
      <button type="button" :class="{ active: editor.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">H3</button>
      <span class="editor__sep"></span>
      <button type="button" :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()">•</button>
      <button type="button" :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()">1.</button>
      <button type="button" :class="{ active: editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()">"</button>
      <span class="editor__sep"></span>
      <button type="button" :class="{ active: editor.isActive('code') }" @click="editor.chain().focus().toggleCode().run()">`</button>
      <button type="button" :class="{ active: editor.isActive('codeBlock') }" @click="editor.chain().focus().toggleCodeBlock().run()">{ }</button>
      <span class="editor__sep"></span>
      <button type="button" @click="onLinkClick">🔗</button>
    </div>
```

In the `<script setup>` block, add the `onLinkClick` handler near the bottom (before `onBeforeUnmount`):

```js
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
```

In the scoped `<style>` block, append:

```css
.editor__toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border, #222);
}

.editor__toolbar button {
  background: transparent;
  color: var(--text-dim, #999);
  border: 1px solid transparent;
  padding: 4px 8px;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  min-width: 28px;
}

.editor__toolbar button:hover {
  color: var(--text, #e6e6e6);
  border-color: var(--border, #222);
}

.editor__toolbar button.active {
  color: var(--accent, #6cf);
  border-color: var(--accent, #6cf);
}

.editor__sep {
  width: 1px;
  height: 16px;
  background: var(--border, #222);
  margin: 0 4px;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/my-zone/NoteEditor.vue
git commit -m "feat(my-zone): NoteEditor toolbar"
```

---

## Task 16: Autosave with debounce + save status

**Files:**
- Modify: `src/my-zone/NoteEditor.vue`

The editor swallows `change` events and runs its own autosave (1s debounce), calling `useNotes().updateNote()`. A save-status indicator shows the current state.

- [ ] **Step 1: Modify the `<script setup>` block in `src/my-zone/NoteEditor.vue`**

Replace the existing `defineEmits` line and remove all `emit('change', …)` calls. Replace with internal autosave wiring.

The new `<script setup>` block should look like this (showing the whole file for clarity):

```vue
<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useNotes } from './composables/useNotes.js';

const props = defineProps({
  note: { type: Object, required: true },
});

const { updateNote } = useNotes();

const title = ref(props.note.title || '');
const status = ref({ state: 'idle', at: null, message: '' }); // idle | editing | saving | saved | error

let debounceHandle = null;
let inFlight = false;
let pendingPayload = null;
let lastSavedAt = null;

function parseContent(raw) {
  if (!raw) return undefined;
  try { return JSON.parse(raw); } catch { return undefined; }
}

const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener' } }),
    Image,
    Placeholder.configure({ placeholder: 'start writing…' }),
  ],
  content: parseContent(props.note.contentJson),
  onUpdate: scheduleSave,
});

watch(
  () => props.note.$id,
  () => {
    title.value = props.note.title || '';
    editor.value?.commands.setContent(parseContent(props.note.contentJson) || '', false);
    status.value = { state: 'idle', at: null, message: '' };
    if (debounceHandle) { clearTimeout(debounceHandle); debounceHandle = null; }
    pendingPayload = null;
  }
);

function snapshot() {
  if (!editor.value) return null;
  return {
    title: title.value,
    contentHtml: editor.value.getHTML(),
    contentJson: JSON.stringify(editor.value.getJSON()),
    excerpt: editor.value.getText().slice(0, 300),
  };
}

function scheduleSave() {
  status.value = { state: 'editing', at: Date.now(), message: '' };
  if (debounceHandle) clearTimeout(debounceHandle);
  debounceHandle = setTimeout(flush, 1000);
}

async function flush() {
  if (!editor.value) return;
  const payload = snapshot();
  if (!payload) return;

  if (inFlight) {
    pendingPayload = payload;
    return;
  }
  inFlight = true;
  status.value = { state: 'saving', at: Date.now(), message: '' };
  try {
    await updateNote(props.note.$id, payload);
    lastSavedAt = Date.now();
    status.value = { state: 'saved', at: lastSavedAt, message: '' };
  } catch (err) {
    status.value = { state: 'error', at: Date.now(), message: err?.message || 'save failed' };
  } finally {
    inFlight = false;
    if (pendingPayload) {
      pendingPayload = null;
      scheduleSave();
    }
  }
}

function retry() {
  flush();
}

function onTitleInput() {
  scheduleSave();
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

function statusText() {
  switch (status.value.state) {
    case 'idle': return '';
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

onBeforeUnmount(() => {
  if (debounceHandle) clearTimeout(debounceHandle);
  editor.value?.destroy();
});
</script>
```

- [ ] **Step 2: Update the `<template>` to add the status footer and retry button**

Replace the template with:

```vue
<template>
  <div class="editor">
    <input
      v-model="title"
      class="editor__title"
      placeholder="Untitled"
      @input="onTitleInput"
    />
    <div v-if="editor" class="editor__toolbar">
      <button type="button" :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()"><b>B</b></button>
      <button type="button" :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()"><i>I</i></button>
      <button type="button" :class="{ active: editor.isActive('underline') }" @click="editor.chain().focus().toggleUnderline().run()"><u>U</u></button>
      <span class="editor__sep"></span>
      <button type="button" :class="{ active: editor.isActive('heading', { level: 1 }) }" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()">H1</button>
      <button type="button" :class="{ active: editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
      <button type="button" :class="{ active: editor.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">H3</button>
      <span class="editor__sep"></span>
      <button type="button" :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()">•</button>
      <button type="button" :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()">1.</button>
      <button type="button" :class="{ active: editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()">"</button>
      <span class="editor__sep"></span>
      <button type="button" :class="{ active: editor.isActive('code') }" @click="editor.chain().focus().toggleCode().run()">`</button>
      <button type="button" :class="{ active: editor.isActive('codeBlock') }" @click="editor.chain().focus().toggleCodeBlock().run()">{ }</button>
      <span class="editor__sep"></span>
      <button type="button" @click="onLinkClick">🔗</button>
    </div>
    <EditorContent v-if="editor" :editor="editor" class="editor__content" />
    <footer class="editor__status">
      <span :class="['editor__status-text', `editor__status-text--${status.state}`]">{{ statusText() }}</span>
      <button v-if="status.state === 'error'" class="editor__retry" type="button" @click="retry">retry</button>
    </footer>
  </div>
</template>
```

- [ ] **Step 3: Append status styles to the scoped `<style>` block**

```css
.editor__status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0 0;
  font-size: 11px;
  color: var(--text-dim, #999);
}

.editor__status-text--error {
  color: #f66;
}

.editor__retry {
  background: transparent;
  color: var(--text-dim, #999);
  border: 1px solid var(--border, #222);
  padding: 2px 8px;
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/my-zone/NoteEditor.vue
git commit -m "feat(my-zone): NoteEditor autosave + status indicator"
```

---

## Task 17: `NotesShell.vue` — compose sidebar + editor

**Files:**
- Create: `src/my-zone/NotesShell.vue`

Owns selection state, renders sidebar and editor pane side-by-side.

- [ ] **Step 1: Create `src/my-zone/NotesShell.vue`**

```vue
<script setup>
import { computed, ref } from 'vue';
import TopicSidebar from './TopicSidebar.vue';
import NoteEditor from './NoteEditor.vue';
import { useNotes } from './composables/useNotes.js';

const selectedTopicId = ref(null);
const selectedNoteId = ref(null);

const { notesByTopic } = useNotes();

const selectedNote = computed(() => {
  if (!selectedTopicId.value || !selectedNoteId.value) return null;
  const list = notesByTopic.value[selectedTopicId.value] || [];
  return list.find((n) => n.$id === selectedNoteId.value) || null;
});

function onSelectTopic(id) {
  selectedTopicId.value = id;
  selectedNoteId.value = null;
}

function onSelectNote(id) {
  selectedNoteId.value = id;
}
</script>

<template>
  <div class="shell">
    <TopicSidebar
      :selected-topic-id="selectedTopicId"
      :selected-note-id="selectedNoteId"
      @select-topic="onSelectTopic"
      @select-note="onSelectNote"
    />
    <section class="shell__main">
      <NoteEditor v-if="selectedNote" :key="selectedNote.$id" :note="selectedNote" />
      <div v-else class="shell__placeholder">
        <p v-if="!selectedTopicId">select a topic from the sidebar</p>
        <p v-else>select a note or create one</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.shell {
  flex: 1;
  display: flex;
  min-height: 0;
}

.shell__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg, #0a0a0a);
  min-width: 0;
}

.shell__placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim, #999);
  font-size: 13px;
}
</style>
```

- [ ] **Step 2: Wire `NotesShell` into `MyZoneApp.vue`**

Replace `src/my-zone/MyZoneApp.vue`:

```vue
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
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`
Open `http://localhost:5173/my-zone`, log in. Expected flow:
1. Sidebar appears on the left, empty `select a topic from the sidebar` on the right.
2. Type a topic name in the `+ new topic` input → Enter. Topic appears in the list and is auto-selected.
3. Right pane shows `select a note or create one`. A second `notes in …` section appears in the sidebar with `+ new note` button.
4. Click `+ new note`. A note `Untitled` appears in the list and is selected; the editor opens on the right with title `Untitled` and an empty body.
5. Type in title — note in sidebar updates within ~1s. Editor status footer shows `editing…` then `saving…` then `saved · 1s ago`.
6. Type in body — same status flow.
7. Reload the page — your topic, note, title, and body all persist.
8. Create a second note in the same topic and switch between them — the editor swaps content correctly.
9. Delete a note (hover, click `×`, confirm). Note disappears, editor returns to placeholder.
10. Delete the topic. Sidebar empties, editor returns to placeholder.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/my-zone/NotesShell.vue src/my-zone/MyZoneApp.vue
git commit -m "feat(my-zone): NotesShell + wire into MyZoneApp"
```

---

## Task 18: Image upload via Appwrite Storage

**Files:**
- Create: `src/my-zone/services/images.js`
- Modify: `src/my-zone/NoteEditor.vue`

Add an "image" toolbar button + handle paste of image data. Upload to Appwrite Storage, insert the returned URL into the editor.

- [ ] **Step 1: Create `src/my-zone/services/images.js`**

```js
import { storage, IMAGES_BUCKET_ID, ID } from './appwrite.js';

export async function uploadImage(file) {
  const created = await storage.createFile(IMAGES_BUCKET_ID, ID.unique(), file);
  return storage.getFileView(IMAGES_BUCKET_ID, created.$id).toString();
}
```

- [ ] **Step 2: Modify `src/my-zone/NoteEditor.vue` — add upload handling**

In the `<script setup>` block, add this import at the top (with the other imports):

```js
import { uploadImage } from './services/images.js';
```

Add a hidden file-input ref and handlers near the other helpers (above `onBeforeUnmount`):

```js
const fileInput = ref(null);

function onImageClick() {
  fileInput.value?.click();
}

async function onFilePicked(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  await insertImageFromFile(file);
}

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
      if (file) {
        event.preventDefault();
        insertImageFromFile(file);
        return;
      }
    }
  }
}
```

In the editor config, add a `editorProps` block so paste events route through us:

Replace the `useEditor({ ... })` call with:

```js
const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener' } }),
    Image,
    Placeholder.configure({ placeholder: 'start writing…' }),
  ],
  content: parseContent(props.note.contentJson),
  onUpdate: scheduleSave,
  editorProps: {
    handlePaste(view, event) {
      onPaste(event);
      return false;
    },
  },
});
```

- [ ] **Step 3: Modify the `<template>` to add the image button + hidden input**

In the toolbar block, after the link button, add:

```vue
      <button type="button" @click="onImageClick">🖼</button>
      <input ref="fileInput" type="file" accept="image/*" class="editor__file" @change="onFilePicked" />
```

In the scoped `<style>`, append:

```css
.editor__file {
  display: none;
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`
Open `/my-zone`, log in, open a note. Click the 🖼 toolbar button, pick an image file. Expected: image uploads and appears at the cursor. Reload — image is still there (because the URL points to Appwrite Storage). Try pasting an image from the clipboard — same result.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/my-zone/services/images.js src/my-zone/NoteEditor.vue
git commit -m "feat(my-zone): image upload via Appwrite Storage"
```

---

## Task 19: Session expiry recovery + concurrent-edit warning

**Files:**
- Modify: `src/my-zone/composables/useAuth.js`
- Modify: `src/my-zone/composables/useNotes.js`
- Modify: `src/my-zone/NoteEditor.vue`

Two small reliability behaviors per spec:
1. If Appwrite returns 401, stash the unsaved note content to `sessionStorage` and force re-login. On re-login, offer to restore.
2. On save, if the server's `updatedAt` is newer than what we last loaded, show a non-blocking banner.

- [ ] **Step 1: Add an `onAuthError` hook in `useAuth.js`**

Append to `src/my-zone/composables/useAuth.js` (before the `export function useAuth`):

```js
const authErrorListeners = new Set();

export function onAuthError(fn) {
  authErrorListeners.add(fn);
  return () => authErrorListeners.delete(fn);
}

export function notifyAuthError() {
  currentUser.value = null;
  for (const fn of authErrorListeners) fn();
}
```

- [ ] **Step 2: Intercept 401s in `useNotes.js` updateNote**

In `src/my-zone/composables/useNotes.js`, change the import line to also pull `notifyAuthError`:

```js
import { ref } from 'vue';
import { databases, DATABASE_ID, NOTES_COLLECTION_ID, ID, Query } from '../services/appwrite.js';
import { useTopics } from './useTopics.js';
import { notifyAuthError } from './useAuth.js';
```

Wrap `updateNote` in a try/catch that re-throws but signals on 401:

```js
async function updateNote(id, patch) {
  const now = new Date().toISOString();
  try {
    const updated = await databases.updateDocument(DATABASE_ID, NOTES_COLLECTION_ID, id, {
      ...patch,
      updatedAt: now,
    });
    const topicId = updated.topicId;
    const list = notesByTopic.value[topicId] || [];
    notesByTopic.value = {
      ...notesByTopic.value,
      [topicId]: list.map((n) => (n.$id === id ? updated : n)),
    };
    return updated;
  } catch (err) {
    if (err?.code === 401) notifyAuthError();
    throw err;
  }
}
```

- [ ] **Step 3: Stash unsaved content on auth error in `NoteEditor.vue`**

In `<script setup>` of `src/my-zone/NoteEditor.vue`, add at the top with other imports:

```js
import { onAuthError } from './composables/useAuth.js';
```

Add inside `<script setup>`, near the bottom (before `onBeforeUnmount`):

```js
const offAuthError = onAuthError(() => {
  const payload = snapshot();
  if (payload) {
    try {
      sessionStorage.setItem(
        `my-zone:unsaved:${props.note.$id}`,
        JSON.stringify({ ...payload, savedAt: Date.now() })
      );
    } catch {}
  }
});
```

In `onBeforeUnmount`, also call `offAuthError()`:

```js
onBeforeUnmount(() => {
  if (debounceHandle) clearTimeout(debounceHandle);
  offAuthError();
  editor.value?.destroy();
});
```

On note open, restore stashed content if present. Modify the `watch` block:

```js
watch(
  () => props.note.$id,
  (newId) => {
    title.value = props.note.title || '';
    editor.value?.commands.setContent(parseContent(props.note.contentJson) || '', false);
    status.value = { state: 'idle', at: null, message: '' };
    if (debounceHandle) { clearTimeout(debounceHandle); debounceHandle = null; }
    pendingPayload = null;

    const stashKey = `my-zone:unsaved:${newId}`;
    try {
      const raw = sessionStorage.getItem(stashKey);
      if (raw) {
        const stash = JSON.parse(raw);
        const ok = window.confirm('unsaved changes from a previous session — restore?');
        if (ok) {
          title.value = stash.title || '';
          editor.value?.commands.setContent(parseContent(stash.contentJson) || '', false);
          scheduleSave();
        }
        sessionStorage.removeItem(stashKey);
      }
    } catch {}
  }
);
```

- [ ] **Step 4: Concurrent-edit detection — deferred**

The spec mentions a non-blocking warning when the server's `updatedAt` is newer than our last-loaded copy. Implementing this honestly needs either an optimistic-version attribute or a fetch-before-save round-trip, neither of which fits v1 scope. The current behavior (last-write-wins) is acceptable for single-user usage where two-tab editing is rare. **No code change in this step.** Track as a v2 follow-up.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`
Open `/my-zone`, log in, open a note. In a separate browser window, log into the Appwrite Cloud console → Auth → Sessions, delete your active session. Back in the app, edit the note. Expected: the autosave fails with `save failed — ...`. Within ~1s the page should reflect logged-out state (login form returns). Log back in — open the same note — you're prompted to restore unsaved changes.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/my-zone/composables/useAuth.js src/my-zone/composables/useNotes.js src/my-zone/NoteEditor.vue
git commit -m "feat(my-zone): session-expiry recovery via sessionStorage stash"
```

---

## Task 20: Verify portfolio still untouched + final manual smoke test

**Files:** none

- [ ] **Step 1: Confirm portfolio path is unaffected**

Run: `npm run dev`
Open `http://localhost:5173/`. Expected: existing portfolio renders identically. Open browser devtools → Network tab → reload. Confirm no requests for `MyZoneApp.vue`, `appwrite.js`, or any TipTap chunk on the `/` route. Stop the dev server.

- [ ] **Step 2: Full /my-zone smoke test**

Run: `npm run dev`
At `http://localhost:5173/my-zone`, exercise the complete happy path:
1. Log in.
2. Create 2 topics: `Go`, `System Design`.
3. Create 3 notes in `Go`, each with a title, body using H1/H2, a bulleted list, a code block, a link, and one image.
4. Switch between notes — editor swaps content correctly.
5. Reload the page — sign in again — everything is preserved.
6. Rename a note title — sidebar updates.
7. Delete a note — note disappears, topic noteCount decrements.
8. Delete a topic with notes — confirmation appears, deleting removes from sidebar.
9. Log out, log back in — state intact.

Stop the dev server.

- [ ] **Step 3: Production build sanity check**

Run: `npm run build`
Expected: build completes without errors. Check `dist/` exists. Check `dist/404.html` exists (Vite copies from `public/`).

Run: `npm run preview`
Open `http://localhost:4173/` — portfolio renders. Open `http://localhost:4173/my-zone` — may 404 in preview (Vite preview doesn't do the SPA fallback). Visit `http://localhost:4173/anything-bogus` — 404.html runs and bounces you to `/`. This proves the fallback script works; on the deployed GH Pages site it will bounce `/my-zone` to `/` and `main.js` will restore the path. Stop the preview.

- [ ] **Step 4: Commit any leftover changes (likely none)**

```bash
git status
```
If clean, no commit needed.

---

## Task 21: Deploy

**Files:** none (relies on the existing `.github/workflows/deploy.yml`)

- [ ] **Step 1: Merge `feat/note-taker` into `main`**

```bash
git checkout main
git merge --no-ff feat/note-taker -m "feat: /my-zone private notetaker"
git push origin main
```

- [ ] **Step 2: Watch the Pages deploy**

In GitHub, Actions tab → "Deploy to GitHub Pages" workflow → wait for green. The workflow runs `npm test` (existing tests, unaffected) → `npm run build` → uploads → deploys.

- [ ] **Step 3: Live verification**

Open `https://khademulbari.com/` — portfolio renders, no changes for visitors.
Open `https://khademulbari.com/my-zone` — briefly shows the redirect, lands on `/my-zone` with the login form. Log in. Create a topic, note, and image — confirm persistence across reloads.

---

## Self-Review Notes

Coverage of spec sections:

| Spec section                    | Covered by task(s)         |
| ------------------------------- | -------------------------- |
| Architecture: routing           | 3, 4, 5                    |
| Auth: email/password, no signup | 1 (steps 3, 4), 7, 8, 9    |
| Data: topics collection         | 1 (step 6), 10, 11, 13     |
| Data: notes collection          | 1 (step 7), 12, 13         |
| Data: storage bucket            | 1 (step 8), 18             |
| Data: permissions               | 1 (steps 6, 7, 8)          |
| UI: two-pane layout             | 11, 13, 17                 |
| Editor: TipTap config           | 14                         |
| Editor: toolbar                 | 15                         |
| Editor: autosave + status       | 16                         |
| Editor: image insertion         | 18                         |
| Error: login                    | 8                          |
| Error: autosave network         | 16 (retry button)          |
| Error: image upload             | 18 (alert)                 |
| Error: session expiry           | 19                         |
| Edge: delete in-view topic/note | 11, 13                     |
| Edge: concurrent edits          | Deferred to v2 (Task 19)   |
| Out-of-band setup               | 1, 2                       |
| Dependencies                    | 6, 14                      |
| Deploy                          | 21                         |

Concurrent-edit detection is acknowledged as deferred. Everything else in the spec maps to a concrete task.

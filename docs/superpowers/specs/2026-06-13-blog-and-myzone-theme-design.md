# Blog + my-zone Theme Toggle — Design

Date: 2026-06-13
Status: Approved

## Goal

Add a blog system: author and manage posts inside `/my-zone`, publish them to the
public BR2049 portfolio at `/blog` and `/blog/<slug>`. Add a dark/light theme
toggle scoped to `/my-zone`.

## Decisions (locked)

- Public reading surface: public site `/blog` + `/blog/<slug>`; authoring/management
  in `/my-zone`.
- Storage: a NEW Appwrite `POSTS` collection, separate from notes.
- Post fields: title + body only, with auto slug and auto excerpt. No cover image,
  no tags, no manual publish date.
- my-zone UI: blog appears as a pinned "blog" entry in the topic sidebar; selecting
  it switches the main pane to blog management (backed by the POSTS collection).
- Publish workflow: draft ↔ published toggle; `publishedAt` set on first publish;
  public read permission flipped on publish/unpublish.
- Theme toggle: my-zone only, dark/light, persisted to localStorage, default dark.
  Public site stays BR2049 dark always.
- Editor reuse: extract the TipTap + autosave engine into a shared composable used
  by both the note editor and the post editor.

## 1. Data model — POSTS collection

New Appwrite collection `POSTS` with **document-level security enabled**.

Attributes:

| Attribute | Type | Notes |
|-----------|------|-------|
| `title` | string (size 256) | required, default `Untitled` |
| `slug` | string (size 128) | derived from title |
| `contentHtml` | string (large) | rendered HTML for public display |
| `contentJson` | string (large) | TipTap JSON for editing |
| `excerpt` | string (size 512) | first ~300 chars of text |
| `status` | enum `draft`/`published` | default `draft` |
| `publishedAt` | datetime | nullable; set on first publish |

Indexes:
- `slug` — key index (lookup by slug on public post page)
- `status` — key index (filter published)
- `publishedAt` — key index (order published list)

Environment:
- Add `VITE_APPWRITE_POSTS_COLLECTION_ID` to `.env.example` and to
  `src/my-zone/services/appwrite.js` exports.
- Export `Permission`, `Role` (already exported) for permission edits.

**Manual Appwrite console setup (performed by the user, documented in the plan):**
create the `POSTS` collection with the attributes and indexes above, enable
document security, and set the new collection id in `.env` / Actions secrets.

## 2. Publish workflow and permissions

- A draft is owner-only (default document permissions on create).
- **Publish** (`usePosts.publish`):
  - set `status = 'published'`
  - if `publishedAt` is empty, set `publishedAt = new Date().toISOString()`
  - set document permissions to include `Permission.read(Role.any())` (in addition
    to the owner's existing write permissions).
- **Unpublish** (`usePosts.unpublish`):
  - set `status = 'draft'`
  - remove `Permission.read(Role.any())` so the public can no longer read it.
- Public visitors (no Appwrite session) can read a document only when it carries
  `Role.any()` read — i.e. only published posts.
- `slug` is derived from the title via the existing `toSlug` helper (extracted to a
  shared module so both topics and posts use it). `excerpt` is the first ~300 chars
  of the editor's plain text, matching the note snapshot logic.

## 3. Authoring in /my-zone

UI structure:
- `TopicSidebar` renders a pinned **"▸ blog"** item above the topic list. It emits a
  `select-blog` event and shows a selected state distinct from topics.
- `NotesShell` tracks a `blogMode` boolean. When blog is selected, the main pane
  renders a new `BlogShell` instead of the note editor/placeholder. Selecting any
  topic exits blog mode.
- `BlogShell.vue`: a post list (title, status badge, publish/unpublish button,
  delete) plus a "+ new post" action and the post editor for the selected post.

Composables:
- `composables/usePosts.js` — mirrors `useNotes`: reactive `posts` list, `loading`,
  `error`, and `fetchPosts`, `createPost`, `updatePost`, `deletePost`, `publish`,
  `unpublish`.

Editor reuse:
- Extract the TipTap configuration (extensions, image paste/upload, debounced
  autosave state machine) into `composables/useDocAutosave.js`. It accepts the
  initial document and a `save(patch)` callback and returns `{ editor, title,
  status, statusText, retry, onTitleInput, snapshot }`.
- Refactor `NoteEditor.vue` to consume `useDocAutosave` with `updateNote`. The
  existing note tests guard this refactor.
- New `PostEditor.vue` consumes `useDocAutosave` with `updatePost`.

## 4. Public blog (BR2049 site)

Routing (add to `src/router/index.js`):
- `/blog` → `BlogListPage.vue` — lists published posts, `Query.equal('status',
  'published')` + `Query.orderDesc('publishedAt')`.
- `/blog/:slug` → `BlogPostPage.vue` — looks up a single published post by
  `Query.equal('slug', slug)` + `Query.equal('status', 'published')`, limit 1;
  shows a not-found state if none.

Pages:
- Both reuse the `ReturnLink` and BR2049 theme. The list shows title, date, excerpt,
  each linking to its post. The post page renders the stored `contentHtml`
  (sanitised at author time by TipTap; rendered via `v-html` into a styled
  `.post-body`).
- Public reads use the existing Appwrite client (no session). Appwrite is pulled
  into the public bundle only on the `/blog` routes (lazy route components).

Terminal:
- Add `blog/` to the `ls sections/` links in `TerminalHome`.
- Add `blog` to `SECTIONS` handling so `blog`, `cd blog`, `open blog` route to
  `/blog`. (Sections list for routing gains `blog`; the five portfolio section
  pages are unchanged.)

## 5. Theme toggle (my-zone only)

- `composables/useTheme.js`: reactive `theme` (`'dark'` | `'light'`), default
  `'dark'`, persisted to `localStorage` key `my-zone:theme`. A `toggle()` flips it.
  On change (and on init) it sets `data-theme` on the `.my-zone` root element.
- `MyZoneApp.vue`: bind `:data-theme="theme"` on the root and add a toggle button in
  the header.
- `styles/my-zone.css`: define light-palette overrides under
  `.my-zone[data-theme="light"]` for `--bg`, `--bg-elev`, `--text`, `--text-dim`,
  `--border`, `--accent`. Dark stays the default.
- The public site is untouched — it does not read this preference.

## 6. Testing

Vitest + @vue/test-utils.

- `usePosts` (mock `databases` + `Permission`/`Role`): `createPost` defaults to
  draft; `publish` sets `status`, sets `publishedAt` when empty and preserves it
  when already set, and includes `Role.any()` read in the permissions array;
  `unpublish` removes the public read and sets `status` to draft.
- Shared helpers: `toSlug` (pure) and excerpt derivation.
- `useTheme`: defaults to dark; `toggle` flips and writes localStorage; init reads a
  stored value.
- `useDocAutosave`: a body change schedules a debounced save that calls the provided
  `save` callback with the snapshot patch; existing `NoteEditor` behaviour stays
  green after the refactor.
- Public pages: `BlogListPage` renders one entry per published post (mocked query);
  `BlogPostPage` renders the post body for a found slug and a not-found state
  otherwise. `TerminalHome` exposes a `blog/` link and `parseCommand('blog')`
  navigates to `/blog`.

## 7. Out of scope

- Tags, cover images, manual publish dates, scheduled publishing.
- Comments / reactions.
- Public-site light mode (toggle is my-zone only).
- Markdown import/export.

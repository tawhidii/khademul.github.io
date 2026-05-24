# /my-zone Notetaker — Design

**Date:** 2026-05-24
**Status:** Approved
**Owner:** Khondoker Khademul Bari

## Summary

Add a private, single-user notetaker to the existing Vue 3 portfolio site at a hidden path `/my-zone`. Notes are organized by topic, edited in a TipTap WYSIWYG editor with image support, and persisted in Appwrite Cloud. The public portfolio at `/` is unchanged and contains no link or hint about the notetaker.

## Goals

- Single owner (Khondoker) can write and read notes organized by topic on their own site.
- Rich editing experience (headings, lists, code blocks, links, embedded images).
- Notes persist across devices via Appwrite Cloud.
- Zero visible surface to portfolio visitors.

## Non-goals (v1)

- Multi-user accounts or sharing.
- Public reading of notes.
- Search across notes.
- Tags or hierarchical topics.
- Pinning, archiving, soft delete, trash.
- Markdown import/export.
- Mobile-polished layout (desktop-first; mobile works but is not tuned).
- Signup UI — the single account is created out-of-band via the Appwrite console.

## Architectural Decisions

### Routing — real path `/my-zone`, no Vue Router

The portfolio at `/` is left exactly as it is. A second mount target lives at `/my-zone`. We do not introduce Vue Router; instead `main.js` inspects `window.location.pathname` once and mounts either the existing portfolio `App.vue` or the new `MyZoneApp.vue`.

Because GitHub Pages serves only `index.html` and a `404.html`, a direct hit to `khademulbari.com/my-zone` would normally 404. We use the standard SPA fallback trick:

1. `public/404.html` is a tiny script that stores the original pathname (`/my-zone`) in `sessionStorage` and redirects to `/`.
2. `index.html` (via `main.js`) checks `sessionStorage` on boot; if a path is stored, it restores it via `history.replaceState` and clears the stored value.
3. `main.js` then reads `window.location.pathname` and mounts the right root component.

Net effect: `khademulbari.com/my-zone` works as a real URL with a brief redirect on the first uncached load.

### Auth — Appwrite email/password, owner-only

`/my-zone` renders the notes UI only when an Appwrite session exists. Otherwise it renders a login form. There is no signup UI; the single user account is created once in the Appwrite Cloud console. This makes the system truly single-tenant — even someone who discovers the path cannot register against the project.

Logout calls `account.deleteSession('current')` and returns to the login form.

### Data — Appwrite Database + Storage

One Appwrite project, one database, two collections, one storage bucket. All documents and files are permissioned to the single user ID.

## Data Model

### Collection `topics`

| Attribute   | Type     | Notes                                  |
| ----------- | -------- | -------------------------------------- |
| `name`      | string   | required, max 80                       |
| `slug`      | string   | required, unique, URL-safe identifier  |
| `noteCount` | integer  | default 0, denormalized for sidebar    |
| `createdAt` | datetime | server-set on create                   |
| `updatedAt` | datetime | server-set on update                   |

Indexes: `slug` (unique), `createdAt`.

`noteCount` is updated by the client right after a successful note create/delete (Appwrite has no triggers at the free tier and no cross-collection transactions). If the second call fails after the first succeeds, the count drifts — acceptable for single-user; a manual reconcile is a one-shot script.

### Collection `notes`

| Attribute     | Type             | Notes                                                 |
| ------------- | ---------------- | ----------------------------------------------------- |
| `title`       | string           | required, max 200                                     |
| `topicId`     | string           | required, indexed; FK to `topics.$id`                 |
| `contentHtml` | string (large)   | TipTap serialized HTML, used for rendering            |
| `contentJson` | string (large)   | TipTap JSON doc, used to round-trip into the editor   |
| `excerpt`     | string, max 300  | first ~300 plain-text chars, for the list preview     |
| `createdAt`   | datetime         | server-set                                            |
| `updatedAt`   | datetime         | server-set, indexed for "recent" sort                 |

Indexes: `topicId`, `updatedAt` (desc).

**Why both `contentHtml` and `contentJson`:** TipTap's JSON loads back into the editor losslessly; HTML is what we'd render in any read-only view or export. ~2× storage per note, eliminates a class of round-trip bugs.

### Storage bucket `note-images`

- Holds images pasted or uploaded into notes.
- File permissions locked to the owner's user ID.
- TipTap's image extension stores Appwrite file URLs in the note content.

### Permissions

All documents in both collections, and all files in the bucket, are created with:

```
Permission.read(Role.user(OWNER_USER_ID))
Permission.update(Role.user(OWNER_USER_ID))
Permission.delete(Role.user(OWNER_USER_ID))
```

Even with the public project ID, no other user (or anonymous client) can read or list anything.

## UI Layout

Two-pane layout at `/my-zone` once authenticated:

```
┌─────────────────────────────────────────────────────────┐
│ my-zone                              [Logout]           │
├──────────────────┬──────────────────────────────────────┤
│ TOPICS       [+] │  [Note title input...............]   │
│ ─────────────    │  ─────────────────────────────────   │
│ • Go (12)        │  [B I U  H1 H2  • 1.  ` </>  🔗 🖼]  │
│ • System Design  │  ─────────────────────────────────   │
│   (4)            │                                      │
│ • Bookmarks (8)  │  TipTap editor content area…         │
│ ─────────────    │                                      │
│ NOTES IN GO  [+] │                                      │
│ ─────────────    │                                      │
│ ▸ Channels...    │                                      │
│ ▸ Context can…   │                                      │
│ ▸ sync vs chan…  │  Saved · 2s ago                      │
└──────────────────┴──────────────────────────────────────┘
```

Empty states:
- No topics → sidebar shows a "Create your first topic" CTA, editor pane empty.
- Topic selected, no notes → "Create your first note in {topic}" CTA in the editor pane.
- Topic selected with notes but no note selected → "Select a note or create one."

Styling reuses existing CSS variables (`--rhythm`, `--text-dim`, `--border`, etc.) for visual consistency with the terminal aesthetic of the portfolio.

## Component & File Layout

New code lives under `src/my-zone/`. No existing portfolio file is modified except `main.js` and `index.html` (which gets a second mount path via the SPA fallback) and a new `public/404.html`.

```
src/
  main.js                          # gains pathname-based mount switch
  my-zone/
    MyZoneApp.vue                  # root; owns auth state, renders LoginForm or NotesShell
    LoginForm.vue                  # email/password, inline error
    NotesShell.vue                 # two-pane layout, logout, selection state
    TopicSidebar.vue               # topic list + selected topic's note list
    NoteEditor.vue                 # title input + TipTap editor + save-status indicator
    composables/
      useAuth.js                   # currentUser, login(), logout()
      useTopics.js                 # topics, createTopic(), renameTopic(), deleteTopic()
      useNotes.js                  # notesByTopic, createNote(), updateNote(), deleteNote()
    services/
      appwrite.js                  # single client; exports account, databases, storage
      images.js                    # upload helper for TipTap image extension
public/
  404.html                         # SPA fallback that stores pathname and redirects to /
```

## Editor Behavior

- **TipTap config:** StarterKit (paragraph, headings H1–H3, bullet/ordered lists, blockquote, code block, hard break, history) + Link + Image + Placeholder.
- **Toolbar:** Bold, Italic, Underline (via extension), H1, H2, bullet list, ordered list, inline code, code block, link, image.
- **Image insertion:** On paste or upload, the file is sent to `storage.createFile()` on `note-images`. The returned file's `getFileView` URL is inserted at the cursor via TipTap's image extension.
- **Autosave:** 1-second debounce on any title or content change. Save indicator cycles through `Editing… → Saving… → Saved · Ns ago`. Only one in-flight save per note — subsequent edits coalesce into the next save after the current one resolves.
- **Save payload:** `title`, `contentHtml`, `contentJson`, `excerpt` (computed client-side as the first 300 plain-text chars stripped from the TipTap doc).

## Error Handling

| Failure                              | Behavior                                                                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Login fails (wrong creds / network)  | Inline error message under the form with the Appwrite message.                                       |
| Autosave network error               | Indicator: `Save failed — retry`. Manual retry button. Editor state preserved; nothing lost.         |
| Image upload fails                   | No insertion. Toast with the error.                                                                  |
| Session expires mid-edit (401)       | Persist unsaved note content to `sessionStorage`, redirect to login. On re-login, offer to restore.  |
| Concurrent edit from another tab     | On save, compare server `updatedAt` to last-loaded; if server is newer, non-blocking warning banner. |
| Delete the topic / note in view      | Clear selection, return to the appropriate empty state.                                              |

## Out-of-Band Setup Steps

These happen once, before code lands:

1. Create Appwrite Cloud project at `cloud.appwrite.io`. Note the **endpoint** and **project ID**.
2. Create a database (e.g., `notes-db`).
3. Create collections `topics` and `notes` with the attributes and indexes above.
4. Create storage bucket `note-images`.
5. Add the single user account (your email + password) via the Auth section.
6. Capture the user ID and configure default document/file permissions to that user only.
7. Add the deployed origin (`https://khademulbari.com`) and local dev (`http://localhost:5173`) to the project's allowed web platforms.
8. Put `endpoint`, `project ID`, `database ID`, collection IDs, and bucket ID into `.env` (gitignored) and a `.env.example` (committed) using `VITE_APPWRITE_*` keys.

## Dependencies to Add

- `appwrite` — Web SDK
- `@tiptap/vue-3`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`, `@tiptap/extension-underline`

## Risks & Mitigations

- **Bundle size growth at `/`:** TipTap and Appwrite SDK should not load on the public portfolio. Mitigation: the pathname check in `main.js` lazy-imports `MyZoneApp` only when needed (dynamic `import('./my-zone/MyZoneApp.vue')`).
- **404.html redirect flash:** The brief reload on uncached `/my-zone` hits is acceptable for a single-user feature. Subsequent visits are cached.
- **`noteCount` drift:** Documented; a one-shot reconcile script is cheap to write if it ever matters.
- **No tests written:** Per project preference, this feature ships without automated tests. Manual verification via `npm run dev` covers the happy path before each merge.

## Acceptance Criteria

1. `khademulbari.com/` renders the existing portfolio with no visual or bundle change visible to anonymous visitors.
2. `khademulbari.com/my-zone` reaches a login form on a fresh browser.
3. Logging in with the configured Appwrite credentials reveals the two-pane notes UI.
4. Creating a topic, then a note inside it, persists across reload and across devices.
5. Pasting an image into the editor uploads it to Appwrite Storage and embeds it in the note.
6. Edits autosave within ~1 second of stopping typing; indicator reflects state accurately.
7. Logging out returns to the login form and prevents access to data on reload.

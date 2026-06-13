# Blog View Counter — Design

Date: 2026-06-13
Status: Approved

## Goal

Count how many times each published blog post is opened, and show the count to the
author inside `/my-zone`. Opens are deduped per browser (one count per browser per
post). Counting is performed by an Appwrite Function because public visitors have
read-only access to post documents.

## Decisions (locked)

- Mechanism: Appwrite Function increments a `views` integer on the post.
- Granularity: unique-ish per browser via a `localStorage` flag (refresh-safe).
- Display: author-only, in the `/my-zone` blog post list. No public-facing badge.

## 1. Data model

- Add an integer attribute `views` to the existing `POSTS` collection, default `0`,
  not required. The author already lists posts, so `views` is read for free.

Manual Appwrite console action (documented in the plan): add the `views` integer
attribute (default 0) to `POSTS`.

## 2. Increment path — Appwrite Function

- New Appwrite Function `increment-post-view`, Node runtime, using `node-appwrite`.
  Execute access = **Any** so anonymous visitors can invoke it.
- Request body: `{ "postId": "<id>" }`.
- Logic: load the post, compute `nextViews(doc) = (doc.views || 0) + 1`, update the
  post's `views`. Read-modify-write is acceptable for this traffic level. Returns
  `{ ok: true }` (or `{ ok: false }` on bad input / error).
- The function authenticates with a server API key (Appwrite Function environment
  variable `APPWRITE_API_KEY`) that has `documents.read` + `documents.write` on the
  database. It reuses the project, database, and `POSTS` collection ids via function
  environment variables.
- Source lives in the repo at `functions/increment-post-view/` (function code +
  a deploy README). Deployment to Appwrite is a manual step performed by the user.

## 3. Client trigger — public post page

- In `BlogPostPage`, after the post successfully loads, attempt to record a view:
  - key = `blog:viewed:<postId>`.
  - if `localStorage[key]` is unset: call
    `functions.createExecution(VIEW_FUNCTION_ID, JSON.stringify({ postId }), true)`
    (async = fire-and-forget), then set `localStorage[key] = '1'`.
  - if already set: do nothing.
- All errors are swallowed; view recording must never block or break reading.
- This logic is extracted into `src/my-zone/services/views.js` as
  `recordView(postId)` so it is unit-testable with a mocked functions client and a
  mocked `localStorage`.
- Appwrite wiring: `src/my-zone/services/appwrite.js` exports a `functions` instance
  (`new Functions(client)`) and `VIEW_FUNCTION_ID` from
  `import.meta.env.VITE_APPWRITE_VIEW_FUNCTION_ID`. Add the env var to `.env.example`.

## 4. Author display — my-zone

- `BlogShell`'s post list shows `· {views} views` next to each post's status badge,
  read from `post.views` (defaulting to 0 when absent). Read-only; no UI to reset.

## 5. Testing

- `recordView` (mock `functions.createExecution`, mock `localStorage`):
  - calls `createExecution` exactly once with the postId when the flag is unset;
  - sets the dedupe flag afterward;
  - does not call `createExecution` when the flag is already set;
  - swallows errors from `createExecution` (resolves without throwing).
- `nextViews(doc)` pure helper (in the function package): `(doc.views || 0) + 1`,
  including the missing/zero cases. Unit-tested.
- `BlogShell`: renders the view count for a post in the list.
- The Appwrite glue inside the function (client construction, updateDocument) is thin
  and deployed separately; it is not unit-tested.

## 6. Out of scope

- Time-series / per-day analytics, geo, referrers, dashboards.
- Public-facing view badge (author-only).
- Bot / crawler filtering.
- Resetting or editing counts from the UI.

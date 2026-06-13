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

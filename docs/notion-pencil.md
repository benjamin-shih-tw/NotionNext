# Notion Pencil

Page: `/notion-pencil`. Opening it without an `id` creates a random canvas URL. Paste that full URL into a Notion `/embed` block. Each URL has its own drawing.

Strokes autosave to a private Vercel Blob store and to the current browser. Open the same full UUID URL on another device to load the same drawing. PNG and JSON export work independently of cloud sync.

## Cloud storage

The `notion-pencil-canvases` private Blob store is connected to the `notion-next` Vercel project. Its `BLOB_STORE_ID` environment variable and Vercel OIDC credentials are used only in the server-side API. Only UUID IDs sync; arbitrary `?id=...` names remain local.

The UUID URL is the access key: anyone who has it can read and edit that canvas. Do not put a private canvas on a public Notion page. Concurrent edits are version checked; if another device saved first, download a JSON backup before reloading. Cloud storage has Vercel usage limits; when the store is unavailable, the page keeps a local copy and displays a sync failure.

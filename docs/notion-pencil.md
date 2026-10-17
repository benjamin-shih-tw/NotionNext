# Notion Pencil

Page: `/notion-pencil`. Opening it without an `id` creates a random canvas URL. Paste that full URL into a Notion `/embed` block. Each URL has its own drawing.

Without a database, strokes autosave in the current browser only. PNG and JSON export work independently of cloud sync.

## Enable cloud sync

1. Create a Supabase project and run [notion-pencil-supabase.sql](https://github.com/benjamin-shih-tw/NotionNext/blob/main/docs/notion-pencil-supabase.sql) in its SQL editor.
2. Add `NOTION_PENCIL_SUPABASE_URL` and `NOTION_PENCIL_SUPABASE_SERVICE_ROLE_KEY` to the Vercel project environment. The service role key must remain server-side and must never use a `NEXT_PUBLIC_` prefix.
3. Redeploy. UUID canvas URLs then load from Supabase and save automatically. Only UUID IDs sync; arbitrary `?id=...` names remain local.

The UUID URL is the access key: anyone who has it can read and edit that canvas. Do not put a private canvas on a public Notion page. Concurrent edits are version checked; if another device saved first, download a JSON backup before reloading.

import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: { sizeLimit: '3mb' } } }

const TABLE = 'notion_pencil_canvases'
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function validDrawing(value) {
  return (
    value &&
    Array.isArray(value.strokes) &&
    value.strokes.length <= 10000 &&
    value.strokes.every(
      stroke =>
        ['pen', 'highlighter'].includes(stroke.tool) &&
        /^#[0-9a-f]{6}$/i.test(stroke.color) &&
        Number.isFinite(stroke.size) &&
        stroke.size > 0 &&
        stroke.size <= 80 &&
        Array.isArray(stroke.points) &&
        stroke.points.length > 0 &&
        stroke.points.length <= 20000 &&
        stroke.points.every(
          point =>
            Number.isFinite(point.x) &&
            Number.isFinite(point.y) &&
            point.x >= 0 &&
        point.x <= 1000 &&
            point.y >= 0 &&
        point.y <= 1400
        )
    )
  )
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store')
  const url = process.env.NOTION_PENCIL_SUPABASE_URL
  const key = process.env.NOTION_PENCIL_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key)
    return res.status(503).json({ error: 'Cloud sync is not configured' })
  if (req.method !== 'GET' && req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT')
    return res.status(405).end()
  }
  const id = req.query.id
  if (typeof id !== 'string' || !uuid.test(id))
    return res.status(400).json({ error: 'Invalid canvas id' })
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
  if (req.method === 'GET') {
    const { data, error } = await db
      .from(TABLE)
      .select('drawing, version')
      .eq('id', id)
      .maybeSingle()
    if (error) return res.status(500).json({ error: 'Cloud load failed' })
    return res
      .status(200)
      .json({ drawing: data?.drawing || null, version: data?.version || 0 })
  }
  const { drawing, version } = req.body || {}
  if (!validDrawing(drawing) || !Number.isInteger(version) || version < 0) {
    return res.status(400).json({ error: 'Invalid drawing' })
  }
  if (JSON.stringify(drawing).length > 2_000_000)
    return res.status(413).json({ error: 'Drawing too large' })
  const { data, error } = await db.rpc('save_notion_pencil_canvas', {
    canvas_id: id,
    expected_version: version,
    next_drawing: drawing
  })
  if (error) return res.status(500).json({ error: 'Cloud save failed' })
  if (data === null)
    return res.status(409).json({ error: 'Canvas changed on another device' })
  return res.status(200).json({ version: data })
}

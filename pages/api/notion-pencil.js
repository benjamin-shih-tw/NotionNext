import { get, put } from '@vercel/blob'

export const config = { api: { bodyParser: { sizeLimit: '3mb' } } }

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

async function load(pathname) {
  const result = await get(pathname, { access: 'private', useCache: false })
  if (!result) return null
  const data = JSON.parse(await new Response(result.stream).text())
  return { ...data, etag: result.blob.etag }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store')
  if (!process.env.BLOB_STORE_ID)
    return res.status(503).json({ error: 'Cloud sync is not configured' })
  if (req.method !== 'GET' && req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT')
    return res.status(405).end()
  }
  const id = req.query.id
  if (typeof id !== 'string' || !uuid.test(id))
    return res.status(400).json({ error: 'Invalid canvas id' })

  const pathname = `notion-pencil/${id.toLowerCase()}.json`
  try {
    const current = await load(pathname)
    if (req.method === 'GET')
      return res.status(200).json({
        drawing: current?.drawing || null,
        version: current?.version || 0
      })

    const { drawing, version } = req.body || {}
    if (!validDrawing(drawing) || !Number.isInteger(version) || version < 0)
      return res.status(400).json({ error: 'Invalid drawing' })
    if (JSON.stringify(drawing).length > 2_000_000)
      return res.status(413).json({ error: 'Drawing too large' })
    if (version !== (current?.version || 0))
      return res.status(409).json({ error: 'Canvas changed on another device' })

    try {
      await put(pathname, JSON.stringify({ drawing, version: version + 1 }), {
        access: 'private',
        contentType: 'application/json',
        cacheControlMaxAge: 60,
        ...(current ? { allowOverwrite: true, ifMatch: current.etag } : {})
      })
    } catch (error) {
      if (
        error.name === 'BlobPreconditionFailedError' ||
        error.name === 'BlobAlreadyExistsError' ||
        error.status === 409 ||
        error.status === 412
      )
        return res
          .status(409)
          .json({ error: 'Canvas changed on another device' })
      throw error
    }
    return res.status(200).json({ version: version + 1 })
  } catch (error) {
    console.error('Notion Pencil cloud sync failed:', error)
    return res.status(500).json({ error: 'Cloud storage failed' })
  }
}

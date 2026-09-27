import { getCodingCourseCatalog } from '@/lib/codingCourse/catalog'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=45, stale-while-revalidate=120')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const catalog = await getCodingCourseCatalog()
    return res.status(200).json(catalog)
  } catch (error) {
    console.error('[Coding Course catalog]', error)
    return res.status(500).json({ error: 'Failed to load catalog' })
  }
}

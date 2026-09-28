import { fetchPageFromNotion } from '@/lib/db/notion/getNotionPost'
import { catalogContainsPage, getCodingCourseCatalog } from '@/lib/codingCourse/catalog'
import { findRecordBlock, isCodingCoursePage } from '@/lib/codingCourse/hierarchy'

const compact = value => String(value || '').replace(/-/g, '').toLowerCase()
const blockTitle = block => (block?.properties?.title || [])
  .map(part => Array.isArray(part) ? part[0] : part)
  .filter(part => typeof part === 'string')
  .join('')

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=45, stale-while-revalidate=120')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const id = compact(req.query?.id)
  if (!/^[0-9a-f]{32}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid page id' })
  }

  try {
    const catalog = await getCodingCourseCatalog()
    const minute = Math.floor(Date.now() / 60000)
    const post = await fetchPageFromNotion(id, { cacheVersion: 'cc-page-' + minute })
    if (!post?.blockMap) {
      return res.status(404).json({ error: 'Course content not found' })
    }

    if (
      !catalogContainsPage(catalog, id) &&
      !isCodingCoursePage(post.blockMap, id, catalog)
    ) {
      return res.status(404).json({ error: 'Course page not found' })
    }

    const item = catalog.items.find(item => item.id === id)
    const pageBlock = findRecordBlock(post.blockMap, id)
    const notionTitle = blockTitle(pageBlock)
    return res.status(200).json({
      id,
      title: item?.title || notionTitle || post.title || '',
      hasContent: item?.hasContent !== false,
      blockMap: post.blockMap
    })
  } catch (error) {
    console.error('[Coding Course page]', id, error)
    return res.status(500).json({ error: 'Failed to load course content' })
  }
}

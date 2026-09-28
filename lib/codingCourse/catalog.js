import { getTextContent, idToUuid } from 'notion-utils'
import { fetchInBatches, fetchNotionPageBlocks } from '@/lib/db/notion/getPostBlocks'
import notionAPI from '@/lib/db/notion/getNotionAPI'
import { normalizeCollection, normalizeSchema, normalizePageBlock } from '@/lib/db/notion/normalizeUtil'

const TOPICS_DATABASE_PAGE_ID = '25992ab76d4081329392cc84f2b0a8c4'
const DOMAINS_DATABASE_PAGE_ID = '25992ab76d4081d89f14d4f38b014700'

const FALLBACK_DOMAINS = {
  '2f392ab76d408005ac26fa013d0ec233': '00 Fundamentals',
  '3e892ab76d408186be53cd6f66e475fa': '01 Complete Search & Simulation',
  '2e392ab76d4080e782bbd683894d56a5': '02 STL & Basic Data Structures',
  '2e392ab76d40808d8bbae2411b4140d7': '03 Sorting & Searching',
  '3e892ab76d40815eaf5cc14420825e90': '04 Prefix Sums',
  '2e392ab76d4080b8aa72c16a5887157c': '05 Greedy',
  '2e992ab76d408003a311e8c299233c46': '06 Graphs',
  '33092ab76d4080f38226fef0fc47c441': '07 Trees',
  '2e992ab76d4080ee837bed42be05751c': '08 Dynamic Programming',
  '33092ab76d4080779240d770585a2832': '09 Data Structures & Range Queries',
  '33092ab76d4080a3b9bdefec703c0f73': '10 Math',
  '33092ab76d4080b4bf00f3f385919105': '11 Geometry',
  '33092ab76d4080478d0fcd4c83b85c35': '12 Strings'
}

let memoryCache = { at: 0, value: null }
const CACHE_MS = 60 * 1000

const compact = value => String(value || '').replace(/-/g, '').toLowerCase()
const isId = value => /^[0-9a-f]{32}$/i.test(compact(value))

function findSchemaKey(schema, name) {
  const target = String(name || '').toLowerCase()
  return Object.entries(schema || {}).find(([, value]) =>
    String(value?.name || '').toLowerCase() === target
  )?.[0]
}

function readText(block, schema, name) {
  const key = findSchemaKey(schema, name)
  if (!key) return ''
  const raw = block?.properties?.[key]
  if (!raw) return ''
  try {
    const value = getTextContent(raw)
    return Array.isArray(value) ? value.join('') : String(value || '')
  } catch {
    return ''
  }
}

function readNumber(block, schema, name) {
  const key = findSchemaKey(schema, name)
  const raw = key ? block?.properties?.[key] : null
  if (!raw) return null
  const stack = [raw]
  while (stack.length) {
    const value = stack.pop()
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && /^-?\d+(?:\.\d+)?$/.test(value.trim())) {
      return Number(value)
    }
    if (Array.isArray(value)) stack.push(...value)
    else if (value && typeof value === 'object') stack.push(...Object.values(value))
  }
  return null
}

function readRelationIds(block, schema, name) {
  const key = findSchemaKey(schema, name)
  const raw = key ? block?.properties?.[key] : null
  if (!raw) return []

  const ids = new Set()
  const visit = value => {
    if (!value) return
    if (Array.isArray(value)) {
      if (
        value.length >= 2 &&
        value[0] === 'p' &&
        typeof value[1] === 'string' &&
        isId(value[1])
      ) {
        ids.add(compact(value[1]))
      }
      value.forEach(visit)
      return
    }
    if (value && typeof value === 'object') {
      Object.values(value).forEach(visit)
    }
  }
  visit(raw)
  return [...ids]
}

function collectIds(value, result = new Set()) {
  if (!value) return result
  if (Array.isArray(value)) {
    value.forEach(item => {
      if (typeof item === 'string' && isId(item)) result.add(compact(item))
      else collectIds(item, result)
    })
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      if (key === 'blockIds' || key === 'page_sort') {
        collectIds(item, result)
      } else if (typeof item === 'object') {
        collectIds(item, result)
      }
    })
  }
  return result
}

function blockById(blockMap, id) {
  if (!blockMap || !id) return null
  const candidates = [id, idToUuid(id)]
  for (const candidate of candidates) {
    const entry = blockMap[candidate]
    if (entry) return normalizePageBlock(entry)
  }
  return null
}

function collectionViewIds(recordMap, collectionId) {
  const ids = new Set()

  Object.values(recordMap?.block || {}).forEach(entry => {
    const block = normalizePageBlock(entry)
    if (!block || !['collection_view', 'collection_view_page'].includes(block.type)) {
      return
    }

    const blockCollectionId = compact(block.collection_id)
    if (blockCollectionId && blockCollectionId !== compact(collectionId)) return

    ;(block.view_ids || []).forEach(viewId => {
      if (viewId) ids.add(viewId)
    })
  })

  if (!ids.size) {
    Object.keys(recordMap?.collection_view || {}).forEach(viewId => ids.add(viewId))
  }

  return [...ids]
}

async function hydrateCompleteCollection(recordMap, collectionIdRaw, ids) {
  const viewIds = collectionViewIds(recordMap, collectionIdRaw)
  if (!viewIds.length) return

  for (const viewId of viewIds) {
    try {
      // Intentionally omit collectionView so getCollectionData doesn't inherit
      // saved-view filters. The Coding Course catalog must represent every row.
      const collectionData = await notionAPI.__call(
        'getCollectionData',
        collectionIdRaw,
        viewId,
        undefined,
        { limit: 999 }
      )

      collectIds(collectionData?.result, ids)

      if (collectionData?.recordMap) {
        recordMap.block = {
          ...(recordMap.block || {}),
          ...(collectionData.recordMap.block || {})
        }
        recordMap.collection = {
          ...(recordMap.collection || {}),
          ...(collectionData.recordMap.collection || {})
        }
        recordMap.collection_view = {
          ...(recordMap.collection_view || {}),
          ...(collectionData.recordMap.collection_view || {})
        }
        recordMap.notion_user = {
          ...(recordMap.notion_user || {}),
          ...(collectionData.recordMap.notion_user || {})
        }
      }

      // One unfiltered query is enough. If this view is inaccessible or invalid,
      // the catch below tries the next view id.
      return
    } catch (error) {
      console.warn(
        '[Coding Course catalog] complete collection query failed',
        { collectionId: collectionIdRaw, viewId },
        error?.message || error
      )
    }
  }
}

async function loadDatabase(pageId, expectedPropertyName) {
  const minute = Math.floor(Date.now() / 60000)
  const recordMap = await fetchNotionPageBlocks(
    pageId,
    'coding-course-catalog',
    { cacheVersion: 'cc-' + minute }
  )
  if (!recordMap) return null

  const collections = Object.entries(recordMap.collection || {})
  let selected = collections.find(([, raw]) => {
    const collection = normalizeCollection(raw)
    const schema = normalizeSchema(collection?.schema || {})
    return Boolean(findSchemaKey(schema, expectedPropertyName))
  })

  if (!selected && collections.length === 1) selected = collections[0]
  if (!selected) return null

  const [collectionIdRaw, collectionRaw] = selected
  const collectionId = compact(collectionIdRaw)
  const collection = normalizeCollection(collectionRaw)
  const schema = normalizeSchema(collection?.schema || {})

  const ids = collectIds(recordMap.collection_query)
  collectIds(recordMap.collection_view, ids)

  // getPage() may return only the currently materialized / filtered view rows.
  // Query the collection directly so newly-created or filtered rows are not lost.
  await hydrateCompleteCollection(recordMap, collectionIdRaw, ids)

  Object.entries(recordMap.block || {}).forEach(([id, entry]) => {
    const block = normalizePageBlock(entry)
    if (
      block &&
      compact(block.parent_id) === collectionId &&
      isId(id)
    ) {
      ids.add(compact(id))
    }
  })

  const missing = [...ids].filter(id => !blockById(recordMap.block, id))
  if (missing.length) {
    const fetched = await fetchInBatches(missing, 30)
    recordMap.block = { ...(recordMap.block || {}), ...(fetched || {}) }
  }

  return { recordMap, collectionId, schema, ids: [...ids] }
}

async function loadDomains() {
  const data = await loadDatabase(DOMAINS_DATABASE_PAGE_ID, 'Name')
  const map = new Map(Object.entries(FALLBACK_DOMAINS))
  const active = []

  if (data) {
    for (const id of data.ids) {
      const block = blockById(data.recordMap.block, id)
      if (!block?.properties) continue
      const name = readText(block, data.schema, 'Name').trim()
      const status = readText(block, data.schema, 'Status').trim()
      if (!name) continue
      map.set(compact(id), name)
      if (status.toLowerCase() !== 'archived') active.push(name)
    }
  }

  const order = (active.length ? active : Object.values(FALLBACK_DOMAINS))
    .filter(name => /^\d{2}\s/.test(name))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))

  return { map, order }
}

export async function getCodingCourseCatalog({ force = false } = {}) {
  if (!force && memoryCache.value && Date.now() - memoryCache.at < CACHE_MS) {
    return memoryCache.value
  }

  const [topics, domains] = await Promise.all([
    loadDatabase(TOPICS_DATABASE_PAGE_ID, 'lecture'),
    loadDomains()
  ])

  if (!topics) {
    const fallback = { generatedAt: new Date().toISOString(), domains: domains.order, items: [] }
    memoryCache = { at: Date.now(), value: fallback }
    return fallback
  }

  const items = []
  for (const id of topics.ids) {
    const block = blockById(topics.recordMap.block, id)
    if (!block?.properties) continue

    const title = readText(block, topics.schema, 'lecture').trim()
    const type = readText(block, topics.schema, 'type').trim().toLowerCase()
    if (!title || !['lecture', 'assignment'].includes(type)) continue

    const domainIds = readRelationIds(block, topics.schema, 'domain')
    const domainNames = domainIds
      .map(domainId => domains.map.get(compact(domainId)))
      .filter(Boolean)

    const details = readText(block, topics.schema, 'details').trim()
    const difficulty = readNumber(block, topics.schema, '難度')
    const status = readText(block, topics.schema, 'Status').trim()
    const mastery = readText(block, topics.schema, 'mastery').trim()
    const hasContent = Array.isArray(block.content) && block.content.length > 0

    items.push({
      id: compact(id),
      title,
      type,
      domains: domainNames,
      details,
      difficulty,
      status,
      mastery,
      hasContent,
      notionUrl: 'https://app.notion.com/p/' + compact(id)
    })
  }

  items.sort((a, b) =>
    a.title.localeCompare(b.title, 'en', { numeric: true })
  )

  const value = {
    generatedAt: new Date().toISOString(),
    domains: domains.order,
    items
  }
  memoryCache = { at: Date.now(), value }
  return value
}

export function catalogContainsPage(catalog, pageId) {
  const id = compact(pageId)
  return Boolean(catalog?.items?.some(item => item.id === id))
}

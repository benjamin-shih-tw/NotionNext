import { getTextContent, idToUuid } from 'notion-utils'
import { fetchInBatches, fetchNotionPageBlocks } from '@/lib/db/notion/getPostBlocks'
import notionAPI from '@/lib/db/notion/getNotionAPI'
import { normalizeCollection, normalizeSchema, normalizePageBlock } from '@/lib/db/notion/normalizeUtil'

const TOPICS_DATABASE_PAGE_ID = '25992ab76d4081329392cc84f2b0a8c4'
const DOMAINS_DATABASE_PAGE_ID = '25992ab76d4081d89f14d4f38b014700'

const REQUIRED_TOPIC_IDS = new Set([
  "2e392ab76d4080028b6ffbb7dc2b29ed",
  "2e392ab76d408019a704c34f01b2ab1c",
  "2e392ab76d40801c8e05e50e3ef06c86",
  "2e392ab76d408025afbff43f58e25219",
  "2e392ab76d40803e83b7ec46acf28ffb",
  "2e392ab76d40804a8528e27899e46dc3",
  "2e392ab76d40806c873ac58c7f3d77a3",
  "2e392ab76d408076acd9d02a39ee64f3",
  "2e392ab76d4080a894fed635920f9c3c",
  "2e392ab76d4080e395f4f494a3e8f880",
  "2e392ab76d4080f59f95d0827281ae23",
  "2f092ab76d408081a00fe22eef47cad3",
  "2f392ab76d4080d7a19af426c0398dce",
  "33092ab76d408008a0a7c08a54a35c52",
  "33092ab76d4080199eaafc456a0f2fb7",
  "33092ab76d40802e8b3fe81a23b44576",
  "33092ab76d40802f813ed4ca344b6864",
  "33092ab76d40803f9b93ca26e064c1bf",
  "33092ab76d408043b128e639a17c2484",
  "33092ab76d40804a8ddae8a9c6090a1f",
  "33092ab76d408052ab69d57ace25461e",
  "33092ab76d408067a9b3c3459edb680a",
  "33092ab76d40806a80b9c4a4d2d3fec0",
  "33092ab76d408075bf02c0aecbacaf15",
  "33092ab76d40808086f8e08bc241b356",
  "33092ab76d40808c9a81d540a6d662a1",
  "33092ab76d40809c9543d94c24efa37a",
  "33092ab76d4080b5be7beaa7cd896ef1",
  "33092ab76d4080e396c2d21276ba88db",
  "33092ab76d4080e79badf5a1f860fc8c",
  "33092ab76d4080ee9d38f7836636d5fa",
  "36e92ab76d408039a26fcdf344458652",
  "36e92ab76d40806bbf5af50e80105a2b",
  "37e92ab76d4080378ac7e507609fd393",
  "37e92ab76d4080458956cccda1cb88b5",
  "37e92ab76d408078a97eef443858b3de",
  "37e92ab76d4080a58161e64bf8bb982b",
  "37e92ab76d4080bd8565df68351c9ff3",
  "37e92ab76d4080c68054cf028dd73ed0",
  "37e92ab76d4080cea63ddd66fb4205b8",
  "37e92ab76d4080ceb6b1d80eb7566a49",
  "37e92ab76d4080d29382c27edb67d8d5",
  "37e92ab76d4080d88d8fff71abbe5c6b",
  "37e92ab76d4080ef8fd6c1dbafacf768",
  "38a92ab76d4080ad99d2ff847b5de635",
  "38f92ab76d40807c8365dacdcacd8790",
  "38f92ab76d4080d4b7f4c56c089daf56",
  "39092ab76d4080479532e765d7a6b59e",
  "39192ab76d4080b8adcdfa2880de9b64",
  "3d492ab76d40807c8646ecb550723470",
  "3e892ab76d408102aec4ce3bc4fe29b0",
  "3e892ab76d40810eb347d20c7c2e4a46",
  "3e892ab76d40810f8e8ec16f2dc7a6ee",
  "3e892ab76d408119bd53ce739e81f39f",
  "3e892ab76d40811faaedc77ac94b29e9",
  "3e892ab76d408121a81cee03805638ff",
  "3e892ab76d40812aa397cb8b7dc9cb85",
  "3e892ab76d40814a87f5d65fd9b9e353",
  "3e892ab76d40814d9dc6d44031417468",
  "3e892ab76d408152ab1fed571053561b",
  "3e892ab76d408161a791d38e24ca3677",
  "3e892ab76d40816dbdc7f9cd010bfc59",
  "3e892ab76d408178b59ff292e87b9256",
  "3e892ab76d408180afe2c76f78173c80",
  "3e892ab76d408191a979d9f33c5f58c4",
  "3e892ab76d4081929b7ccd6ec43fe656",
  "3e892ab76d4081b58001c57a495e4220",
  "3e892ab76d4081c9a9f7dd9ac7bbb034",
  "3e892ab76d4081ce9465cfa5633c9550",
  "3e892ab76d4081cfb499c9e8ab05a172",
  "3e892ab76d4081d49132d6cc34d59c79",
  "3e892ab76d4081d8b08ddf594b1d9995",
  "3e892ab76d4081dd8547f9c0bddea98f",
  "3e892ab76d4081dea137ee9bb24bddf9",
  "3e892ab76d4081e9aacdce6b86ed8be8",
  "3e892ab76d4081ee95dceb60f0c01c7e",
  "3e892ab76d4081eeac7af300f0d7c881",
  "3e892ab76d4081f4a3ebea631573b28c",
  "3e892ab76d4081f8ad7aedb667c615ba",
  "3e892ab76d4081feb932e92efcede2f4"
])

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

  // Notion's queryCollection can still scope results by collectionViewId even
  // when we send an unfiltered loader. Union every accessible view instead of
  // trusting the first successful one. This prevents rows that only appear in
  // Review / Assignments / other views from disappearing from the live catalog.
  for (const viewId of viewIds) {
    try {
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
    } catch (error) {
      console.warn(
        '[Coding Course catalog] collection view query failed',
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

  if (expectedPropertyName === 'lecture') {
    REQUIRED_TOPIC_IDS.forEach(id => ids.add(compact(id)))
  }

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

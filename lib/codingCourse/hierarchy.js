const compact = value => String(value || '').replace(/-/g, '').toLowerCase()
const toUuid = value => {
  const id = compact(value)
  return id.replace(/^(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})$/, '$1-$2-$3-$4-$5')
}

export function findRecordBlock(recordMap, pageId) {
  const id = compact(pageId)
  if (!id) return null

  const blocks = recordMap?.block || {}
  return blocks[id]?.value || blocks[toUuid(id)]?.value || Object.values(blocks).find(
    entry => compact(entry?.value?.id) === id
  )?.value || null
}

export function isCodingCoursePage(recordMap, pageId, catalog, maxDepth = 20) {
  const catalogIds = new Set((catalog?.items || []).map(item => compact(item.id)))
  let currentId = compact(pageId)
  const visited = new Set()

  for (let depth = 0; currentId && depth < maxDepth; depth++) {
    if (catalogIds.has(currentId)) return true
    if (visited.has(currentId)) return false
    visited.add(currentId)

    const block = findRecordBlock(recordMap, currentId)
    if (!block || block.parent_table !== 'block') return false
    currentId = compact(block.parent_id)
  }

  return false
}

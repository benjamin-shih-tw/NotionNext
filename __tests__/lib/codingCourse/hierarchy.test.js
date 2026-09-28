import { isCodingCoursePage } from '@/lib/codingCourse/hierarchy'

const page = (id, parentId, parentTable = 'block') => ({
  role: 'reader',
  value: { id, type: 'page', parent_id: parentId, parent_table: parentTable }
})

describe('isCodingCoursePage', () => {
  const catalogId = '33092ab76d4080199eaafc456a0f2fb7'
  const childId = '3c492ab76d40800ba2f5dd6bfd0026c1'
  const middleId = '3c492ab76d4080dab15aefe3291b0d8a'
  const catalog = { items: [{ id: catalogId }] }

  test('accepts a catalog page', () => {
    expect(isCodingCoursePage({ block: {} }, catalogId, catalog)).toBe(true)
  })

  test('accepts a nested descendant of a catalog page', () => {
    const recordMap = { block: {
      [childId]: page(childId, middleId),
      [middleId]: page(middleId, catalogId),
      [catalogId]: page(catalogId, '25992ab76d4080199eaafc456a0f2fb7', 'collection')
    } }
    expect(isCodingCoursePage(recordMap, childId, catalog)).toBe(true)
  })

  test('rejects a page outside the Coding Course hierarchy', () => {
    const unrelatedId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const recordMap = { block: {
      [unrelatedId]: page(unrelatedId, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'space')
    } }
    expect(isCodingCoursePage(recordMap, unrelatedId, catalog)).toBe(false)
  })

  test('rejects cycles and traversal beyond the depth limit', () => {
    const first = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const second = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    const recordMap = { block: {
      [first]: page(first, second),
      [second]: page(second, first)
    } }
    expect(isCodingCoursePage(recordMap, first, catalog, 20)).toBe(false)
  })
})

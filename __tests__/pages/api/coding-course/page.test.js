import handler from '@/pages/api/coding-course/page/[id]'
import { fetchPageFromNotion } from '@/lib/db/notion/getNotionPost'
import { getCodingCourseCatalog } from '@/lib/codingCourse/catalog'

jest.mock('@/lib/db/notion/getNotionPost', () => ({ fetchPageFromNotion: jest.fn() }))
jest.mock('@/lib/codingCourse/catalog', () => ({
  getCodingCourseCatalog: jest.fn(),
  catalogContainsPage: (catalog, id) => catalog.items.some(item => item.id === id)
}))

const catalogId = '33092ab76d4080199eaafc456a0f2fb7'
const childId = '3c492ab76d40800ba2f5dd6bfd0026c1'

function response() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name] = value },
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
    end() { return this }
  }
}

function post(id, parentId, title) {
  return {
    title,
    blockMap: { block: {
      [id]: { value: {
        id,
        type: 'page',
        parent_id: parentId,
        parent_table: 'block',
        properties: { title: [[title]] }
      } },
      [parentId]: { value: {
        id: parentId,
        type: 'page',
        parent_id: '25992ab76d4080199eaafc456a0f2fb7',
        parent_table: 'collection',
        properties: { title: [['09-03 Segment Tree']] }
      } }
    } }
  }
}

describe('Coding Course page API', () => {
  beforeEach(() => {
    getCodingCourseCatalog.mockResolvedValue({
      items: [{ id: catalogId, title: '09-03 Segment Tree', hasContent: true }]
    })
  })

  test('rejects an invalid page id', async () => {
    const res = response()
    await handler({ method: 'GET', query: { id: 'bad' } }, res)
    expect(res.statusCode).toBe(400)
    expect(fetchPageFromNotion).not.toHaveBeenCalled()
  })

  test('returns a catalog page', async () => {
    fetchPageFromNotion.mockResolvedValue(post(catalogId, catalogId, '09-03 Segment Tree'))
    const res = response()
    await handler({ method: 'GET', query: { id: catalogId } }, res)
    expect(res.statusCode).toBe(200)
    expect(res.body.id).toBe(catalogId)
  })

  test('returns a descendant with its real Notion title', async () => {
    fetchPageFromNotion.mockResolvedValue(post(childId, catalogId, '線段樹解法'))
    const res = response()
    await handler({ method: 'GET', query: { id: childId } }, res)
    expect(res.statusCode).toBe(200)
    expect(res.body.title).toBe('線段樹解法')
    expect(res.body.blockMap.block).toBeDefined()
  })

  test('does not expose an unrelated valid Notion page id', async () => {
    const unrelatedId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    fetchPageFromNotion.mockResolvedValue(post(
      unrelatedId,
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      'Private workspace page'
    ))
    const res = response()
    await handler({ method: 'GET', query: { id: unrelatedId } }, res)
    expect(res.statusCode).toBe(404)
  })
})

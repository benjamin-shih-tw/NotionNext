/** @jest-environment node */
import { webcrypto, randomBytes } from 'node:crypto'
import { isAdminAuthorized } from '@/lib/admin/auth'
import { validateHomepage } from '@/lib/admin/homepage'
import handler from '@/pages/api/admin/home'
import { getServerSideProps } from '@/pages/admin'

const content = {
  "pageTitle": "Blog of Benjaminshih",
  "pageDescription": "Benjamin Shih 的個人筆記本：程式、競程、專題研究與生活紀錄。",
  "heroLabel": "Personal notebook · 2026",
  "heroTitle": "寫下值得留下的筆記，\n安排真正會發生的一週。",
  "heroDescription": "這本筆記收藏我的專案與學習紀錄。寫給一個用鉛筆與墨水思考的開發者。",
  "notesButton": "翻閱文章",
  "projectsButton": "查看專案",
  "welcomeLabel": "Hey there!",
  "welcomeTitle": "嗨，歡迎來到我的筆記本。",
  "welcomeDescription": "泡杯咖啡，忽略散落的塗鴉，看看我正在做的專案、競程筆記與研究紀錄。",
  "activityLabel": "Coding activity",
  "activityTitle": "程式活動",
  "notesLabel": "Selected notes",
  "notesTitle": "精選文章",
  "projectsLabel": "Selected projects",
  "projectsTitle": "精選專案"
}
const sha = 'a'.repeat(40)
let authorization
const savedEnvironment = { ...process.env }

function response() {
  return {
    headers: {}, statusCode: 200, body: null,
    setHeader(name, value) { this.headers[name] = value },
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
    end(body) { this.body = body; return this }
  }
}
function request(overrides = {}) {
  return {
    method: 'PUT',
    headers: { authorization, host: 'benjaminshih.vercel.app', origin: 'https://benjaminshih.vercel.app', 'x-forwarded-proto': 'https', 'content-type': 'application/json' },
    body: { ...content, sha },
    ...overrides
  }
}
function latest() {
  return { ok: true, json: async () => ({ sha, content: Buffer.from(JSON.stringify(content)).toString('base64') }) }
}

beforeAll(() => { Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true }) })
beforeEach(() => {
  process.env.ADMIN_PASSWORD = randomBytes(24).toString('hex') + ':中文'
  process.env.GITHUB_TOKEN = 'test-only-placeholder'
  authorization = 'Basic ' + Buffer.from('admin:' + process.env.ADMIN_PASSWORD).toString('base64')
  fetch.mockReset()
})
afterAll(() => { process.env = savedEnvironment })

test('accepts UTF-8 credentials and rejects missing, wrong and malformed credentials', async () => {
  expect(await isAdminAuthorized(authorization)).toBe(true)
  expect(await isAdminAuthorized('Basic !!!!')).toBe(false)
  expect(await isAdminAuthorized('')).toBe(false)
  expect(await isAdminAuthorized('Basic ' + Buffer.from('other:' + process.env.ADMIN_PASSWORD).toString('base64'))).toBe(false)
  delete process.env.ADMIN_PASSWORD
  expect(await isAdminAuthorized(authorization)).toBe(false)
})

test.each(['GET', 'PUT', 'OPTIONS'])('unauthorized %s cannot read or publish', async method => {
  const res = response()
  await handler(request({ method, headers: {} }), res)
  expect(res.statusCode).toBe(401)
  expect(res.headers['WWW-Authenticate']).toMatch(/Basic/)
  expect(res.headers['Cache-Control']).toMatch(/no-store/)
  expect(fetch).not.toHaveBeenCalled()
})

test('server page denies requests even without middleware', async () => {
  const res = response()
  expect(await getServerSideProps({ req: { headers: {} }, res })).toEqual({ props: { authorized: false } })
  expect(res.statusCode).toBe(401)
})

test('reads current GitHub content instead of the deployed snapshot', async () => {
  fetch.mockResolvedValueOnce(latest())
  const res = response()
  await handler(request({ method: 'GET' }), res)
  expect(res.body).toEqual({ ...content, sha })
  expect(fetch.mock.calls[0][0]).toContain('/NotionNext/contents/data/homepage.json?ref=main')
  expect(JSON.stringify(res.body)).not.toContain(process.env.GITHUB_TOKEN)
})

test.each([undefined, 'https://other.invalid', 'https://benjaminshih.vercel.app/path'])('rejects unsafe origin %s before GitHub access', async origin => {
  const req = request()
  req.headers.origin = origin
  const res = response()
  await handler(req, res)
  expect(res.statusCode).toBe(403)
  expect(fetch).not.toHaveBeenCalled()
})

test('fails closed when token is missing', async () => {
  delete process.env.GITHUB_TOKEN
  const res = response()
  await handler(request({ method: 'GET' }), res)
  expect(res.statusCode).toBe(503)
  expect(fetch).not.toHaveBeenCalled()
})

test('rejects stale edits without a GitHub write', async () => {
  fetch.mockResolvedValueOnce(latest())
  const res = response()
  await handler(request({ body: { ...content, sha: 'b'.repeat(40) } }), res)
  expect(res.statusCode).toBe(409)
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('publishes only validated homepage fields to the fixed repository and branch', async () => {
  fetch.mockResolvedValueOnce(latest()).mockResolvedValueOnce({
    ok: true, status: 200,
    json: async () => ({ content: { sha: 'c'.repeat(40) }, commit: { html_url: 'https://github.com/benjamin-shih-tw/NotionNext/commit/test' } })
  })
  const res = response()
  await handler(request({ body: { ...content, heroDescription: 'Updated introduction', sha, path: 'arbitrary.js', token: 'injected' } }), res)
  expect(res.statusCode).toBe(200)
  const [url, options] = fetch.mock.calls[1]
  expect(url).toContain('/NotionNext/contents/data/homepage.json')
  const payload = JSON.parse(options.body)
  expect(payload.branch).toBe('main')
  expect(payload.sha).toBe(sha)
  expect(JSON.parse(Buffer.from(payload.content, 'base64').toString('utf8'))).toEqual({ ...content, heroDescription: 'Updated introduction' })
  expect(JSON.stringify(res.body)).not.toContain(process.env.GITHUB_TOKEN)
})

test('does not create an unnecessary deployment when nothing changed', async () => {
  fetch.mockResolvedValueOnce(latest())
  const res = response()
  await handler(request(), res)
  expect(res.body.unchanged).toBe(true)
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('validates size, types and required text', () => {
  expect(validateHomepage({ ...content, heroDescription: 'x'.repeat(3001) })).toBeNull()
  expect(validateHomepage({ ...content, heroTitle: false })).toBeNull()
  expect(validateHomepage({ ...content, heroTitle: ' ' })).toBeNull()
  expect(validateHomepage({ ...content, heroDescription: '' })).not.toBeNull()
})

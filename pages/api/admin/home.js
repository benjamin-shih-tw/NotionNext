import { isAdminAuthorized, rejectAdmin, setAdminHeaders } from '@/lib/admin/auth'
import { validateHomepage } from '@/lib/admin/homepage'

const CONTENTS_URL = 'https://api.github.com/repos/benjamin-shih-tw/NotionNext/contents/data/homepage.json'

export const config = { api: { bodyParser: { sizeLimit: '128kb' } } }

function githubHeaders() {
  return {
    Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
}

async function readLatest() {
  const response = await fetch(CONTENTS_URL + '?ref=main', {
    headers: githubHeaders(),
    cache: 'no-store',
    signal: AbortSignal.timeout(10000)
  })
  if (!response.ok) throw new Error('GitHub read failed')
  const file = await response.json()
  const data = validateHomepage(JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')))
  if (!data || typeof file.sha !== 'string') throw new Error('Invalid homepage data')
  return { data, sha: file.sha }
}

export default async function handler(req, res) {
  setAdminHeaders(res)
  if (!await isAdminAuthorized(req.headers.authorization)) return rejectAdmin(res)
  if (!['GET', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT')
    return res.status(405).json({ error: '不支援此操作' })
  }
  if (req.method === 'PUT') {
    let origin
    try { origin = new URL(req.headers.origin) } catch {}
    const protocol = req.headers['x-forwarded-proto'] || (req.socket?.encrypted ? 'https' : 'http')
    if (!origin || origin.origin !== req.headers.origin ||
        origin.host !== req.headers.host || origin.protocol !== protocol + ':' ||
        req.headers['sec-fetch-site'] === 'cross-site') {
      return res.status(403).json({ error: '無效的請求來源' })
    }
    if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
      return res.status(415).json({ error: '請使用 JSON 格式' })
    }
  }
  if (!process.env.GITHUB_TOKEN) {
    return res.status(503).json({ error: '請在 Vercel 安全介面設定 GITHUB_TOKEN，並重新部署。Token 須具備 NotionNext 的 Contents 讀寫權限。' })
  }
  try {
    if (req.method === 'GET') {
      const current = await readLatest()
      return res.status(200).json({ ...current.data, sha: current.sha })
    }
    const clean = validateHomepage(req.body)
    if (!clean || typeof req.body.sha !== 'string' || !/^[a-f0-9]{40}$/.test(req.body.sha)) {
      return res.status(400).json({ error: '欄位或版本格式錯誤，請重新載入' })
    }
    const current = await readLatest()
    if (current.sha !== req.body.sha) {
      return res.status(409).json({ error: '首頁已被修改，請重新載入後再編輯，避免覆蓋其他修改。' })
    }
    if (JSON.stringify(clean) === JSON.stringify(current.data)) {
      return res.status(200).json({ unchanged: true, sha: current.sha })
    }
    const response = await fetch(CONTENTS_URL, {
      method: 'PUT',
      headers: { ...githubHeaders(), 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        message: 'Update current website homepage from protected admin',
        branch: 'main',
        sha: current.sha,
        content: Buffer.from(JSON.stringify(clean, null, 2) + '\n').toString('base64')
      })
    })
    if (response.status === 409 || response.status === 422) {
      return res.status(409).json({ error: 'GitHub 發布衝突，請重新載入後再試。' })
    }
    if (!response.ok) return res.status(502).json({ error: 'GitHub 發布失敗，請檢查 Token 權限與到期日。' })
    const result = await response.json()
    return res.status(200).json({ sha: result.content.sha, commitUrl: result.commit.html_url })
  } catch {
    return res.status(502).json({ error: 'GitHub 請求失敗或逾時。請重新載入確認是否已發布，再重試。' })
  }
}

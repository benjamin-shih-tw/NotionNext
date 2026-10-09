import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'

const base = 'https://benjaminshih.vercel.app'
async function request(path, options = {}) {
  return fetch(base + path, { ...options, cache: 'no-store', signal: AbortSignal.timeout(10000) })
}
function pageData(html) {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  return match ? JSON.parse(match[1]).props?.pageProps : null
}
let ready = false
let homepageProps
for (let attempt = 0; attempt < 72; attempt++) {
  try {
    const response = await request('/admin?deployment-check=' + Date.now())
    const homepage = await request('/?deployment-check=' + Date.now())
    homepageProps = homepage.ok ? pageData(await homepage.text()) : null
    if (response.status === 401 && response.headers.get('www-authenticate')?.includes('Homepage Admin') &&
        typeof homepageProps?.homepage?.heroTitle === 'string') {
      ready = true
      break
    }
  } catch {}
  if (attempt % 6 === 0) console.log('Waiting for the current website homepage editor deployment...')
  await delay(5000)
}
assert.ok(ready, 'The production domain serves the protected editor and the editable notebook homepage data')
for (const path of ['/admin', '/admin/nested.json', '/api/admin', '/api/admin/home']) {
  const response = await request(path)
  assert.equal(response.status, 401, path + ' must require authentication')
  assert.match(response.headers.get('cache-control'), /no-store/)
  console.log('PASS: production ' + path + ' returns 401 with no-store')
}
const invalid = await request('/admin', { headers: { authorization: 'Basic ' + Buffer.from('admin:invalid-smoke-test').toString('base64') } })
assert.equal(invalid.status, 401)
assert.equal((await request('/api/admin/home', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401)
assert.equal(typeof homepageProps.homepage.heroDescription, 'string')
assert.equal(typeof homepageProps.homepage.welcomeTitle, 'string')
console.log('PASS: production rejects invalid credentials and unauthorized publishing; the existing notebook homepage returns 200 with editable content')

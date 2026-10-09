import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'

const base = 'https://benjaminshih.vercel.app'
async function request(path, options = {}) {
  return fetch(base + path, { ...options, cache: 'no-store', signal: AbortSignal.timeout(10000) })
}
let ready = false
for (let attempt = 0; attempt < 72; attempt++) {
  try {
    const response = await request('/admin?deployment-check=' + Date.now())
    if (response.status === 401 && response.headers.get('www-authenticate')?.includes('Homepage Admin')) {
      ready = true
      break
    }
  } catch {}
  if (attempt % 6 === 0) console.log('Waiting for the current website homepage editor deployment...')
  await delay(5000)
}
assert.ok(ready, 'The production domain serves the new protected /admin route')
for (const path of ['/admin', '/admin/nested.json', '/api/admin', '/api/admin/home']) {
  const response = await request(path)
  assert.equal(response.status, 401, path + ' must require authentication')
  assert.match(response.headers.get('cache-control'), /no-store/)
  console.log('PASS: production ' + path + ' returns 401 with no-store')
}
const invalid = await request('/admin', { headers: { authorization: 'Basic ' + Buffer.from('admin:invalid-smoke-test').toString('base64') } })
assert.equal(invalid.status, 401)
assert.equal((await request('/api/admin/home', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401)
const homepage = await request('/')
assert.equal(homepage.status, 200)
assert.match(await homepage.text(), /claude-profile-home/)
console.log('PASS: production rejects invalid credentials and unauthorized publishing; the existing Claude homepage returns 200')

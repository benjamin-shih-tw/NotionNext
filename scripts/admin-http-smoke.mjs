import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'

const base = 'http://localhost:3100'
async function check(password) {
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3100'], {
    env: { ...process.env, ADMIN_PASSWORD: password, GITHUB_TOKEN: '' }, stdio: 'inherit'
  })
  try {
    let ready = false
    for (let attempt = 0; attempt < 120; attempt++) {
      if (server.exitCode !== null) throw new Error('Server exited before readiness')
      try { await fetch(base + '/admin'); ready = true; break } catch {}
      await delay(250)
    }
    assert.ok(ready, 'Server ready')
    for (const path of ['/admin', '/admin/nested.json', '/api/admin', '/api/admin/home', '/api/admin/nested']) {
      for (const authorization of ['', 'Basic invalid', 'Basic ' + Buffer.from('admin:incorrect').toString('base64')]) {
        const response = await fetch(base + path, { headers: { authorization } })
        assert.equal(response.status, 401, path + ' requires authentication')
        assert.match(response.headers.get('cache-control'), /no-store/)
      }
    }
    assert.equal((await fetch(base + '/api/admin/home', { method: 'PUT', body: '{}' })).status, 401)
    assert.equal((await fetch(base + '/admin', {
      headers: { 'x-middleware-subrequest': 'middleware:middleware:middleware:middleware:middleware' }
    })).status, 401)
    const buildId = (await readFile('.next/BUILD_ID', 'utf8')).trim()
    assert.equal((await fetch(base + '/_next/data/' + buildId + '/zh-CN/admin.json')).status, 401)
    if (password) {
      const authorization = 'Basic ' + Buffer.from('admin:' + password).toString('base64')
      const page = await fetch(base + '/admin', { headers: { authorization } })
      assert.equal(page.status, 200)
      assert.match(await page.text(), /首頁編輯後台/)
      assert.equal((await fetch(base + '/api/admin/home', { headers: { authorization } })).status, 503)
      assert.equal((await fetch(base + '/api/admin/home', {
        method: 'PUT', headers: { authorization, origin: 'https://other.invalid', 'Content-Type': 'application/json' }, body: '{}'
      })).status, 403)
      assert.equal((await fetch(base + '/api/admin/home', {
        method: 'PUT', headers: { authorization, origin: base, 'Content-Type': 'application/json' }, body: '{}'
      })).status, 503)
    }
  } finally {
    if (server.exitCode === null) {
      const stopped = once(server, 'exit')
      server.kill('SIGTERM')
      await stopped
    }
  }
}
await check('')
await check(randomBytes(32).toString('hex'))
console.log('PASS: homepage editor route, missing password, unauthorized APIs/data, middleware bypass defense, authenticated editor and CSRF')

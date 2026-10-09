// Shared by Edge middleware and server handlers. Never import into the editor.
export const ADMIN_REALM = 'Basic realm="Homepage Admin", charset="UTF-8"'

export async function isAdminAuthorized(header, password = process.env.ADMIN_PASSWORD) {
  if (!password || typeof header !== 'string' || !/^Basic /i.test(header) || header.length > 16384) return false
  try {
    const bytes = Uint8Array.from(atob(header.slice(6)), char => char.charCodeAt(0))
    const value = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    const separator = value.indexOf(':')
    if (separator < 0) return false
    const encode = new TextEncoder()
    const digest = async text => new Uint8Array(await crypto.subtle.digest('SHA-256', encode.encode(text)))
    const [actual, expected] = await Promise.all([
      digest(value),
      digest('admin:' + password)
    ])
    let difference = 0
    for (let index = 0; index < expected.length; index++) difference |= actual[index] ^ expected[index]
    return difference === 0
  } catch {
    return false
  }
}

export function setAdminHeaders(response) {
  response.setHeader('Cache-Control', 'private, no-store, max-age=0')
  response.setHeader('Vary', 'Authorization')
  response.setHeader('X-Robots-Tag', 'noindex, nofollow')
  response.setHeader('X-Frame-Options', 'DENY')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Access-Control-Allow-Origin', 'null')
  response.setHeader('Access-Control-Allow-Credentials', 'false')
}

export function rejectAdmin(response) {
  setAdminHeaders(response)
  response.setHeader('WWW-Authenticate', ADMIN_REALM)
  response.statusCode = 401
  response.end('Authentication required')
}

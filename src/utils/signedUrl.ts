import crypto from 'crypto'

const SIGNING_SECRET = process.env.UPLOAD_PASSWORD || process.env.NEXT_PUBLIC_SITE_TITLE || 'verceldrive-default'
const DEFAULT_TTL_MS = 15 * 60 * 1000 // 15 minutes

function hmacSign(data: string): string {
  return crypto.createHmac('sha256', SIGNING_SECRET).update(data).digest('base64url')
}

/**
 * Generate a signed URL token for a given path.
 * The token includes an expiration timestamp and HMAC signature.
 *
 * @param path The file path to sign
 * @param ttlMs Token time-to-live in milliseconds (default 15 min)
 * @returns A signed token string: `expires.signature`
 */
export function signPath(path: string, ttlMs: number = DEFAULT_TTL_MS): string {
  const expires = Date.now() + ttlMs
  const payload = `${path}\n${expires}`
  const signature = hmacSign(payload)
  return `${expires}.${signature}`
}

/**
 * Verify a signed URL token for a given path.
 * Returns true if the token is valid and not expired.
 *
 * @param path The file path that was signed
 * @param token The token string to verify (`expires.signature`)
 * @returns Whether the token is valid
 */
export function verifySignedPath(path: string, token: string): boolean {
  if (!token || typeof token !== 'string') return false

  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [expiresStr, signature] = parts
  const expires = Number(expiresStr)

  if (!Number.isFinite(expires) || expires <= Date.now()) return false

  const payload = `${path}\n${expires}`
  const expected = hmacSign(payload)

  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)

  if (sigBuf.length !== expBuf.length) return false

  try {
    return crypto.timingSafeEqual(sigBuf, expBuf)
  } catch {
    return false
  }
}

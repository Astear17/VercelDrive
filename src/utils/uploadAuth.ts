import crypto from 'crypto'

import type { NextApiRequest, NextApiResponse } from 'next'

const cookieName = 'vd_upload_auth'
const ttlMs = 30 * 60 * 1000

function getSecret(): string {
  return process.env.UPLOAD_PASSWORD || ''
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

function parseCookies(cookieHeader = ''): Record<string, string> {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map(cookie => cookie.trim())
      .filter(Boolean)
      .map(cookie => {
        const [name, ...value] = cookie.split('=')
        return [name, decodeURIComponent(value.join('='))]
      })
  )
}

export function uploadPasswordConfigured(): boolean {
  return getSecret().length > 0
}

export function verifyUploadPassword(password: unknown): boolean {
  const secret = getSecret()
  if (typeof password !== 'string' || !secret) {
    return false
  }

  const candidate = Buffer.from(password)
  const expected = Buffer.from(secret)

  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected)
}

export function setUploadAuthCookie(res: NextApiResponse): void {
  const expires = Date.now() + ttlMs
  const nonce = crypto.randomBytes(16).toString('base64url')
  const payload = `${expires}.${nonce}`
  const token = `${payload}.${sign(payload)}`
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : ''

  res.setHeader(
    'Set-Cookie',
    `${cookieName}=${encodeURIComponent(token)}; Max-Age=${Math.floor(
      ttlMs / 1000
    )}; Path=/; HttpOnly;${secure} SameSite=Strict`
  )
}

export function hasUploadAuth(req: NextApiRequest): boolean {
  if (!uploadPasswordConfigured()) {
    return false
  }

  const token = parseCookies(req.headers.cookie)[cookieName]
  if (!token) {
    return false
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return false
  }

  const [expires, nonce, signature] = parts
  const payload = `${expires}.${nonce}`
  const expected = sign(payload)
  const candidate = Buffer.from(signature)
  const signed = Buffer.from(expected)

  return Number(expires) > Date.now() && candidate.length === signed.length && crypto.timingSafeEqual(candidate, signed)
}

export function requireUploadAuth(req: NextApiRequest, res: NextApiResponse): boolean {
  if (!uploadPasswordConfigured()) {
    res.status(503).json({ error: 'Upload password is not configured.' })
    return false
  }

  if (!hasUploadAuth(req)) {
    res.status(401).json({ error: 'Upload authorization required.' })
    return false
  }

  return true
}

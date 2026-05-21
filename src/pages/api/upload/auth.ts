import type { NextApiRequest, NextApiResponse } from 'next'

import { setUploadAuthCookie, uploadPasswordConfigured, verifyUploadPassword } from '../../../utils/uploadAuth'

const failedAttempts = new Map<string, { count: number; lastAttempt: number }>()

function getClientKey(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  return Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0] || req.socket.remoteAddress || 'unknown'
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  if (!uploadPasswordConfigured()) {
    res.status(503).json({ error: 'Upload password is not configured.' })
    return
  }

  const clientKey = getClientKey(req)
  const record = failedAttempts.get(clientKey)
  if (record && Date.now() - record.lastAttempt < 5 * 60 * 1000) {
    await delay(Math.min(2000, record.count * 250))
  }

  if (!verifyUploadPassword(req.body?.password)) {
    const next = { count: (record?.count || 0) + 1, lastAttempt: Date.now() }
    failedAttempts.set(clientKey, next)
    res.status(401).json({ error: 'Invalid upload credentials.' })
    return
  }

  failedAttempts.delete(clientKey)
  setUploadAuthCookie(res)
  res.status(200).json({ ok: true })
}

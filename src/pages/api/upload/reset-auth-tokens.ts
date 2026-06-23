import type { NextApiRequest, NextApiResponse } from 'next'

import { clearOdAuthTokens } from '../../../utils/odAuthTokenStore'
import { requireUploadAuth } from '../../../utils/uploadAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  // CSRF protection: only allow same-origin requests
  const origin = req.headers.origin || req.headers.referer || ''
  const host = req.headers.host || ''
  if (host && !origin.includes(host)) {
    res.status(403).json({ error: 'Forbidden: cross-origin request rejected.' })
    return
  }

  if (!requireUploadAuth(req, res)) {
    return
  }

  res.setHeader('Cache-Control', 'no-store')

  await clearOdAuthTokens()
  res.status(200).json({ ok: true })
}

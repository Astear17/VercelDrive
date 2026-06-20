import type { NextApiRequest, NextApiResponse } from 'next'

import { clearOdAuthTokens } from '../../../utils/odAuthTokenStore'
import { requireUploadAuth } from '../../../utils/uploadAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  if (!requireUploadAuth(req, res)) {
    return
  }

  res.setHeader('Cache-Control', 'no-store')

  await clearOdAuthTokens()
  res.status(200).json({ ok: true })
}

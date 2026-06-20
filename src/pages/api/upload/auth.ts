import type { NextApiRequest, NextApiResponse } from 'next'

import { setUploadAuthCookie, uploadPasswordConfigured, verifyUploadPassword } from '../../../utils/uploadAuth'
import { checkRateLimit, recordFailedAttempt, clearFailedAttempts } from '../../../utils/rateLimit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  if (!uploadPasswordConfigured()) {
    res.status(503).json({ error: 'Upload password is not configured.' })
    return
  }

  if (!(await checkRateLimit(req, res))) {
    return
  }

  if (!verifyUploadPassword(req.body?.password)) {
    recordFailedAttempt(req)
    res.status(401).json({ error: 'The password is incorrect. Please try again.' })
    return
  }

  clearFailedAttempts(req)
  setUploadAuthCookie(res)
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ ok: true })
}

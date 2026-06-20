import { posix as pathPosix } from 'path'

import type { NextApiRequest, NextApiResponse } from 'next'

import { getAccessToken, checkAuthRoute, encodePath } from '.'
import { signPath } from '../../utils/signedUrl'

const SIGNED_URL_TTL_MS = 15 * 60 * 1000

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const { path = '/' } = req.body || {}

  if (typeof path !== 'string') {
    res.status(400).json({ error: 'Path is required.' })
    return
  }

  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path)).replace(/\/$/, '')

  const accessToken = await getAccessToken()
  if (!accessToken) {
    res.status(403).json({ error: 'No access token.' })
    return
  }

  // Verify the requester has access to the path (including protected route auth)
  const odTokenHeader = (req.headers['od-protected-token'] as string) || ''
  const { code, message } = await checkAuthRoute(cleanPath, accessToken, odTokenHeader)

  if (code !== 200) {
    res.status(code).json({ error: message })
    return
  }

  const token = signPath(cleanPath, SIGNED_URL_TTL_MS)

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    path: cleanPath,
    token,
    expires: Date.now() + SIGNED_URL_TTL_MS,
  })
}

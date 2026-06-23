import { posix as pathPosix } from 'path'

import axios from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'

import apiConfig from '../../../config/api.config'
import { encodePath, getAccessToken } from '.'
import { requireUploadAuth, verifyUploadPassword, setUploadAuthCookie, hasUploadAuth, uploadPasswordConfigured } from '../../utils/uploadAuth'
import { checkRateLimit, recordFailedAttempt, clearFailedAttempts } from '../../utils/rateLimit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
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

  if (!uploadPasswordConfigured()) {
    res.status(503).json({ error: 'Upload password is not configured.' })
    return
  }

  if (!(await checkRateLimit(req, res))) {
    return
  }

  // Accept auth via cookie OR password in body
  const authenticated = hasUploadAuth(req)
  const { path, password } = req.body || {}

  if (!authenticated) {
    if (!password) {
      res.status(401).json({ error: 'Authorization required. Provide the upload password.' })
      return
    }

    if (!verifyUploadPassword(password)) {
      recordFailedAttempt(req)
      res.status(401).json({ error: 'The password is incorrect. Please try again.' })
      return
    }

    clearFailedAttempts(req)
    setUploadAuthCookie(res)
  }

  if (typeof path !== 'string') {
    res.status(400).json({ error: 'Path is required.' })
    return
  }

  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path)).replace(/\/$/, '')
  if (!cleanPath || cleanPath === '/') {
    res.status(400).json({ error: 'Refusing to delete the drive root.' })
    return
  }

  let accessToken = ''
  try {
    accessToken = await getAccessToken()
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to get access token.' })
    return
  }

  if (!accessToken) {
    res.status(403).json({ error: 'No access token. Re-authenticate with read/write Graph scopes.' })
    return
  }

  try {
    await axios.delete(`${apiConfig.driveApi}/root${encodePath(cleanPath)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({ ok: true })
  } catch (error: any) {
    const status = error?.response?.status || 500
    const graphError = error?.response?.data?.error
    const code = graphError?.code
    const message = graphError?.message || error?.response?.data || 'Failed to delete item.'

    if (status === 403 || code === 'accessDenied' || /access denied/i.test(String(message))) {
      res.status(403).json({
        error:
          'Microsoft Graph denied delete access. Add delegated permission Files.ReadWrite.All, reset stored OAuth tokens, then authenticate VercelDrive again.',
        code: code || 'accessDenied',
        graphMessage: message,
      })
      return
    }

    res.status(status).json({ error: message, code })
  }
}

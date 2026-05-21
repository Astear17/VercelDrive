import { posix as pathPosix } from 'path'

import axios from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'

import apiConfig from '../../../config/api.config'
import { encodePath, getAccessToken } from '.'
import { requireUploadAuth } from '../../utils/uploadAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  if (!requireUploadAuth(req, res)) {
    return
  }

  const { path } = req.body || {}
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

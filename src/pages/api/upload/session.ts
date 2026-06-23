import { posix as pathPosix } from 'path'

import axios from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'

import apiConfig from '../../../../config/api.config'
import { encodePath, getAccessToken } from '..'
import { getConflictBehavior, normalizeUploadPath } from '../../../utils/uploadPath'
import { requireUploadAuth } from '../../../utils/uploadAuth'

async function ensureFolderPath(accessToken: string, targetFolder: string, folderParts: string[]) {
  let current = targetFolder

  for (const folderName of folderParts) {
    const parentPath = current
    current = pathPosix.join(current, folderName)

    try {
      await axios.get(`${apiConfig.driveApi}/root${encodePath(current)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { select: 'id,folder' },
      })
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        throw error
      }

      await axios.post(
        `${apiConfig.driveApi}/root${encodePath(parentPath)}${encodePath(parentPath) === '' ? '' : ':'}/children`,
        {
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'fail',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
    }
  }
}

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

  const { targetPath = '/', relativePath = '', size, lastModified } = req.body || {}

  let uploadPath
  try {
    uploadPath = normalizeUploadPath(targetPath, relativePath)
  } catch {
    res.status(400).json({ error: 'Invalid target path.' })
    return
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    res.status(403).json({ error: 'No access token. Re-authenticate with read/write Graph scopes.' })
    return
  }

  try {
    await ensureFolderPath(accessToken, uploadPath.targetFolder, uploadPath.folderParts)

    if (size === 0) {
      await axios.put(`${apiConfig.driveApi}/root${encodePath(uploadPath.fullPath)}:/content`, '', {
        params: { '@microsoft.graph.conflictBehavior': getConflictBehavior() },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
        },
      })

      res.status(200).json({ completed: true, size })
      return
    }

    const item: Record<string, any> = {
      '@microsoft.graph.conflictBehavior': getConflictBehavior(),
    }

    if (typeof lastModified === 'number' && Number.isFinite(lastModified)) {
      item.fileSystemInfo = { lastModifiedDateTime: new Date(lastModified).toISOString() }
    }

    const { data } = await axios.post(
      `${apiConfig.driveApi}/root${encodePath(uploadPath.fullPath)}:/createUploadSession`,
      { item },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    res.status(200).json({
      uploadUrl: data.uploadUrl,
      expirationDateTime: data.expirationDateTime,
      nextExpectedRanges: data.nextExpectedRanges,
      size,
    })
  } catch (error: any) {
    const status = error?.response?.status || 500
    const graphError = error?.response?.data?.error
    const code = graphError?.code
    const message = graphError?.message || error?.response?.data || 'Failed to create upload session.'

    if (status === 403 || code === 'accessDenied' || /access denied/i.test(String(message))) {
      res.status(403).json({
        error:
          'Microsoft Graph denied upload access. Add delegated permission Files.ReadWrite.All, grant consent if required, reset stored OAuth tokens, then authenticate VercelDrive again.',
        code: code || 'accessDenied',
        graphMessage: message,
      })
      return
    }

    res.status(status).json({ error: message, code })
  }
}

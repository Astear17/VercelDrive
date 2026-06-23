import { posix as pathPosix } from 'path'

import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

import { driveApi } from '../../../config/api.config'
import { encodePath, getAccessToken, checkAuthRoute } from '.'
import { verifySignedPath } from '../../utils/signedUrl'
import { isPersonalVaultPath } from '../../utils/personalVault'
import { buildContentDispositionInline } from '../../utils/contentDisposition'

function resolveAuthToken(
  req: NextApiRequest,
  cleanPath: string
): { token: string; via: 'header' | 'signed' | 'legacy' } {
  const rawHeader = req.headers['od-protected-token']
  if (typeof rawHeader === 'string' && rawHeader) {
    return { token: rawHeader, via: 'header' }
  }

  const { token: signedToken } = req.query
  const signedParam = Array.isArray(signedToken) ? signedToken[0] : signedToken
  if (signedParam && verifySignedPath(cleanPath, signedParam)) {
    return { token: '', via: 'signed' }
  }

  const { odpt } = req.query
  const odptParam = Array.isArray(odpt) ? odpt[0] : odpt
  if (odptParam) {
    return { token: odptParam, via: 'legacy' }
  }

  return { token: '', via: 'header' }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    res.status(403).json({ error: 'No access token.' })
    return
  }

  const { path = '/' } = req.query

  if (path === '[...path]') {
    res.status(400).json({ error: 'No path specified.' })
    return
  }

  if (typeof path !== 'string') {
    res.status(400).json({ error: 'Path query invalid.' })
    return
  }

  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path))

  if (isPersonalVaultPath(cleanPath)) {
    res.status(404).json({ error: 'Personal Vault is not available in VercelDrive.' })
    return
  }

  const { token, via } = resolveAuthToken(req, cleanPath)

  if (via !== 'signed') {
    const { code, message } = await checkAuthRoute(cleanPath, accessToken, token)
    if (code !== 200) {
      res.status(code).json({ error: message })
      return
    }
  }

  try {
    const requestUrl = `${driveApi}/root${encodePath(cleanPath)}`
    const { data } = await axios.get(requestUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        select: 'id,name,size,@microsoft.graph.downloadUrl',
      },
    })

    if (!('@microsoft.graph.downloadUrl' in data)) {
      res.status(404).json({ error: 'No download url found.' })
      return
    }

    const downloadUrl = data['@microsoft.graph.downloadUrl'] as string
    const fileName = (data['name'] as string) || pathPosix.basename(cleanPath) || 'file'

    const upstream = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      maxRedirects: 5,
      validateStatus: s => s >= 200 && s < 300,
    })

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Content-Disposition', buildContentDispositionInline(fileName))
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cache-Control', 'no-store')

    if (upstream.headers['content-length']) {
      res.setHeader('Content-Length', String(upstream.headers['content-length']))
    }

    res.status(200).send(Buffer.from(upstream.data))
    return
  } catch (error: any) {
    res
      .status(error?.response?.status ?? 500)
      .json({ error: error?.response?.data ?? 'Internal server error.' })
    return
  }
}

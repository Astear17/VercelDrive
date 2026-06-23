import { posix as pathPosix } from 'path'

import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import Cors from 'cors'

import { driveApi } from '../../../config/api.config'
import { encodePath, getAccessToken, checkAuthRoute } from '.'
import { verifySignedPath } from '../../utils/signedUrl'
import { isPersonalVaultPath } from '../../utils/personalVault'
import { buildContentDisposition } from '../../utils/contentDisposition'

// CORS middleware for raw links
export function runCorsMiddleware(req: NextApiRequest, res: NextApiResponse) {
  const cors = Cors({ methods: ['GET', 'HEAD'] })
  return new Promise<void>((resolve, reject) => {
    cors(req, res, result => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve()
    })
  })
}

/**
 * Resolve auth token from request. Supports:
 * 1. od-protected-token header (primary, for same-origin requests)
 * 2. Signed URL token via `token` query param (for shareable links, short-lived)
 * 3. Legacy `odpt` query param (backward-compatible, deprecated)
 */
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
    // Signed URL is valid — the path was already authorized when the token was generated
    return { token: '', via: 'signed' }
  }

  // Legacy odpt fallback (deprecated — new code should use signed URLs)
  const { odpt } = req.query
  const odptParam = Array.isArray(odpt) ? odpt[0] : odpt
  if (odptParam) {
    return { token: odptParam, via: 'legacy' }
  }

  return { token: '', via: 'header' }
}

/**
 * Derive a display filename from the request path.
 */
function filenameFromPath(cleanPath: string): string {
  const base = pathPosix.basename(cleanPath)
  return base || 'download'
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

  // Block direct access to Personal Vault
  if (isPersonalVaultPath(cleanPath)) {
    res.status(404).json({ error: 'Personal Vault is not available in VercelDrive.' })
    return
  }

  const { token, via } = resolveAuthToken(req, cleanPath)

  // If signed URL is valid, skip .password check entirely
  if (via !== 'signed') {
    const { code, message } = await checkAuthRoute(cleanPath, accessToken, token)
    if (code !== 200) {
      res.status(code).json({ error: message })
      return
    }

    if (message !== '') {
      res.setHeader('Cache-Control', 'no-store')
    }
  }

  await runCorsMiddleware(req, res)

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
    const fileName = (data['name'] as string) || filenameFromPath(cleanPath)
    const fileSize = typeof data['size'] === 'number' ? data['size'] : undefined

    // Build upstream request headers — forward Range for streaming
    const upstreamHeaders: Record<string, string> = {}
    const rangeHeader = req.headers.range
    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader
    }

    const upstream = await axios.get(downloadUrl, {
      headers: upstreamHeaders,
      responseType: 'stream',
      maxRedirects: 5,
      validateStatus: s => (s >= 200 && s < 300) || s === 206,
    })

    const upstreamStatus = upstream.status
    const upstreamHeadersResp = upstream.headers

    // Set download filename headers
    res.setHeader('Content-Disposition', buildContentDisposition(fileName))

    // Copy relevant headers from upstream
    const contentType = String(upstreamHeadersResp['content-type'] || 'application/octet-stream')
    res.setHeader('Content-Type', contentType)

    if (upstreamHeadersResp['accept-ranges']) {
      res.setHeader('Accept-Ranges', String(upstreamHeadersResp['accept-ranges']))
    }

    if (upstreamStatus === 206) {
      // Partial content — range request
      res.status(206)
      if (upstreamHeadersResp['content-range']) {
        res.setHeader('Content-Range', String(upstreamHeadersResp['content-range']))
      }
      if (upstreamHeadersResp['content-length']) {
        res.setHeader('Content-Length', String(upstreamHeadersResp['content-length']))
      }
    } else {
      // Full content
      if (upstreamHeadersResp['content-length']) {
        res.setHeader('Content-Length', String(upstreamHeadersResp['content-length']))
      } else if (fileSize !== undefined) {
        res.setHeader('Content-Length', String(fileSize))
      }
    }

    res.setHeader('Cache-Control', 'no-store')

    upstream.data.pipe(res)
    return
  } catch (error: any) {
    res
      .status(error?.response?.status ?? 500)
      .json({ error: error?.response?.data ?? 'Internal server error.' })
    return
  }
}

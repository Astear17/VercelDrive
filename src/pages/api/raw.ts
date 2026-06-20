import { posix as pathPosix } from 'path'

import type { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosResponseHeaders } from 'axios'
import Cors from 'cors'

import { driveApi, cacheControlHeader } from '../../../config/api.config'
import { encodePath, getAccessToken, checkAuthRoute } from '.'
import { verifySignedPath } from '../../utils/signedUrl'

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    res.status(403).json({ error: 'No access token.' })
    return
  }

  const { path = '/', proxy = false } = req.query

  if (path === '[...path]') {
    res.status(400).json({ error: 'No path specified.' })
    return
  }

  if (typeof path !== 'string') {
    res.status(400).json({ error: 'Path query invalid.' })
    return
  }

  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path))
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
        select: 'id,size,@microsoft.graph.downloadUrl',
      },
    })

    if ('@microsoft.graph.downloadUrl' in data) {
      if (proxy && 'size' in data && data['size'] < 4194304) {
        const { headers, data: stream } = await axios.get(
          data['@microsoft.graph.downloadUrl'] as string,
          { responseType: 'stream' }
        )

        headers['Cache-Control'] = 'no-store'
        res.writeHead(200, headers as AxiosResponseHeaders)
        stream.pipe(res)
      } else {
        res.redirect(data['@microsoft.graph.downloadUrl'])
      }
    } else {
      res.status(404).json({ error: 'No download url found.' })
    }

    return
  } catch (error: any) {
    res
      .status(error?.response?.status ?? 500)
      .json({ error: error?.response?.data ?? 'Internal server error.' })
    return
  }
}

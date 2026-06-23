import { posix as pathPosix } from 'path'

import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

import { driveApi } from '../../config/api.config'
import { encodePath, getAccessToken, checkAuthRoute } from '../pages/api'
import { verifySignedPath } from './signedUrl'
import { isPersonalVaultPath } from './personalVault'

/**
 * Resolve auth token from request. Supports:
 * 1. od-protected-token header (primary, for same-origin requests)
 * 2. Signed URL token via `token` query param (for shareable links, short-lived)
 * 3. Legacy `odpt` query param (backward-compatible, deprecated)
 */
export function resolveAuthToken(
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

/**
 * Validate the request path and return a clean path, or send an error response.
 * Returns null if the path is invalid (response already sent).
 */
export function validatePath(req: NextApiRequest, res: NextApiResponse): string | null {
  const { path = '/' } = req.query

  if (path === '[...path]') {
    res.status(400).json({ error: 'No path specified.' })
    return null
  }

  if (typeof path !== 'string') {
    res.status(400).json({ error: 'Path query invalid.' })
    return null
  }

  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path))

  if (isPersonalVaultPath(cleanPath)) {
    res.status(404).json({ error: 'Personal Vault is not available in VercelDrive.' })
    return null
  }

  return cleanPath
}

/**
 * Get access token or send a 403 error. Returns null if no token (response already sent).
 */
export async function requireAccessToken(res: NextApiResponse): Promise<string | null> {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    res.status(403).json({ error: 'No access token.' })
    return null
  }
  return accessToken
}

/**
 * Authenticate the request against protected routes, or send an error response.
 * Returns true if authenticated, false if rejected (response already sent).
 */
export async function authenticateRequest(
  req: NextApiRequest,
  res: NextApiResponse,
  cleanPath: string,
  accessToken: string
): Promise<boolean> {
  const { token, via } = resolveAuthToken(req, cleanPath)

  if (via !== 'signed') {
    const { code, message } = await checkAuthRoute(cleanPath, accessToken, token)
    if (code !== 200) {
      res.status(code).json({ error: message })
      return false
    }

    if (message !== '') {
      res.setHeader('Cache-Control', 'no-store')
    }
  }

  return true
}

/**
 * Fetch the download URL for a file from Microsoft Graph.
 * Returns the download URL, or null if not found (response already sent).
 */
export async function fetchDownloadUrl(
  res: NextApiResponse,
  accessToken: string,
  cleanPath: string
): Promise<{ downloadUrl: string; fileName: string; fileSize?: number } | null> {
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
      return null
    }

    return {
      downloadUrl: data['@microsoft.graph.downloadUrl'] as string,
      fileName: (data['name'] as string) || pathPosix.basename(cleanPath) || 'file',
      fileSize: typeof data['size'] === 'number' ? data['size'] : undefined,
    }
  } catch (error: any) {
    res
      .status(error?.response?.status ?? 500)
      .json({ error: error?.response?.data ?? 'Internal server error.' })
    return null
  }
}

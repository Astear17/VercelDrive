import type { OdThumbnail } from '../../types'

import { posix as pathPosix } from 'path'

import axios from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'

import { checkAuthRoute, encodePath, getAccessToken } from '.'
import apiConfig from '../../../config/api.config'
import { verifySignedPath } from '../../utils/signedUrl'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    res.status(403).json({ error: 'No access token.' })
    return
  }

  const { path = '', size = 'medium', odpt = '', token: signedToken } = req.query

  if (size !== 'large' && size !== 'medium' && size !== 'small') {
    res.status(400).json({ error: 'Invalid size.' })
    return
  }
  if (path === '[...path]') {
    res.status(400).json({ error: 'No path specified.' })
    return
  }
  if (typeof path !== 'string') {
    res.status(400).json({ error: 'Path query invalid.' })
    return
  }
  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path))

  // Check signed URL first
  const signedParam = Array.isArray(signedToken) ? signedToken[0] : signedToken
  const isSignedUrl = signedParam ? verifySignedPath(cleanPath, signedParam) : false

  if (!isSignedUrl) {
    // Legacy odpt or header-based auth
    const rawHeader = req.headers['od-protected-token']
    const odTokenHeader = typeof rawHeader === 'string' && rawHeader
      ? rawHeader
      : Array.isArray(odpt) ? odpt[0] : odpt

    const { code, message } = await checkAuthRoute(cleanPath, accessToken, odTokenHeader)
    if (code !== 200) {
      res.status(code).json({ error: message })
      return
    }

    // Protected routes must not be served from cache
    if (message !== '') {
      res.setHeader('Cache-Control', 'no-store')
    } else {
      res.setHeader('Cache-Control', apiConfig.cacheControlHeader)
    }
  } else {
    // Valid signed URL — no-store for security
    res.setHeader('Cache-Control', 'no-store')
  }

  const requestPath = encodePath(cleanPath)
  const requestUrl = `${apiConfig.driveApi}/root${requestPath}`
  const isRoot = requestPath === ''

  try {
    const { data } = await axios.get(`${requestUrl}${isRoot ? '' : ':'}/thumbnails`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const thumbnailUrl = data.value && data.value.length > 0 ? (data.value[0] as OdThumbnail)[size].url : null
    if (thumbnailUrl) {
      res.redirect(thumbnailUrl)
    } else {
      res.status(404).json({ error: 'No thumbnail available for this item.' })
    }
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json({ error: error?.response?.data ?? 'Internal server error.' })
  }
  return
}

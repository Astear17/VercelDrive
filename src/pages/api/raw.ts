import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import Cors from 'cors'

import { driveApi } from '../../../config/api.config'
import { encodePath } from '.'
import { buildContentDisposition } from '../../utils/contentDisposition'
import { validatePath, requireAccessToken, authenticateRequest, fetchDownloadUrl, resolveAuthToken } from '../../utils/apiHelpers'

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const accessToken = await requireAccessToken(res)
  if (!accessToken) return

  const cleanPath = validatePath(req, res)
  if (!cleanPath) return

  if (!(await authenticateRequest(req, res, cleanPath, accessToken))) return

  await runCorsMiddleware(req, res)

  const file = await fetchDownloadUrl(res, accessToken, cleanPath)
  if (!file) return

  try {
    const upstreamHeaders: Record<string, string> = {}
    const rangeHeader = req.headers.range
    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader
    }

    const upstream = await axios.get(file.downloadUrl, {
      headers: upstreamHeaders,
      responseType: 'stream',
      maxRedirects: 5,
      validateStatus: s => (s >= 200 && s < 300) || s === 206,
    })

    const upstreamStatus = upstream.status
    const uh = upstream.headers

    res.setHeader('Content-Disposition', buildContentDisposition(file.fileName))

    const contentType = String(uh['content-type'] || 'application/octet-stream')
    res.setHeader('Content-Type', contentType)

    if (uh['accept-ranges']) {
      res.setHeader('Accept-Ranges', String(uh['accept-ranges']))
    }

    if (upstreamStatus === 206) {
      res.status(206)
      if (uh['content-range']) {
        res.setHeader('Content-Range', String(uh['content-range']))
      }
      if (uh['content-length']) {
        res.setHeader('Content-Length', String(uh['content-length']))
      }
    } else {
      if (uh['content-length']) {
        res.setHeader('Content-Length', String(uh['content-length']))
      } else if (file.fileSize !== undefined) {
        res.setHeader('Content-Length', String(file.fileSize))
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

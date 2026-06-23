import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

import { buildContentDispositionInline } from '../../utils/contentDisposition'
import { validatePath, requireAccessToken, authenticateRequest, fetchDownloadUrl } from '../../utils/apiHelpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const accessToken = await requireAccessToken(res)
  if (!accessToken) return

  const cleanPath = validatePath(req, res)
  if (!cleanPath) return

  if (!(await authenticateRequest(req, res, cleanPath, accessToken))) return

  const file = await fetchDownloadUrl(res, accessToken, cleanPath)
  if (!file) return

  try {
    const upstream = await axios.get(file.downloadUrl, {
      responseType: 'arraybuffer',
      maxRedirects: 5,
      validateStatus: s => s >= 200 && s < 300,
    })

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Content-Disposition', buildContentDispositionInline(file.fileName))
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

import axios from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'

import { encodePath, getAccessToken } from '.'
import apiConfig from '../../../config/api.config'
import siteConfig from '../../../config/site.config'
import { filterPersonalVault } from '../../utils/personalVault'

/**
 * Sanitize the search query
 *
 * @param query User search query, which may contain special characters
 * @returns Sanitised query string, which:
 * - encodes the '<' and '>' characters,
 * - replaces '?' and '/' characters with ' ',
 * - replaces ''' with ''''
 * Reference: https://stackoverflow.com/questions/41491222/single-quote-escaping-in-microsoft-graph.
 */
function sanitiseQuery(query: string): string {
  const sanitisedQuery = query
    .replace(/'/g, "''")
    .replace(/</g, ' &lt; ')
    .replace(/>/g, ' &gt; ')
    .replace(/\?/g, ' ')
    .replace(/\//g, ' ')
  return encodeURIComponent(sanitisedQuery)
}

/**
 * Check if a search result item's parent path falls under any configured protected route.
 * Returns true if the item should be excluded from results.
 */
function isUnderProtectedRoute(item: any): boolean {
  const protectedRoutes = siteConfig.protectedRoutes as string[]
  if (!protectedRoutes.length) return false

  const parentPath: string = (item.parentReference?.path || '').toLowerCase()

  for (const route of protectedRoutes) {
    if (typeof route !== 'string') continue
    const normalisedRoute = route.toLowerCase().replace(/\/$/, '')
    if (parentPath.includes(normalisedRoute)) {
      return true
    }
  }
  return false
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q: searchQuery = '' } = req.query

  if (typeof searchQuery !== 'string') {
    res.status(200).json([])
    return
  }

  // Get access token from storage
  const accessToken = await getAccessToken()

  if (!accessToken) {
    res.status(403).json({ error: 'No access token.' })
    return
  }

  // Search results use short CDN cache
  res.setHeader('Cache-Control', apiConfig.cacheControlHeader)

  // Construct Microsoft Graph Search API URL, and perform search only under the base directory
  const searchRootPath = encodePath('/')
  const encodedPath = searchRootPath === '' ? searchRootPath : searchRootPath + ':'

  const searchApi = `${apiConfig.driveApi}/root${encodedPath}/search(q='${sanitiseQuery(searchQuery)}')`

  try {
    const { data } = await axios.get(searchApi, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        select: 'id,name,file,folder,parentReference,specialFolder',
        top: siteConfig.maxItems,
      },
    })

    // Filter out results from protected routes to prevent file name leakage
    const filteredResults = data.value.filter((item: any) => !isUnderProtectedRoute(item))

    res.status(200).json(filterPersonalVault(filteredResults))
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json({ error: error?.response?.data ?? 'Internal server error.' })
  }
  return
}

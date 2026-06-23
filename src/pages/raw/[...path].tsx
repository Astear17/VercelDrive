import { ParsedUrlQuery } from 'querystring'

import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

import { getStoredToken } from '../../utils/protectedRouteHandler'

function queryToPath(query?: ParsedUrlQuery): string {
  if (query) {
    const { path } = query
    if (!path) return '/'
    if (typeof path === 'string') return `/${encodeURIComponent(path)}`
    return `/${path.map(p => encodeURIComponent(p)).join('/')}`
  }
  return '/'
}

export default function RawView() {
  const { query } = useRouter()
  const path = queryToPath(query)
  const pathSegment = (query.path && Array.isArray(query.path) ? query.path[query.path.length - 1] : '') || 'raw'
  const hashedToken = getStoredToken(path)

  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setContent(null)
    setError(null)

    const url = `/api/raw-view/?path=${path}${hashedToken ? `&odpt=${hashedToken}` : ''}`

    fetch(url)
      .then(async res => {
        if (!res.ok) {
          const body = await res.text()
          setError(`${res.status} ${res.statusText}`)
          return
        }
        const text = await res.text()
        setContent(text)
      })
      .catch(e => setError(e.message))
  }, [path, hashedToken])

  return (
    <>
      <Head>
        <title>Raw: {pathSegment}</title>
      </Head>
      <div className="min-h-screen bg-gray-950 p-4 text-gray-200">
        {error && (
          <div className="mx-auto max-w-3xl rounded border border-red-800 bg-red-950 p-4 text-red-300">
            {error}
          </div>
        )}
        {content === null && !error && (
          <div className="mx-auto max-w-3xl text-gray-500">Loading...</div>
        )}
        {content !== null && (
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">
            {content}
          </pre>
        )}
      </div>
    </>
  )
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

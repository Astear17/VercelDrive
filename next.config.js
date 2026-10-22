const { i18n } = require('./next-i18next.config')

module.exports = {
  i18n,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/vi',
        destination: '/vi-VN',
        permanent: true
      },
      {
        source: '/vi/:path*',
        destination: '/vi-VN/:path*',
        permanent: true
      }
    ]
  },
  async rewrites() {
    return [
      // Normalize API requests so both /api/delete and /api/delete/ resolve to the same route.
      // Next.js trailingSlash mode can otherwise canonicalize a DELETE request to a trailing-slash URL,
      // causing 404s on API handlers that do not explicitly match the slash form.
      {
        source: '/api/:path*/',
        destination: '/api/:path*'
      }
    ]
  },
  // Required by Next i18n with API routes, otherwise API routes 404 when fetching without trailing slash
  trailingSlash: true
}

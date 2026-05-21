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
  // Required by Next i18n with API routes, otherwise API routes 404 when fetching without trailing slash
  trailingSlash: true
}

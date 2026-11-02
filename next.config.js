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
      {
        source: '/api/:path*/',
        destination: '/api/:path*'
      }
    ]
  },
  trailingSlash: false
}

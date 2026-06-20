import Document, { Head, Html, Main, NextScript } from 'next/document'

import siteConfig from '../../config/site.config'

class MyDocument extends Document {
  render() {
    const title = siteConfig.title || 'VercelDrive'
    const description = `Browse, preview, and download files from ${title}. A self-hosted OneDrive file browser.`

    return (
      <Html>
        <Head>
          <meta charSet="utf-8" />
          <meta name="description" content={description} />
          <meta property="og:type" content="website" />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:site_name" content={title} />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument

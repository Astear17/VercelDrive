import Document, { DocumentContext, Head, Html, Main, NextScript } from 'next/document'

import siteConfig from '../../config/site.config'

interface MyDocumentProps {
  ogImage: string
}

class MyDocument extends Document<MyDocumentProps> {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)

    const req = ctx.req
    const host = req?.headers['x-forwarded-host'] || req?.headers.host || process.env.VERCEL_URL || ''
    const protocol = req?.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https')
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`
    const ogImage = `${siteUrl}/images/branding.png`

    return { ...initialProps, ogImage }
  }

  render() {
    const { ogImage } = this.props
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
          <meta property="og:image" content={ogImage} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={ogImage} />
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

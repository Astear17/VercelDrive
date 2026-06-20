import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    clientId: process.env.CLIENT_ID || '',
    // clientSecret is intentionally omitted — never expose to the client
    userPrincipalName: process.env.USER_PRINCIPAL_NAME || '',
    baseDirectory: process.env.BASE_DIRECTORY || '/'
  })
}

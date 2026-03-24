/**
 * Configuration for API endpoints and authentication tokens.
 *
 * - If you use a normal OneDrive International account, you usually don’t need to change anything.
 * - If you are NOT the admin of a OneDrive for Business account, you may need your own clientId/clientSecret.
 *   Check the documentation for how to create them.
 * - If you use an E5 Developer OneDrive for Business account, your direct download links work differently.
 *   In that case, you must update directLinkRegex.
 */

module.exports = {
  // clientId and clientSecret are used for Microsoft Graph OAuth login.
  // If you use an E5 Developer account, put CLIENT_ID and CLIENT_SECRET in Vercel environment variables.
  // Personal OneDrive International users normally don’t need to change anything.

  // redirectUri is where Microsoft sends you back after login.
  // Personal OneDrive International users can keep this as-is.
  redirectUri: 'http://localhost',

  // OneDrive API endpoints.
  // These are correct for OneDrive International and E5 Developer accounts.
  // If you use OneDrive 21Vianet (世纪互联), you must replace these URLs.
  authApi: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  driveApi: 'https://graph.microsoft.com/v1.0/me/drive',

  // Required Microsoft Graph permissions.
  // Most users do not need to change this.
  scope: 'user.read files.read.all offline_access',

  // Cache-Control header for Vercel.
  // - max-age=0: browser does not cache
  // - s-maxage=60: Vercel edge cache stays fresh for 60 seconds
  // - stale-while-revalidate: old content can be shown while refreshing
  cacheControlHeader: 'max-age=0, s-maxage=60, stale-while-revalidate',
}

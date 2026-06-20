# Security Policy

## Security Model

VercelDrive uses a layered security model:

### OAuth Tokens

- Microsoft Graph OAuth tokens are stored in Redis (Upstash).
- Access tokens expire and are automatically refreshed using the stored refresh token.
- Tokens are transmitted from the OAuth wizard to the server using AES obfuscation (transport-only, not a persistent encryption layer).
- The `CLIENT_SECRET` is never exposed to the client. Token exchange happens server-side.

### Protected Folders

- Folders listed in `NEXT_PUBLIC_PROTECTED_ROUTES` require a password defined in a `.password` file inside that OneDrive folder.
- Passwords are SHA-256 hashed client-side before transmission. The raw password is never sent over the network.
- The server compares the hash of the `.password` file content with the submitted hash.
- Protected folder content is never cached (`Cache-Control: no-store`).

### Upload and Delete Authorization

- Upload and delete operations require the `UPLOAD_PASSWORD` environment variable.
- On successful password verification, the server sets an HMAC-signed, HttpOnly, Secure cookie (`vd_upload_auth`) with a 30-minute TTL.
- The HMAC is computed using the `UPLOAD_PASSWORD` as the signing key.
- Delete operations require explicit password entry in a confirmation dialog.
- All auth endpoints are rate-limited to prevent brute-force attacks.

### Signed URLs

- Raw file and thumbnail access for protected content supports short-lived signed URLs.
- Signed URLs use HMAC-SHA256 with a 15-minute expiration.
- Expired or tampered tokens are rejected server-side.
- Legacy `odpt` query parameter auth is still supported for backward compatibility but is deprecated.

### Rate Limiting

- In-memory per-IP rate limiting is applied to:
  - Upload authentication (`POST /api/upload/auth`)
  - File deletion (`DELETE /api/delete`)
- Failed attempts trigger progressive delays (250ms per attempt, up to 2s).
- After 10 failed attempts in a 5-minute window, the IP is blocked for 15 minutes (HTTP 429).

### Cache Strategy

- Public folder listings: short CDN cache (`s-maxage=60`)
- Protected routes: `no-store`
- Upload/delete/auth responses: `no-store`
- Raw file downloads for protected content: `no-store`

## Reporting a Vulnerability

If you discover a security vulnerability, please report it via [GitHub Issues](https://github.com/Astear17/VercelDrive/issues).

Do not open a public issue for critical vulnerabilities. Instead, contact the maintainers directly.

## Best Practices for Deployment

1. Use a strong, unique `UPLOAD_PASSWORD`.
2. Never prefix secrets with `NEXT_PUBLIC_` — those values are exposed in the browser.
3. Restrict access to the Vercel deployment and its environment variables.
4. Use `Files.ReadWrite.All` only if upload/delete is needed; prefer `Files.Read.All` for read-only deployments.
5. Rotate the `UPLOAD_PASSWORD` periodically.
6. Monitor Vercel function logs for unusual activity.

# Changelog

All notable changes to VercelDrive will be documented in this file.

## [0.2.0] - 2026-06-20

### Security

- **Signed URLs**: Raw file and thumbnail links now support short-lived HMAC-signed URLs (15-minute expiry) as a replacement for persistent token query parameters.
- **Delete authorization**: Deleting files now requires explicit upload password entry in a confirmation dialog. The server verifies the password before processing any delete request.
- **Rate limiting**: Added per-IP rate limiting to upload authentication, and delete endpoints. Too many failed attempts return HTTP 429 with a 15-minute block.
- **No client secret exposure**: Removed `CLIENT_SECRET` from the `/api/config` endpoint and OAuth wizard UI. Token exchange now happens entirely server-side.
- **Cache hardening**: Protected routes, raw file downloads, and all mutation endpoints now use `Cache-Control: no-store` to prevent sensitive content from being cached.

### Changed

- **Upload concurrency**: Multiple files now upload with a concurrency of 3 for better throughput.
- **Upload status display**: Improved status indicators with color-coded states (uploading, success, failed, cancelled).
- **Error messages**: All auth error messages are now professional and consistent.
- **SEO metadata**: Added Open Graph and Twitter Card meta tags. Improved page titles and descriptions for all routes.
- **Web manifest**: Fixed empty `name` and `short_name` in `site.webmanifest`.
- **Dependency cleanup**: Added `packageManager` and `engines` fields to `package.json`.

### Deprecated

- The `odpt` query parameter for raw file access is deprecated. Use signed URLs instead. Backward compatibility is maintained.

### Migration Notes

- No breaking changes. Existing deployments continue to work.
- The `odpt` query parameter is still supported but will be removed in a future version.
- New environment variable behavior: `CLIENT_SECRET` is no longer sent to the browser.
- The delete confirmation now requires the upload password. Users who previously deleted without confirmation will need to enter the password.

## [0.1.0] - 2026-01-01

### Initial Release

- OneDrive file browsing and preview
- File upload with chunked upload sessions
- Password-protected folders
- Multi-language support (7 locales)
- Dark mode
- Drag-and-drop uploads

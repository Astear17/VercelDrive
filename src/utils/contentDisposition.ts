/**
 * Strip CR, LF, and path separators from a filename to prevent header injection.
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[\r\n]/g, '')
    .replace(/[/\\]/g, '_')
    .replace(/["]/g, '_')
    .trim()
}

/**
 * Build a RFC 6266 / RFC 5987 Content-Disposition header value for attachment download.
 *
 * - `filename` provides a safe ASCII fallback for older browsers.
 * - `filename*` provides the full UTF-8 encoded name for modern browsers.
 *
 * @param originalName The original file name (may contain Unicode)
 * @returns Content-Disposition header value
 */
export function buildContentDisposition(originalName: string): string {
  const safe = sanitizeFilename(originalName)

  // ASCII-safe fallback: strip non-ASCII chars, keep extension
  const asciiFallback = safe.replace(/[^\x20-\x7E]/g, '_').replace(/_{2,}/g, '_')
  const finalAscii = asciiFallback || 'download'

  // RFC 5987 encoded UTF-8 filename
  const encoded = encodeURIComponent(safe)

  return `attachment; filename="${finalAscii}"; filename*=UTF-8''${encoded}`
}

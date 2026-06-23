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

function buildHeader(originalName: string, disposition: 'attachment' | 'inline'): string {
  const safe = sanitizeFilename(originalName)
  const asciiFallback = safe.replace(/[^\x20-\x7E]/g, '_').replace(/_{2,}/g, '_')
  const finalAscii = asciiFallback || 'download'
  const encoded = encodeURIComponent(safe)
  return `${disposition}; filename="${finalAscii}"; filename*=UTF-8''${encoded}`
}

/**
 * Build a RFC 6266 / RFC 5987 Content-Disposition header for attachment download.
 */
export function buildContentDisposition(originalName: string): string {
  return buildHeader(originalName, 'attachment')
}

/**
 * Build a RFC 6266 / RFC 5987 Content-Disposition header for inline display.
 */
export function buildContentDispositionInline(originalName: string): string {
  return buildHeader(originalName, 'inline')
}

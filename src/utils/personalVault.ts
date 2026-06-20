/**
 * OneDrive Personal Vault filter.
 *
 * Personal Vault is a Microsoft-protected area that requires identity
 * verification through OneDrive's own UI. VercelDrive intentionally
 * hides it from all listings and direct access.
 *
 * Detection uses the `specialFolder` facet when available, with a
 * name-based fallback for API responses that omit the facet.
 */

const PERSONAL_VAULT_NAMES = ['personal vault', 'kho lưu trữ cá nhân']

/**
 * Normalize a display name for comparison:
 * lowercase, trim whitespace, normalize Unicode (NFC).
 */
function normalise(name: string): string {
  return name.trim().toLowerCase().normalize('NFC')
}

/**
 * Check whether a drive item represents Personal Vault.
 *
 * Uses `specialFolder.name === 'Vault'` when the API provides the facet.
 * Falls back to case-insensitive name matching against known display names.
 *
 * Defensive: never assumes any specific property exists on the item.
 */
export function isPersonalVault(item: Record<string, any> | undefined | null): boolean {
  if (!item || typeof item !== 'object') return false

  // Primary: use the specialFolder facet if the Graph API provides it
  const specialFolderName = item?.specialFolder?.name
  if (typeof specialFolderName === 'string' && normalise(specialFolderName) === 'vault') {
    return true
  }

  // Fallback: name-based matching
  const name = item?.name
  if (typeof name === 'string') {
    const normalised = normalise(name)
    if (PERSONAL_VAULT_NAMES.includes(normalised)) {
      return true
    }
  }

  return false
}

/**
 * Check whether a path points to Personal Vault or is inside it.
 * Compares path segments case-insensitively.
 */
export function isPersonalVaultPath(cleanPath: string): boolean {
  if (!cleanPath) return false

  const segments = cleanPath.split('/').filter(Boolean)
  for (const segment of segments) {
    const decoded = normalise(decodeURIComponent(segment))
    if (PERSONAL_VAULT_NAMES.includes(decoded)) {
      return true
    }
  }

  return false
}

/**
 * Filter Personal Vault items out of an array of drive children.
 */
export function filterPersonalVault<T extends Record<string, any>>(items: T[]): T[] {
  return items.filter(item => !isPersonalVault(item))
}

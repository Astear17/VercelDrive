import { posix as pathPosix } from 'path'

const invalidOneDriveNameChars = /[<>:"/\\|?*\x00-\x1f]/

export type NormalizedUploadPath = {
  targetFolder: string
  relativePath: string
  fileName: string
  fullPath: string
  folderParts: string[]
}

function decodePathPart(part: string): string {
  try {
    return decodeURIComponent(part)
  } catch {
    return part
  }
}

function cleanParts(path: string): string[] {
  return path.replace(/\\/g, '/').split('/').map(decodePathPart).filter(Boolean)
}

function validatePart(part: string): void {
  if (part === '.' || part === '..' || part.trim() !== part || invalidOneDriveNameChars.test(part)) {
    throw new Error('Invalid upload path.')
  }
}

export function normalizeUploadPath(targetFolder: string, relativePath: string): NormalizedUploadPath {
  if (typeof targetFolder !== 'string' || typeof relativePath !== 'string') {
    throw new Error('Invalid upload path.')
  }

  const targetParts = cleanParts(targetFolder)
  const relativeParts = cleanParts(relativePath)

  if (relativeParts.length === 0) {
    throw new Error('Invalid upload path.')
  }

  for (const part of [...targetParts, ...relativeParts]) {
    validatePart(part)
  }

  const normalizedTarget = pathPosix.resolve('/', ...targetParts)
  const normalizedRelative = relativeParts.join('/')
  const fullPath = pathPosix.resolve(normalizedTarget, normalizedRelative)

  if (fullPath === '/' || !fullPath.startsWith(normalizedTarget === '/' ? '/' : `${normalizedTarget}/`)) {
    throw new Error('Invalid upload path.')
  }

  return {
    targetFolder: normalizedTarget,
    relativePath: normalizedRelative,
    fileName: relativeParts[relativeParts.length - 1],
    fullPath,
    folderParts: relativeParts.slice(0, -1),
  }
}

export function getConflictBehavior(): 'rename' | 'replace' | 'fail' {
  const configured = (process.env.UPLOAD_CONFLICT_BEHAVIOR || 'rename').toLowerCase()
  return configured === 'replace' || configured === 'fail' ? configured : 'rename'
}

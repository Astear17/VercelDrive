import type { OdFolderChildren } from '../types'
import type { SortConfig } from '../components/FolderControls'

export function sortFolderChildren(
  items: OdFolderChildren[],
  sortConfig: SortConfig
): OdFolderChildren[] {
  const compare = (a: OdFolderChildren, b: OdFolderChildren): number => {
    let cmp = 0
    switch (sortConfig.by) {
      case 'name':
        cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'accent', numeric: true })
        break
      case 'size': {
        const sizeA = typeof a.size === 'number' && !isNaN(a.size) ? a.size : 0
        const sizeB = typeof b.size === 'number' && !isNaN(b.size) ? b.size : 0
        cmp = sizeA - sizeB
        break
      }
      case 'lastModifiedDateTime': {
        const timeA = a.lastModifiedDateTime ? new Date(a.lastModifiedDateTime).getTime() : 0
        const timeB = b.lastModifiedDateTime ? new Date(b.lastModifiedDateTime).getTime() : 0
        const validA = isNaN(timeA) ? 0 : timeA
        const validB = isNaN(timeB) ? 0 : timeB
        cmp = validA - validB
        break
      }
      default:
        cmp = 0
    }
    if (cmp !== 0) return sortConfig.direction === 'asc' ? cmp : -cmp
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'accent', numeric: true })
  }

  const folders = items.filter(c => Boolean(c.folder))
  const files = items.filter(c => !c.folder)

  folders.sort(compare)
  files.sort(compare)

  return [...folders, ...files]
}

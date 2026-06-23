import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTranslation } from 'next-i18next'

export type SortConfig = { by: string; direction: 'asc' | 'desc' }
export type ItemTypeFilter = 'default' | 'folders' | 'files'
export type FileFolderOrder = 'mixed' | 'folders-first' | 'files-first'
export type PathTypeFilter = string

export interface PathTypeOption {
  value: string
  label: string
}

const sortOptions = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'size-asc', label: 'Size (Smallest)' },
  { value: 'size-desc', label: 'Size (Largest)' },
  { value: 'lastModifiedDateTime-asc', label: 'Date (Oldest)' },
  { value: 'lastModifiedDateTime-desc', label: 'Date (Newest)' },
]

const typeOptions: Array<{ value: ItemTypeFilter; label: string }> = [
  { value: 'default', label: 'Default' },
  { value: 'folders', label: 'Folders' },
  { value: 'files', label: 'Files' },
]

const orderOptions: Array<{ value: FileFolderOrder; label: string }> = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'folders-first', label: 'Folders first' },
  { value: 'files-first', label: 'Files first' },
]

export default function FolderControls({
  sortConfig,
  setSortConfig,
  itemTypeFilter,
  setItemTypeFilter,
  fileFolderOrder,
  setFileFolderOrder,
  pathTypeFilter,
  setPathTypeFilter,
  pathTypeOptions,
}: {
  sortConfig: SortConfig
  setSortConfig: (config: SortConfig) => void
  itemTypeFilter: ItemTypeFilter
  setItemTypeFilter: (filter: ItemTypeFilter) => void
  fileFolderOrder: FileFolderOrder
  setFileFolderOrder: (order: FileFolderOrder) => void
  pathTypeFilter: PathTypeFilter
  setPathTypeFilter: (filter: PathTypeFilter) => void
  pathTypeOptions: PathTypeOption[]
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="inline-flex items-center gap-1 text-xs font-medium normal-case tracking-normal">
        <FontAwesomeIcon icon="sort" className="h-3 w-3" />
        <select
          className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 outline-none"
          value={`${sortConfig.by}-${sortConfig.direction}`}
          onChange={event => {
            const [by, direction] = event.target.value.split('-')
            setSortConfig({ by, direction: direction as 'asc' | 'desc' })
          }}
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {t(option.label)}
            </option>
          ))}
        </select>
      </label>

      <label className="inline-flex items-center gap-1 text-xs font-medium normal-case tracking-normal">
        <FontAwesomeIcon icon="filter" className="h-3 w-3" />
        <select
          className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 outline-none"
          value={itemTypeFilter}
          onChange={event => setItemTypeFilter(event.target.value as ItemTypeFilter)}
        >
          {typeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {t(option.label)}
            </option>
          ))}
        </select>
      </label>

      <label className="inline-flex items-center gap-1 text-xs font-medium normal-case tracking-normal">
        <FontAwesomeIcon icon="folder-open" className="h-3 w-3" />
        <select
          className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 outline-none"
          value={fileFolderOrder}
          onChange={event => setFileFolderOrder(event.target.value as FileFolderOrder)}
        >
          {orderOptions.map(option => (
            <option key={option.value} value={option.value}>
              {t(option.label)}
            </option>
          ))}
        </select>
      </label>

      {pathTypeOptions.length > 1 && (
        <label className="inline-flex items-center gap-1 text-xs font-medium normal-case tracking-normal">
          <FontAwesomeIcon icon="tag" className="h-3 w-3" />
          <select
            className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 outline-none"
            value={pathTypeFilter}
            onChange={event => setPathTypeFilter(event.target.value)}
          >
            {pathTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.value === 'all' ? t('All types') : option.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTranslation } from 'next-i18next'

export type SortConfig = { by: string; direction: 'asc' | 'desc' }
export type TypeFilter = string

export interface TypeFilterOption {
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

export default function FolderControls({
  sortConfig,
  setSortConfig,
  typeFilter,
  setTypeFilter,
  typeFilterOptions,
}: {
  sortConfig: SortConfig
  setSortConfig: (config: SortConfig) => void
  typeFilter: TypeFilter
  setTypeFilter: (filter: TypeFilter) => void
  typeFilterOptions: TypeFilterOption[]
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
          value={typeFilter}
          onChange={event => setTypeFilter(event.target.value)}
        >
          {typeFilterOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.value === 'all' ? t('All types') :
               option.value === 'folders' ? t('Folders') :
               option.value === 'files' ? t('Files') :
               option.value === '__noext__' ? t('No extension') :
               option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

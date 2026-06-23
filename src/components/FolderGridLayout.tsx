import type { OdFolderChildren } from '../types'

import Link from 'next/link'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useClipboard } from 'use-clipboard-copy'
import { useTranslation } from 'next-i18next'

import { getBaseUrl } from '../utils/getBaseUrl'
import { formatModifiedDateTime } from '../utils/fileDetails'
import { Checkbox, ChildIcon, ChildName, Downloading } from './FileListing'
import { getStoredToken } from '../utils/protectedRouteHandler'
import FolderControls from './FolderControls'
import type { FileFolderOrder, PathTypeFilter, PathTypeOption } from './FolderControls'

const GridItem = ({ c, path }: { c: OdFolderChildren; path: string }) => {
  // We use the generated medium thumbnail for rendering preview images (excluding folders)
  const hashedToken = getStoredToken(path)
  const thumbnailUrl =
    'folder' in c ? null : `/api/thumbnail/?path=${path}&size=large${hashedToken ? `&odpt=${hashedToken}` : ''}`

  // Some thumbnails are broken, so we check for onerror event in the image component
  const [brokenThumbnail, setBrokenThumbnail] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center overflow-hidden rounded border border-gray-900/10 dark:border-gray-500/30">
        {thumbnailUrl && !brokenThumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="h-auto w-full object-contain"
            src={thumbnailUrl}
            alt={c.name}
            onError={() => setBrokenThumbnail(true)}
          />
        ) : (
          <div className="relative flex h-32 w-full items-center justify-center rounded-lg">
            <ChildIcon child={c} />
            <span className="absolute bottom-0 right-0 m-1 font-medium text-gray-700 dark:text-gray-500">
              {c.folder?.childCount}
            </span>
          </div>
        )}
      </div>

      {!(c.image || c.video) && (
        <>
          <div className="flex items-start justify-center space-x-2">
            <span className="w-5 flex-shrink-0 text-center">
              <ChildIcon child={c} />
            </span>
            <ChildName name={c.name} folder={Boolean(c.folder)} />
          </div>
          <div className="truncate text-center font-mono text-xs text-gray-700 dark:text-gray-500">
            {formatModifiedDateTime(c.lastModifiedDateTime)}
          </div>
        </>
      )}
    </div>
  )
}

const FolderGridLayout = ({
  path,
  folderChildren,
  selected,
  toggleItemSelected,
  totalSelected,
  toggleTotalSelected,
  totalGenerating,
  handleSelectedDownload,
  folderGenerating,
  handleSelectedPermalink,
  handleFolderDownload,
  toast,
  sortConfig,
  setSortConfig,
  itemTypeFilter,
  setItemTypeFilter,
  fileFolderOrder,
  setFileFolderOrder,
  pathTypeFilter,
  setPathTypeFilter,
  pathTypeOptions,
  handleItemDelete,
  handleSelectedDelete,
}) => {
  const clipboard = useClipboard()
  const hashedToken = getStoredToken(path)

  const { t } = useTranslation()

  // Get item path from item name
  const getItemPath = (name: string) => `${path === '/' ? '' : path}/${encodeURIComponent(name)}`

  return (
    <div className="rounded bg-white shadow-sm dark:bg-gray-900 dark:text-gray-100">
      <div className="flex items-center border-b border-gray-900/10 px-3 text-xs font-bold uppercase tracking-widest text-gray-600 dark:border-gray-500/30 dark:text-gray-400">
        <div className="flex-1">{t('{{count}} item(s)', { count: folderChildren.length })}</div>
        <div className="flex p-1.5 text-gray-700 dark:text-gray-400 items-center space-x-2">
          <FolderControls
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            itemTypeFilter={itemTypeFilter}
            setItemTypeFilter={setItemTypeFilter}
            fileFolderOrder={fileFolderOrder}
            setFileFolderOrder={setFileFolderOrder}
            pathTypeFilter={pathTypeFilter}
            setPathTypeFilter={setPathTypeFilter}
            pathTypeOptions={pathTypeOptions}
          />
          <Checkbox
            checked={totalSelected}
            onChange={toggleTotalSelected}
            indeterminate={true}
            title={t('Select all files')}
          />
          <button
            title={t('Copy selected files permalink')}
            className="cursor-pointer rounded p-1.5 hover:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white dark:hover:bg-gray-600 disabled:dark:text-gray-600 disabled:hover:dark:bg-gray-900"
            disabled={totalSelected === 0}
            onClick={() => {
              clipboard.copy(handleSelectedPermalink(getBaseUrl()))
              toast.success(t('Copied selected files permalink.'))
            }}
          >
            <FontAwesomeIcon icon={['far', 'copy']} size="lg" />
          </button>
          {totalGenerating ? (
            <Downloading title={t('Downloading selected files, refresh page to cancel')} style="p-1.5" />
          ) : (
            <button
              title={t('Download selected files')}
              className="cursor-pointer rounded p-1.5 hover:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white dark:hover:bg-gray-600 disabled:dark:text-gray-600 disabled:hover:dark:bg-gray-900"
              disabled={totalSelected === 0}
              onClick={handleSelectedDownload}
            >
              <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} size="lg" />
            </button>
          )}
          <button
            title={t('Delete selected files')}
            className="cursor-pointer rounded p-1.5 hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white dark:hover:bg-red-900/30 disabled:dark:text-gray-600 disabled:hover:dark:bg-gray-900"
            disabled={totalSelected === 0}
            onClick={handleSelectedDelete}
          >
            <FontAwesomeIcon icon={['far', 'trash-alt']} size="lg" />
          </button>
        </div>
      </div>

      <div className="vd-masonry-wrap p-3">
        <div className="vd-masonry">
        {folderChildren.map((c: OdFolderChildren) => (
          <div
            key={c.id}
            className="group relative mb-3 overflow-hidden rounded break-inside-avoid transition-all duration-100 hover:bg-gray-100 dark:hover:bg-gray-850"
          >
            <div className="absolute top-0 right-0 z-10 m-1 rounded bg-white/50 py-0.5 opacity-0 transition-all duration-100 group-hover:opacity-100 dark:bg-gray-900/50">
              {c.folder ? (
                <div>
                  <span
                    title={t('Copy folder permalink')}
                    className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => {
                      clipboard.copy(`${getBaseUrl()}${getItemPath(c.name)}`)
                      toast(t('Copied folder permalink.'), { icon: '👌' })
                    }}
                  >
                    <FontAwesomeIcon icon={['far', 'copy']} />
                  </span>
                  {folderGenerating[c.id] ? (
                    <Downloading title={t('Downloading folder, refresh page to cancel')} style="px-1.5 py-1" />
                  ) : (
                    <span
                      title={t('Download folder')}
                      className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                      onClick={handleFolderDownload(getItemPath(c.name), c.id, c.name)}
                    >
                      <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
                    </span>
                  )}
                  <span
                    title={t('Delete folder')}
                    className="cursor-pointer rounded px-1.5 py-1 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                    onClick={handleItemDelete(getItemPath(c.name), c.name)}
                  >
                    <FontAwesomeIcon icon={['far', 'trash-alt']} />
                  </span>
                </div>
              ) : (
                <div>
                  <span
                    title={t('Copy raw file permalink')}
                    className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={() => {
                      clipboard.copy(
                        `${getBaseUrl()}/api/raw/?path=${getItemPath(c.name)}${
                          hashedToken ? `&odpt=${hashedToken}` : ''
                        }`
                      )
                      toast.success(t('Copied raw file permalink.'))
                    }}
                  >
                    <FontAwesomeIcon icon={['far', 'copy']} />
                  </span>
                  <a
                    title={t('Download file')}
                    className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                    href={`${getBaseUrl()}/api/raw/?path=${getItemPath(c.name)}${
                      hashedToken ? `&odpt=${hashedToken}` : ''
                    }`}
                  >
                    <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
                  </a>
                  <span
                    title={t('Delete file')}
                    className="cursor-pointer rounded px-1.5 py-1 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                    onClick={handleItemDelete(getItemPath(c.name), c.name)}
                  >
                    <FontAwesomeIcon icon={['far', 'trash-alt']} />
                  </span>
                </div>
              )}
            </div>

            <div
              className={`${
                selected[c.id] ? 'opacity-100' : 'opacity-0'
              } absolute top-0 left-0 z-10 m-1 rounded bg-white/50 py-0.5 group-hover:opacity-100 dark:bg-gray-900/50`}
            >
              {!c.folder && !(c.name === '.password') && (
                <Checkbox
                  checked={selected[c.id] ? 2 : 0}
                  onChange={() => toggleItemSelected(c.id)}
                  title={t('Select file')}
                />
              )}
            </div>

            <Link href={getItemPath(c.name)} passHref>
              <GridItem c={c} path={getItemPath(c.name)} />
            </Link>
          </div>
        ))}
        </div>
      </div>
    </div>
  )
}

export default FolderGridLayout

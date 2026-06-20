import type { OdFileObject, OdFolderChildren, OdFolderObject } from '../types'
import { ParsedUrlQuery } from 'querystring'
import { FC, MouseEventHandler, SetStateAction, useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import toast, { Toaster } from 'react-hot-toast'
import emojiRegex from 'emoji-regex'
import axios from 'axios'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import useLocalStorage from '../utils/useLocalStorage'
import { getPreviewType, preview } from '../utils/getPreviewType'
import { useProtectedSWRInfinite } from '../utils/fetchWithSWR'
import { getExtension, getRawExtension, getFileIcon } from '../utils/getFileIcon'
import { getStoredToken } from '../utils/protectedRouteHandler'
import {
  DownloadingToast,
  downloadMultipleFiles,
  downloadTreelikeMultipleFiles,
  traverseFolder,
} from './MultiFileDownloader'

import { layouts } from './SwitchLayout'
import Loading, { LoadingIcon } from './Loading'
import FourOhFour from './FourOhFour'
import Auth from './Auth'
import TextPreview from './previews/TextPreview'
import MarkdownPreview from './previews/MarkdownPreview'
import CodePreview from './previews/CodePreview'
import OfficePreview from './previews/OfficePreview'
import AudioPreview from './previews/AudioPreview'
import VideoPreview from './previews/VideoPreview'
import PDFPreview from './previews/PDFPreview'
import URLPreview from './previews/URLPreview'
import ImagePreview from './previews/ImagePreview'
import DefaultPreview from './previews/DefaultPreview'
import { PreviewContainer } from './previews/Containers'

import FolderListLayout from './FolderListLayout'
import FolderGridLayout from './FolderGridLayout'
import UploadPanel from './UploadPanel'
import type { ItemTypeFilter, SortConfig } from './FolderControls'

// Disabling SSR for some previews
const EPUBPreview = dynamic(() => import('./previews/EPUBPreview'), {
  ssr: false,
})

/**
 * Convert url query into path string
 *
 * @param query Url query property
 * @returns Path string
 */
const queryToPath = (query?: ParsedUrlQuery) => {
  if (query) {
    const { path } = query
    if (!path) return '/'
    if (typeof path === 'string') return `/${encodeURIComponent(path)}`
    return `/${path.map(p => encodeURIComponent(p)).join('/')}`
  }
  return '/'
}

// Render the icon of a folder child (may be a file or a folder), use emoji if the name of the child contains emoji
const renderEmoji = (name: string) => {
  const emoji = emojiRegex().exec(name)
  return { render: emoji && !emoji.index, emoji }
}
const formatChildName = (name: string) => {
  const { render, emoji } = renderEmoji(name)
  return render ? name.replace(emoji ? emoji[0] : '', '').trim() : name
}
export const ChildName: FC<{ name: string; folder?: boolean }> = ({ name, folder }) => {
  const original = formatChildName(name)
  const extension = folder ? '' : getRawExtension(original)
  const prename = folder ? original : original.substring(0, original.length - extension.length)
  return (
    <span className="truncate before:float-right before:content-[attr(data-tail)]" data-tail={extension}>
      {prename}
    </span>
  )
}
export const ChildIcon: FC<{ child: OdFolderChildren }> = ({ child }) => {
  const { render, emoji } = renderEmoji(child.name)
  return render ? (
    <span>{emoji ? emoji[0] : '📁'}</span>
  ) : (
    <FontAwesomeIcon icon={child.file ? getFileIcon(child.name, { video: Boolean(child.video) }) : ['far', 'folder']} />
  )
}

export const Checkbox: FC<{
  checked: 0 | 1 | 2
  onChange: () => void
  title: string
  indeterminate?: boolean
}> = ({ checked, onChange, title, indeterminate }) => {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.checked = Boolean(checked)
      if (indeterminate) {
        ref.current.indeterminate = checked == 1
      }
    }
  }, [ref, checked, indeterminate])

  const handleClick: MouseEventHandler = e => {
    if (ref.current) {
      if (e.target === ref.current) {
        e.stopPropagation()
      } else {
        ref.current.click()
      }
    }
  }

  return (
    <span
      title={title}
      className="inline-flex cursor-pointer items-center rounded p-1.5 hover:bg-gray-300 dark:hover:bg-gray-600"
      onClick={handleClick}
    >
      <input
        className="form-check-input cursor-pointer"
        type="checkbox"
        value={checked ? '1' : ''}
        ref={ref}
        aria-label={title}
        onChange={onChange}
      />
    </span>
  )
}

export const Downloading: FC<{ title: string; style: string }> = ({ title, style }) => {
  return (
    <span title={title} className={`${style} rounded`} role="status">
      <LoadingIcon
        // Use fontawesome far theme via class `svg-inline--fa` to get style `vertical-align` only
        // for consistent icon alignment, as class `align-*` cannot satisfy it
        className="svg-inline--fa inline-block h-4 w-4 animate-spin"
      />
    </span>
  )
}

const FileListing: FC<{ query?: ParsedUrlQuery }> = ({ query }) => {
  const [selected, setSelected] = useState<{ [key: string]: boolean }>({})
  const [totalSelected, setTotalSelected] = useState<0 | 1 | 2>(0)
  const [totalGenerating, setTotalGenerating] = useState<boolean>(false)
  const [folderGenerating, setFolderGenerating] = useState<{
    [key: string]: boolean
  }>({})

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    itemPath: string
    itemName: string
    isBatch: boolean
    batchPaths?: { path: string; name: string }[]
    password: string
    error: string
    loading: boolean
  }>({
    open: false,
    itemPath: '',
    itemName: '',
    isBatch: false,
    password: '',
    error: '',
    loading: false,
  })
  const router = useRouter()
  const hashedToken = getStoredToken(router.asPath)
  const [layout, _] = useLocalStorage('preferredLayout', layouts[0])

  const { t } = useTranslation()

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    by: 'name',
    direction: 'asc',
  })
  const [itemTypeFilter, setItemTypeFilter] = useState<ItemTypeFilter>('default')

  const path = queryToPath(query)

  const { data, error, size, setSize, mutate } = useProtectedSWRInfinite(
    path,
    `${sortConfig.by} ${sortConfig.direction}`
  )

  const isLoadingInitialData = !data && !error
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === 'undefined')
  const isEmpty = data?.[0]?.length === 0
  const isReachingEnd = isEmpty || (data && typeof data[data.length - 1]?.next === 'undefined')
  const onlyOnePage = data && typeof data[0].next === 'undefined'

  useEffect(() => {
    if (data && !error && !isReachingEnd && !isLoadingMore) {
      setSize(size + 1)
    }
  }, [data, error, isReachingEnd, isLoadingMore, size, setSize])

  if (error) {
    // If error includes 403 which means the user has not completed initial setup, redirect to OAuth page
    if (error.status === 403) {
      router.push('/verceldrive-oauth/step-1')
      return <div />
    }

    return (
      <PreviewContainer>
        {error.status === 401 ? <Auth redirect={path} /> : <FourOhFour errorMsg={JSON.stringify(error.message)} />}
      </PreviewContainer>
    )
  }
  if (!data) {
    return (
      <PreviewContainer>
        <Loading loadingText={t('Loading ...')} />
      </PreviewContainer>
    )
  }

  const responses: any[] = data ? [].concat(...data) : []

  if ('folder' in responses[0]) {
    // Expand list of API returns into flattened file data
    const allFolderChildren = [].concat(...responses.map(r => r.folder.value)) as OdFolderObject['value']
    const folderChildren = allFolderChildren.filter(c => {
      if (itemTypeFilter === 'folders') return Boolean(c.folder)
      if (itemTypeFilter === 'files') return !c.folder
      return true
    })

    const totalChildren = responses[0].folder['@odata.count'] || 1
    const percent = Math.min(100, Math.round((allFolderChildren.length / totalChildren) * 100))

    // Find README.md file to render
    const readmeFile = allFolderChildren.find(c => c.name.toLowerCase() === 'readme.md')

    // Filtered file list helper
    const getFiles = () => folderChildren.filter(c => !c.folder && c.name !== '.password')

    // File selection
    const genTotalSelected = (selected: { [key: string]: boolean }) => {
      const selectInfo = getFiles().map(c => Boolean(selected[c.id]))
      const [hasT, hasF] = [selectInfo.some(i => i), selectInfo.some(i => !i)]
      return hasT && hasF ? 1 : !hasF ? 2 : 0
    }

    const toggleItemSelected = (id: string) => {
      let val: SetStateAction<{ [key: string]: boolean }>
      if (selected[id]) {
        val = { ...selected }
        delete val[id]
      } else {
        val = { ...selected, [id]: true }
      }
      setSelected(val)
      setTotalSelected(genTotalSelected(val))
    }

    const toggleTotalSelected = () => {
      if (genTotalSelected(selected) == 2) {
        setSelected({})
        setTotalSelected(0)
      } else {
        setSelected(Object.fromEntries(getFiles().map(c => [c.id, true])))
        setTotalSelected(2)
      }
    }

    // Selected file download
    const handleSelectedDownload = () => {
      const folderName = path.substring(path.lastIndexOf('/') + 1)
      const folder = folderName ? decodeURIComponent(folderName) : undefined
      const files = getFiles()
        .filter(c => selected[c.id])
        .map(c => ({
          name: c.name,
          url: `/api/raw/?path=${path}/${encodeURIComponent(c.name)}${hashedToken ? `&odpt=${hashedToken}` : ''}`,
        }))

      if (files.length == 1) {
        const el = document.createElement('a')
        el.style.display = 'none'
        document.body.appendChild(el)
        el.href = files[0].url
        el.click()
        el.remove()
      } else if (files.length > 1) {
        setTotalGenerating(true)

        const toastId = toast.loading(<DownloadingToast router={router} />)
        downloadMultipleFiles({ toastId, router, files, folder })
          .then(() => {
            setTotalGenerating(false)
            toast.success(t('Finished downloading selected files.'), {
              id: toastId,
            })
          })
          .catch(() => {
            setTotalGenerating(false)
            toast.error(t('Failed to download selected files.'), { id: toastId })
        })
      }
    }

    const deleteItem = async (itemPath: string, itemName: string, password?: string) => {
      try {
        const data: Record<string, string> = { path: itemPath }
        if (password) data.password = password

        await axios.delete('/api/delete', { data })
        toast.success(t('Deleted {{name}}.', { name: itemName }))
        mutate()
        return true
      } catch (error: any) {
        const status = error?.response?.status
        const errMsg = error?.response?.data?.error || t('Failed to delete {{name}}.', { name: itemName })

        if (status === 401) {
          throw { needPassword: true, message: errMsg }
        }

        toast.error(errMsg)
        return false
      }
    }

    const handleItemDelete = (itemPath: string, itemName: string) => () => {
      setDeleteDialog({
        open: true,
        itemPath,
        itemName,
        isBatch: false,
        password: '',
        error: '',
        loading: false,
      })
    }

    const handleSelectedDelete = () => {
      const files = getFiles().filter(c => selected[c.id])
      if (!files.length) return

      const batchPaths = files.map(f => ({
        path: `${path === '/' ? '' : path}/${encodeURIComponent(f.name)}`,
        name: f.name,
      }))

      setDeleteDialog({
        open: true,
        itemPath: '',
        itemName: `${files.length} file(s)`,
        isBatch: true,
        batchPaths,
        password: '',
        error: '',
        loading: false,
      })
    }

    const executeDelete = async () => {
      setDeleteDialog(d => ({ ...d, loading: true, error: '' }))

      try {
        if (deleteDialog.isBatch && deleteDialog.batchPaths) {
          for (const item of deleteDialog.batchPaths) {
            await deleteItem(item.path, item.name, deleteDialog.password || undefined)
          }
          setSelected({})
          setTotalSelected(0)
        } else {
          await deleteItem(deleteDialog.itemPath, deleteDialog.itemName, deleteDialog.password || undefined)
        }
        setDeleteDialog(d => ({ ...d, open: false, loading: false }))
      } catch (error: any) {
        if (error?.needPassword) {
          setDeleteDialog(d => ({
            ...d,
            loading: false,
            error: error.message || t('Authorization required. Enter the upload password.'),
          }))
        } else {
          setDeleteDialog(d => ({ ...d, open: false, loading: false }))
        }
      }
    }

    // Get selected file permalink
    const handleSelectedPermalink = (baseUrl: string) => {
      return getFiles()
        .filter(c => selected[c.id])
        .map(
          c =>
            `${baseUrl}/api/raw/?path=${path}/${encodeURIComponent(c.name)}${hashedToken ? `&odpt=${hashedToken}` : ''}`
        )
        .join('\n')
    }

    // Folder recursive download
    const handleFolderDownload = (path: string, id: string, name?: string) => () => {
      const files = (async function* () {
        for await (const { meta: c, path: p, isFolder, error } of traverseFolder(path)) {
          if (error) {
            toast.error(
              t('Failed to download folder {{path}}: {{status}} {{message}} Skipped it to continue.', {
                path: p,
                status: error.status,
                message: error.message,
              })
            )
            continue
          }
          const hashedTokenForPath = getStoredToken(p)
          yield {
            name: c?.name,
            url: `/api/raw/?path=${p}${hashedTokenForPath ? `&odpt=${hashedTokenForPath}` : ''}`,
            path: p,
            isFolder,
          }
        }
      })()

      setFolderGenerating({ ...folderGenerating, [id]: true })
      const toastId = toast.loading(<DownloadingToast router={router} />)

      downloadTreelikeMultipleFiles({
        toastId,
        router,
        files,
        basePath: path,
        folder: name,
      })
        .then(() => {
          setFolderGenerating({ ...folderGenerating, [id]: false })
          toast.success(t('Finished downloading folder.'), { id: toastId })
        })
        .catch(() => {
          setFolderGenerating({ ...folderGenerating, [id]: false })
          toast.error(t('Failed to download folder.'), { id: toastId })
        })
    }

    // Folder layout component props
    const folderProps = {
      toast,
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
      sortConfig,
      setSortConfig,
      itemTypeFilter,
      setItemTypeFilter,
      handleItemDelete,
      handleSelectedDelete,
    }

    return (
      <>
        <Toaster />

        <div className="mb-3 flex justify-end">
          <UploadPanel path={path} onUploaded={() => mutate()} />
        </div>

        {layout.name === 'Grid' ? <FolderGridLayout {...folderProps} /> : <FolderListLayout {...folderProps} />}

        {deleteDialog.open && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded bg-white p-4 shadow-lg dark:bg-gray-900">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('Confirm deletion')}
              </h2>
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                {t('Delete {{name}}? This will move it to the OneDrive recycle bin.', { name: deleteDialog.itemName })}
              </p>
              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('Upload password')}
                </label>
                <input
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  type="password"
                  value={deleteDialog.password}
                  onChange={e => setDeleteDialog(d => ({ ...d, password: e.target.value, error: '' }))}
                  placeholder={t('Enter upload password')}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') executeDelete()
                  }}
                />
                {deleteDialog.error && (
                  <p className="mt-1 text-sm text-red-500">{deleteDialog.error}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="rounded px-3 py-1.5 text-sm hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setDeleteDialog(d => ({ ...d, open: false, error: '', password: '' }))}
                >
                  {t('Cancel')}
                </button>
                <button
                  className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={deleteDialog.loading || !deleteDialog.password}
                  onClick={executeDelete}
                >
                  {deleteDialog.loading ? t('Deleting...') : t('Delete')}
                </button>
              </div>
            </div>
          </div>
        )}

        {!onlyOnePage && (
          <div className="rounded-b bg-white dark:bg-gray-900 dark:text-gray-100">
            <div className="border-b border-gray-200 p-3 text-center font-mono text-sm text-gray-400 dark:border-gray-700">
              {t('- showing {{count}} page(s) ', {
                count: size,
                totalFileNum: isLoadingMore ? '...' : folderChildren.length,
              }) +
                (isLoadingMore
                  ? t('of {{count}} file(s) -', { count: folderChildren.length, context: 'loading' })
                  : t('of {{count}} file(s) -', { count: folderChildren.length, context: 'loaded' }))}
            </div>
            {isLoadingMore && (
              <div className="flex w-full items-center justify-center space-x-2 p-3 opacity-60">
                <LoadingIcon className="inline-block h-4 w-4 animate-spin" />
                <span>{t('Loading files... {{percent}}%', { percent })}</span>
              </div>
            )}
          </div>
        )}

        {readmeFile && (
          <div className="mt-4">
            <MarkdownPreview file={readmeFile} path={path} standalone={false} />
          </div>
        )}
      </>
    )
  }

  if ('file' in responses[0] && responses.length === 1) {
    const file = responses[0].file as OdFileObject
    const previewType = getPreviewType(getExtension(file.name), { video: Boolean(file.video) })

    if (previewType) {
      switch (previewType) {
        case preview.image:
          return <ImagePreview file={file} />

        case preview.text:
          return <TextPreview file={file} />

        case preview.code:
          return <CodePreview file={file} />

        case preview.markdown:
          return <MarkdownPreview file={file} path={path} />

        case preview.video:
          return <VideoPreview file={file} />

        case preview.audio:
          return <AudioPreview file={file} />

        case preview.pdf:
          return <PDFPreview file={file} />

        case preview.office:
          return <OfficePreview file={file} />

        case preview.epub:
          return <EPUBPreview file={file} />

        case preview.url:
          return <URLPreview file={file} />

        default:
          return <DefaultPreview file={file} />
      }
    } else {
      return <DefaultPreview file={file} />
    }
  }

  return (
    <PreviewContainer>
      <FourOhFour errorMsg={t('Cannot preview {{path}}', { path })} />
    </PreviewContainer>
  )
}
export default FileListing

import axios from 'axios'
import { FC, FormEvent, useMemo, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import toast from 'react-hot-toast'
import { useTranslation } from 'next-i18next'

type UploadStatus = 'queued' | 'uploading' | 'success' | 'failed' | 'cancelled'

type UploadItem = {
  id: string
  file: File
  relativePath: string
  progress: number
  uploadedBytes: number
  status: UploadStatus
  error?: string
}

type UploadPanelProps = {
  path: string
  onUploaded?: () => void
}

const chunkSize = 10 * 1024 * 1024

function fileId(file: File, relativePath: string) {
  return `${relativePath}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`
}

function normalizeRelativePath(path: string) {
  return path.replace(/\\/g, '/').replace(/^\/+/, '')
}

async function readAllDirectoryEntries(reader: any): Promise<any[]> {
  const entries: any[] = []
  let batch: any[] = []

  do {
    batch = await new Promise(resolve => reader.readEntries(resolve))
    entries.push(...batch)
  } while (batch.length)

  return entries
}

async function traverseEntry(entry: any, prefix = ''): Promise<Array<{ file: File; relativePath: string }>> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject))
    return [{ file, relativePath: normalizeRelativePath(`${prefix}${file.name}`) }]
  }

  if (entry.isDirectory) {
    const entries = await readAllDirectoryEntries(entry.createReader())
    const nested = await Promise.all(entries.map(child => traverseEntry(child, `${prefix}${entry.name}/`)))
    return nested.flat()
  }

  return []
}

async function getDroppedFiles(dataTransfer: DataTransfer): Promise<Array<{ file: File; relativePath: string }>> {
  const itemEntries = Array.from(dataTransfer.items || [])
    .map(item => (typeof (item as any).webkitGetAsEntry === 'function' ? (item as any).webkitGetAsEntry() : null))
    .filter(Boolean)

  if (itemEntries.length) {
    const nested = await Promise.all(itemEntries.map(entry => traverseEntry(entry)))
    return nested.flat()
  }

  return Array.from(dataTransfer.files || []).map(file => ({
    file,
    relativePath: normalizeRelativePath((file as any).webkitRelativePath || file.name),
  }))
}

const UploadPanel: FC<UploadPanelProps> = ({ path, onUploaded }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [uploadAuthed, setUploadAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [items, setItems] = useState<UploadItem[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [resettingTokens, setResettingTokens] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const abortControllers = useRef<Record<string, AbortController>>({})
  const uploadUrls = useRef<Record<string, string>>({})

  const totalBytes = useMemo(() => items.reduce((sum, item) => sum + item.file.size, 0), [items])
  const uploadedBytes = useMemo(() => items.reduce((sum, item) => sum + item.uploadedBytes, 0), [items])
  const totalProgress = totalBytes
    ? Math.round((uploadedBytes / totalBytes) * 100)
    : items.length && items.every(item => item.status === 'success')
    ? 100
    : 0

  const updateItem = (id: string, patch: Partial<UploadItem>) => {
    setItems(current => current.map(item => (item.id === id ? { ...item, ...patch } : item)))
  }

  const addFiles = (files: Array<{ file: File; relativePath: string }>) => {
    const uploadItems = files
      .filter(({ relativePath }) => relativePath)
      .map(({ file, relativePath }) => ({
        id: fileId(file, relativePath),
        file,
        relativePath: normalizeRelativePath(relativePath),
        progress: 0,
        uploadedBytes: 0,
        status: 'queued' as UploadStatus,
      }))

    setItems(current => [...current, ...uploadItems])
  }

  const authenticate = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await axios.post('/api/upload/auth', { password })
      setPassword('')
      setUploadAuthed(true)
      setAuthOpen(false)
      setOpen(true)
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Upload authentication failed.')
    }
  }

  const openUploadPanel = () => {
    if (uploadAuthed) {
      setOpen(true)
    } else {
      setAuthOpen(true)
    }
  }

  const uploadOne = async (item: UploadItem) => {
    const controller = new AbortController()
    abortControllers.current[item.id] = controller
    updateItem(item.id, { status: 'uploading', error: undefined, progress: 0, uploadedBytes: 0 })

    try {
      const { data } = await axios.post('/api/upload/session', {
        targetPath: path,
        relativePath: item.relativePath,
        size: item.file.size,
        lastModified: item.file.lastModified,
      })

      if (data.completed) {
        updateItem(item.id, { status: 'success', progress: 100, uploadedBytes: item.file.size })
        onUploaded?.()
        return
      }

      const uploadUrl = data.uploadUrl
      uploadUrls.current[item.id] = uploadUrl
      let start = 0

      while (start < item.file.size) {
        const end = Math.min(start + chunkSize, item.file.size) - 1
        const chunk = item.file.slice(start, end + 1)

        await axios.put(uploadUrl, chunk, {
          signal: controller.signal,
          headers: {
            'Content-Length': `${chunk.size}`,
            'Content-Range': `bytes ${start}-${end}/${item.file.size}`,
          },
          onUploadProgress: event => {
            const sent = start + (event.loaded || 0)
            updateItem(item.id, {
              uploadedBytes: Math.min(sent, item.file.size),
              progress: Math.round((Math.min(sent, item.file.size) / item.file.size) * 100),
            })
          },
        })

        start = end + 1
        updateItem(item.id, {
          uploadedBytes: start,
          progress: Math.round((start / item.file.size) * 100),
        })
      }

      updateItem(item.id, { status: 'success', progress: 100, uploadedBytes: item.file.size })
      onUploaded?.()
    } catch (error: any) {
      if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
        updateItem(item.id, { status: 'cancelled', error: 'Upload cancelled.' })
      } else {
        const errMsg = error?.response?.data?.error || error?.message || 'Upload failed.'
        updateItem(item.id, {
          status: 'failed',
          error: errMsg,
        })
      }
    } finally {
      delete abortControllers.current[item.id]
      delete uploadUrls.current[item.id]
    }
  }

  const uploadPending = async () => {
    const pending = items.filter(
      item => item.status === 'queued' || item.status === 'failed' || item.status === 'cancelled'
    )
    // Process up to 3 files concurrently for better throughput
    const concurrency = 3
    for (let i = 0; i < pending.length; i += concurrency) {
      const batch = pending.slice(i, i + concurrency)
      await Promise.all(batch.map(item => uploadOne(item)))
    }
  }

  const cancelUpload = (id: string) => {
    abortControllers.current[id]?.abort()
    if (uploadUrls.current[id]) {
      axios.delete(uploadUrls.current[id]).catch(() => undefined)
    }
  }

  const resetAuthTokens = async () => {
    setResettingTokens(true)
    try {
      await axios.post('/api/upload/reset-auth-tokens')
      toast.success('OAuth tokens reset. Open the site again and complete authentication with read/write permission.')
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to reset OAuth tokens.')
    } finally {
      setResettingTokens(false)
    }
  }

  const hasGraphPermissionError = items.some(
    item =>
      item.status === 'failed' &&
      item.error &&
      (/Files\.ReadWrite\.All/i.test(item.error) ||
        /Microsoft Graph denied upload access/i.test(item.error) ||
        /Access denied/i.test(item.error))
  )

  return (
    <>
      <button
        title={t('Upload files or folders')}
        className="inline-flex cursor-pointer items-center gap-2 rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
        onClick={openUploadPanel}
      >
        <FontAwesomeIcon icon="cloud" />
        <span>{t('Upload')}</span>
      </button>

      {authOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <form className="w-full max-w-sm rounded bg-white p-4 shadow-lg dark:bg-gray-900" onSubmit={authenticate}>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">{t('Upload password')}</h2>
            <input
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded px-3 py-1.5 text-sm hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                onClick={() => setAuthOpen(false)}
              >
                {t('Cancel')}
              </button>
              <button className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700" type="submit">
                {t('Unlock')}
              </button>
            </div>
          </form>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-20 overflow-y-auto bg-black/40 p-4">
          <div className="mx-auto my-8 w-full max-w-3xl rounded bg-white shadow-lg dark:bg-gray-900 dark:text-gray-100">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold">{t('Upload')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('Destination')}: {decodeURIComponent(path)}</p>
              </div>
              <button
                className="rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setOpen(false)}
              >
                <FontAwesomeIcon icon="sign-out-alt" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              {hasGraphPermissionError && (
                <div className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-100">
                  <div className="font-medium">{t('Upload permission needs to be refreshed.')}</div>
                  <p className="mt-1">
                    {t('Add delegated Microsoft Graph permission Files.ReadWrite.All in Azure, grant consent if your tenant requires it, reset stored OAuth tokens, then authenticate VercelDrive again.')}
                  </p>
                  <button
                    className="mt-3 rounded bg-yellow-900 px-3 py-1.5 text-white hover:bg-yellow-800 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={resettingTokens}
                    onClick={resetAuthTokens}
                  >
                    {resettingTokens ? t('Resetting...') : t('Reset OAuth tokens')}
                  </button>
                </div>
              )}

              <div
                className={`rounded border border-dashed p-6 text-center ${
                  dragActive
                    ? 'border-gray-800 bg-gray-50 dark:border-gray-100 dark:bg-gray-800'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
                onDragOver={event => {
                  event.preventDefault()
                  setDragActive(true)
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={async event => {
                  event.preventDefault()
                  setDragActive(false)
                  addFiles(await getDroppedFiles(event.dataTransfer))
                }}
              >
                <div className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                  {t('Drop files or folders here. Folder drop support depends on the browser.')}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t('Select files')}
                  </button>
                  <button
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                    onClick={() => folderInputRef.current?.click()}
                  >
                    {t('Select folder')}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  multiple
                  onChange={event => {
                    addFiles(
                      Array.from(event.target.files || []).map(file => ({
                        file,
                        relativePath: file.name,
                      }))
                    )
                    event.target.value = ''
                  }}
                />
                <input
                  ref={folderInputRef}
                  className="hidden"
                  type="file"
                  multiple
                  {...{ webkitdirectory: 'true' }}
                  onChange={event => {
                    addFiles(
                      Array.from(event.target.files || []).map(file => ({
                        file,
                        relativePath: normalizeRelativePath((file as any).webkitRelativePath || file.name),
                      }))
                    )
                    event.target.value = ''
                  }}
                />
              </div>

              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{t('Total progress')}</span>
                  <span>{totalProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-gray-200 dark:bg-gray-800">
                  <div className="h-full bg-green-600" style={{ width: `${totalProgress}%` }} />
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
                {items.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">{t('No files selected.')}</div>
                ) : (
                  items.map(item => (
                    <div key={item.id} className="border-b border-gray-100 p-3 last:border-b-0 dark:border-gray-800">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{item.relativePath}</div>
                          <div className={`text-xs ${
                            item.status === 'failed' ? 'text-red-500' :
                            item.status === 'cancelled' ? 'text-yellow-600' :
                            item.status === 'success' ? 'text-green-600' :
                            'text-gray-500'
                          }`}>
                            {item.status === 'uploading' ? t('Uploading... {{progress}}%', { progress: item.progress }) :
                             item.status === 'success' ? t('Complete') :
                             item.status === 'failed' ? t('Failed: {{error}}', { error: item.error || t('Unknown error') }) :
                             item.status === 'cancelled' ? t('Cancelled') :
                             item.status}
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          {item.status === 'uploading' && (
                            <button
                              className="rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={() => cancelUpload(item.id)}
                            >
                              {t('Cancel')}
                            </button>
                          )}
                          {(item.status === 'failed' || item.status === 'cancelled') && (
                            <button
                              className="rounded px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={() => uploadOne(item)}
                            >
                              {t('Retry')}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded bg-gray-200 dark:bg-gray-800">
                        <div className="h-full bg-blue-600" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between gap-2">
                <button
                  className="rounded px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() =>
                    setItems(items.filter(item => item.status === 'uploading' || item.status === 'queued'))
                  }
                >
                  {t('Clear finished')}
                </button>
                <button
                  className="rounded bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  disabled={
                    !items.some(
                      item => item.status === 'queued' || item.status === 'failed' || item.status === 'cancelled'
                    )
                  }
                  onClick={uploadPending}
                >
                  {t('Start upload')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UploadPanel

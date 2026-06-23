import { FC, ReactNode, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTranslation } from 'next-i18next'

type ViewMode = 'preview' | 'raw'

export const PreviewTabs: FC<{
  showRaw: boolean
  rawContent: string | null
  children: ReactNode
}> = ({ showRaw, rawContent, children }) => {
  const [mode, setMode] = useState<ViewMode>('preview')
  const { t } = useTranslation()

  if (!showRaw) {
    return <>{children}</>
  }

  return (
    <div>
      <div className="flex items-center border-b border-gray-900/10 dark:border-gray-500/30">
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'preview'
              ? 'border-b-2 border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setMode('preview')}
        >
          <FontAwesomeIcon icon="eye" className="h-3 w-3" />
          {t('Preview')}
        </button>
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'raw'
              ? 'border-b-2 border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          onClick={() => setMode('raw')}
        >
          <FontAwesomeIcon icon="code" className="h-3 w-3" />
          {t('Raw')}
        </button>
      </div>
      <div>
        {mode === 'preview' ? (
          children
        ) : (
          <pre className="overflow-x-auto p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
            {rawContent}
          </pre>
        )}
      </div>
    </div>
  )
}

import { getExtension } from './getFileIcon'

const rawReadableExtensions = new Set([
  'md',
  'markdown',
  'mdown',
  'txt',
  'log',
  'srt',
  'vtt',
  'csv',
  'url',
  'diff',
  'rtf',

  'json',
  'jsonc',
  'xml',
  'yml',
  'yaml',
  'toml',
  'ini',
  'cfg',
  'conf',

  'js',
  'jsx',
  'ts',
  'tsx',
  'css',
  'scss',
  'less',
  'html',
  'htm',
  'vue',
  'svelte',

  'sh',
  'bash',
  'zsh',
  'bat',
  'cmd',
  'ps1',
  'py',
  'rb',
  'pl',
  'php',
  'java',
  'c',
  'cpp',
  'h',
  'hpp',
  'cs',
  'go',
  'rs',
  'swift',
  'kt',
  'scala',
  'lua',
  'r',
  'sql',
  'graphql',
  'gql',
  'dockerfile',
  'makefile',
  'env',
])

export function isRawReadable(fileName: string): boolean {
  const ext = getExtension(fileName)
  if (!ext) {
    const lower = fileName.toLowerCase()
    if (
      lower === 'dockerfile' ||
      lower === 'makefile' ||
      lower === 'readme' ||
      lower === 'license' ||
      lower === 'changelog'
    ) {
      return true
    }
  }
  return rawReadableExtensions.has(ext)
}

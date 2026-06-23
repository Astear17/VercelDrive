import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Preview component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="rounded bg-white p-6 text-center dark:bg-gray-900 dark:text-white">
            <div className="text-lg font-semibold text-red-500">Preview failed to load</div>
            <div className="mt-2 text-sm text-gray-500">{this.state.error?.message}</div>
          </div>
        )
      )
    }
    return this.props.children
  }
}

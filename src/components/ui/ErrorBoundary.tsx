import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('ErrorBoundary caught:', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 text-center">
          <h2 className="text-lg font-bold text-slate-900">Что-то пошло не так</h2>
          <p className="mt-2 text-sm text-slate-600">Попробуйте обновить страницу.</p>
        </div>
      )
    }
    return this.props.children
  }
}

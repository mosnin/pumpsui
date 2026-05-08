'use client'

import * as React from 'react'
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production you'd pipe this to Sentry / Datadog
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload()
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} onReload={this.handleReload} />
    }
    return this.props.children
  }
}

// ─── Presentational fallback ──────────────────────────────────────────────────

interface ErrorFallbackProps {
  error: Error | null
  onRetry: () => void
  onReload: () => void
}

function ErrorFallback({ error, onRetry, onReload }: ErrorFallbackProps) {
  const issueTitle = encodeURIComponent('Bug report: unhandled error in OmniWeave')
  const issueBody = encodeURIComponent(
    `**Error:** ${error?.message ?? 'Unknown error'}\n\n**Stack:**\n\`\`\`\n${error?.stack ?? ''}\n\`\`\``,
  )
  const issueUrl = `https://github.com/omniweave/app/issues/new?title=${issueTitle}&body=${issueBody}`

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div
        className={cn(
          'w-full max-w-md rounded-2xl border border-red-500/30',
          'bg-red-950/20 backdrop-blur-md p-8',
          'flex flex-col items-center text-center gap-4',
        )}
      >
        {/* Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20 border border-red-500/40">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Something went wrong
          </h2>
          <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
            An unexpected error occurred. You can try again or reload the page.
          </p>
        </div>

        {/* Error detail (collapsed) */}
        {error?.message && (
          <details className="w-full rounded-xl bg-[#0D0D1F] border border-[#2A2A5A] px-4 py-3 text-left">
            <summary className="cursor-pointer select-none text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors">
              Error details
            </summary>
            <pre className="mt-2 max-h-32 overflow-auto text-xs text-red-400/80 whitespace-pre-wrap break-all">
              {error.message}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <button
            onClick={onRetry}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
              'bg-[#161630] border border-[#2A2A5A] text-slate-200',
              'hover:border-[#6366F1] hover:bg-[#6366F1]/10 transition-colors',
            )}
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>

          <button
            onClick={onReload}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
              'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white',
              'hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-shadow',
            )}
          >
            <RefreshCw className="h-4 w-4" />
            Reload page
          </button>
        </div>

        <a
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Report this issue
        </a>
      </div>
    </div>
  )
}

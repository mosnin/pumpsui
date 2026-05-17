'use client'

import { useState } from 'react'
import { CodeBlock } from './CodeBlock'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TryItWidgetProps {
  /** The relative API path, e.g. "/api/v1/quote" */
  endpoint: string
  /** Default query parameter values shown in the form */
  defaultParams: Record<string, string>
  /** HTTP method to use (default: GET) */
  method?: 'GET' | 'POST'
}

type RequestState = 'idle' | 'loading' | 'success' | 'error'

// ---------------------------------------------------------------------------
// TryItWidget
// ---------------------------------------------------------------------------

export function TryItWidget({
  endpoint,
  defaultParams,
  method = 'GET',
}: TryItWidgetProps) {
  const [params, setParams] = useState<Record<string, string>>(defaultParams)
  const [state, setState] = useState<RequestState>('idle')
  const [responseBody, setResponseBody] = useState<string>('')
  const [statusCode, setStatusCode] = useState<number | null>(null)
  const [responseMs, setResponseMs] = useState<number | null>(null)

  const handleChange = (key: string, value: string) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('loading')
    setResponseBody('')
    setStatusCode(null)

    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v.trim() !== '')
    ).toString()

    const url = `${endpoint}${qs ? `?${qs}` : ''}`
    const start = Date.now()

    try {
      const res = await fetch(url, { method })
      const elapsed = Date.now() - start
      setStatusCode(res.status)
      setResponseMs(elapsed)

      const text = await res.text()
      try {
        // Pretty-print if JSON
        const json = JSON.parse(text)
        setResponseBody(JSON.stringify(json, null, 2))
      } catch {
        setResponseBody(text)
      }

      setState(res.ok ? 'success' : 'error')
    } catch (err) {
      const elapsed = Date.now() - start
      setResponseMs(elapsed)
      setResponseBody(err instanceof Error ? err.message : String(err))
      setState('error')
    }
  }

  const statusColor =
    statusCode === null
      ? '#94A3B8'
      : statusCode < 300
      ? '#10B981'
      : statusCode < 500
      ? '#F59E0B'
      : '#EF4444'

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(13,13,31,0.95)',
        border: '1px solid rgba(99,102,241,0.25)',
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: 'rgba(99,102,241,0.08)',
          borderBottom: '1px solid rgba(99,102,241,0.15)',
        }}
      >
        <span
          className="rounded px-2 py-0.5 text-xs font-bold tracking-wide"
          style={{
            background: 'rgba(99,102,241,0.2)',
            color: '#818CF8',
            border: '1px solid rgba(99,102,241,0.3)',
          }}
        >
          {method}
        </span>
        <span className="font-mono text-sm text-slate-300">{endpoint}</span>
        <span className="ml-auto text-xs text-indigo-400 font-medium">Try It Live</span>
      </div>

      {/* Parameter form */}
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(params).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label
                htmlFor={`param-${key}`}
                className="text-xs font-medium text-slate-400 font-mono"
              >
                {key}
              </label>
              <input
                id={`param-${key}`}
                type="text"
                value={value}
                onChange={e => handleChange(key, e.target.value)}
                placeholder={`Enter ${key}...`}
                spellCheck={false}
                className="rounded-lg px-3 py-2 text-sm font-mono text-slate-200 outline-none transition-all duration-150"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
                onFocus={e => {
                  e.currentTarget.style.border = '1px solid rgba(99,102,241,0.5)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'
                }}
                onBlur={e => {
                  e.currentTarget.style.border = '1px solid rgba(99,102,241,0.2)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={state === 'loading'}
          className="self-start flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150"
          style={{
            background:
              state === 'loading'
                ? 'rgba(99,102,241,0.3)'
                : 'linear-gradient(135deg, #6366F1, #06B6D4)',
            color: 'white',
            cursor: state === 'loading' ? 'not-allowed' : 'pointer',
            boxShadow: state === 'loading' ? 'none' : '0 4px 14px rgba(99,102,241,0.3)',
          }}
        >
          {state === 'loading' ? (
            <>
              <SpinnerIcon />
              Fetching...
            </>
          ) : (
            <>
              <PlayIcon />
              Send Request
            </>
          )}
        </button>
      </form>

      {/* Response panel */}
      {(state === 'success' || state === 'error') && responseBody && (
        <div
          className="border-t"
          style={{ borderColor: 'rgba(99,102,241,0.15)' }}
        >
          {/* Status bar */}
          <div
            className="flex items-center gap-3 px-4 py-2.5 text-xs font-mono"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <span className="text-slate-500">Response</span>
            {statusCode !== null && (
              <span
                className="rounded-full px-2 py-0.5 font-bold"
                style={{
                  background: `${statusColor}1A`,
                  border: `1px solid ${statusColor}4D`,
                  color: statusColor,
                }}
              >
                {statusCode}
              </span>
            )}
            {responseMs !== null && (
              <span className="text-slate-500">{responseMs}ms</span>
            )}
          </div>

          {/* Response body */}
          <div className="max-h-96 overflow-y-auto">
            <CodeBlock code={responseBody} language="json" showCopy />
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

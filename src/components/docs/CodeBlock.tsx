'use client'

import { useEffect, useRef, useState } from 'react'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'

// Register only the languages we need to keep the bundle small
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('javascript', typescript) // reuse TS highlighter
hljs.registerLanguage('python', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CodeLanguage = 'typescript' | 'python' | 'bash' | 'json'

export interface CodeBlockProps {
  code: string
  language: CodeLanguage
  /** Shown as a small tab label above the code block */
  filename?: string
  /** Allow hiding the copy button */
  showCopy?: boolean
}

// ---------------------------------------------------------------------------
// Language display labels
// ---------------------------------------------------------------------------

const LANG_LABELS: Record<CodeLanguage, string> = {
  typescript: 'TypeScript',
  python: 'Python',
  bash: 'bash',
  json: 'JSON',
}

// ---------------------------------------------------------------------------
// CodeBlock
// ---------------------------------------------------------------------------

export function CodeBlock({
  code,
  language,
  filename,
  showCopy = true,
}: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  // Run highlight.js after mount (avoid SSR issues)
  useEffect(() => {
    if (codeRef.current) {
      // Avoid double-highlighting on hot reload
      delete (codeRef.current.dataset as Record<string, string | undefined>).highlighted
      hljs.highlightElement(codeRef.current)
    }
  }, [code, language])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API may be blocked in some contexts
    }
  }

  const tabLabel = filename ?? LANG_LABELS[language]

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: '#0d0d1f',
        border: '1px solid rgba(99,102,241,0.2)',
      }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          background: 'rgba(99,102,241,0.07)',
          borderBottom: '1px solid rgba(99,102,241,0.15)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* Dot strip decoration */}
          <span className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </span>
          <span
            className="text-xs font-medium font-mono"
            style={{ color: '#818CF8' }}
          >
            {tabLabel}
          </span>
        </div>

        {showCopy && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150"
            style={{
              background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
              border: copied
                ? '1px solid rgba(16,185,129,0.3)'
                : '1px solid rgba(255,255,255,0.08)',
              color: copied ? '#10B981' : '#94A3B8',
            }}
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <CheckIcon />
                Copied!
              </>
            ) : (
              <>
                <CopyIcon />
                Copy
              </>
            )}
          </button>
        )}
      </div>

      {/* Code content */}
      <div className="overflow-x-auto">
        <pre className="m-0 p-5 text-sm leading-relaxed" style={{ background: 'transparent' }}>
          <code
            ref={codeRef}
            className={`language-${language}`}
            style={{
              background: 'transparent',
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            }}
          >
            {code}
          </code>
        </pre>
      </div>

      {/* Inject custom hljs styles scoped to this component */}
      <style>{HljsStyles}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icon components
// ---------------------------------------------------------------------------

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Inline highlight.js dark theme
// OmniWeave palette: indigo/cyan on very dark navy background
// ---------------------------------------------------------------------------

const HljsStyles = `
.hljs { color: #CBD5E1; background: transparent; }
.hljs-keyword   { color: #818CF8; font-weight: 600; }
.hljs-built_in  { color: #06B6D4; }
.hljs-type      { color: #38BDF8; }
.hljs-literal   { color: #F472B6; }
.hljs-number    { color: #FB923C; }
.hljs-string    { color: #34D399; }
.hljs-regexp    { color: #34D399; }
.hljs-symbol    { color: #A78BFA; }
.hljs-variable  { color: #CBD5E1; }
.hljs-template-variable { color: #CBD5E1; }
.hljs-comment   { color: #475569; font-style: italic; }
.hljs-doctag    { color: #475569; font-style: italic; }
.hljs-meta      { color: #94A3B8; }
.hljs-meta .hljs-keyword { color: #818CF8; }
.hljs-attr      { color: #38BDF8; }
.hljs-attribute { color: #38BDF8; }
.hljs-name      { color: #818CF8; }
.hljs-section   { color: #06B6D4; font-weight: 600; }
.hljs-title     { color: #38BDF8; font-weight: 600; }
.hljs-title.class_ { color: #F472B6; }
.hljs-title.function_ { color: #34D399; }
.hljs-params    { color: #CBD5E1; }
.hljs-punctuation { color: #64748B; }
.hljs-operator  { color: #94A3B8; }
.hljs-property  { color: #7DD3FC; }
.hljs-addition  { color: #34D399; background: rgba(52,211,153,0.1); }
.hljs-deletion  { color: #F87171; background: rgba(248,113,113,0.1); }
`

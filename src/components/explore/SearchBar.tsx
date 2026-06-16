'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { generateTokenRows, generatePoolRows, type TokenRow, type PoolRow } from '@/lib/explore'
import Link from 'next/link'

type SearchResult =
  | { kind: 'token'; token: TokenRow }
  | { kind: 'pool'; pool: PoolRow }

function fmtPrice(p: number): string {
  if (p >= 1000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (p >= 1) return `$${p.toFixed(2)}`
  if (p >= 0.01) return `$${p.toFixed(4)}`
  return `$${p.toFixed(8)}`
}

function fmtTvl(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M TVL`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K TVL`
  return `$${v.toFixed(0)} TVL`
}

const ALL_TOKENS = generateTokenRows()
const ALL_POOLS = generatePoolRows()

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    const lower = q.toLowerCase()
    const tokenMatches: SearchResult[] = ALL_TOKENS.filter(
      (t) =>
        t.symbol.toLowerCase().includes(lower) ||
        t.name.toLowerCase().includes(lower),
    )
      .slice(0, 5)
      .map((token) => ({ kind: 'token' as const, token }))

    const poolMatches: SearchResult[] = ALL_POOLS.filter(
      (p) =>
        p.token0.toLowerCase().includes(lower) ||
        p.token1.toLowerCase().includes(lower) ||
        p.dex.toLowerCase().includes(lower),
    )
      .slice(0, 4)
      .map((pool) => ({ kind: 'pool' as const, pool }))

    const merged = [...tokenMatches, ...poolMatches]
    setResults(merged)
    setOpen(merged.length > 0)
    setFocusedIndex(-1)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setFocusedIndex(-1)
      inputRef.current?.blur()
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      {/* Input */}
      <div
        className="flex items-center gap-2 rounded-xl px-4 py-2.5"
        style={{
          background: 'rgba(13,13,31,0.8)',
          border: '1px solid rgba(99,102,241,0.25)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search tokens, pools..."
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          className="flex-1 bg-transparent text-sm outline-none placeholder-slate-500"
          style={{ color: '#E2E8F0' }}
          aria-label="Search tokens and pools"
          aria-expanded={open}
          aria-controls="search-listbox"
          aria-autocomplete="list"
          role="combobox"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div
          id="search-listbox"
          className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(10,10,24,0.97)',
            border: '1px solid rgba(99,102,241,0.25)',
            backdropFilter: 'blur(16px)',
          }}
          role="listbox"
        >
          {/* Token section */}
          {results.some((r) => r.kind === 'token') && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tokens
              </div>
              {results
                .filter((r): r is Extract<SearchResult, { kind: 'token' }> => r.kind === 'token')
                .map((r, idx) => {
                  const globalIdx = results.indexOf(r)
                  return (
                    <Link
                      key={r.token.symbol}
                      href={`/swap?tokenIn=USDC&tokenOut=${r.token.symbol}`}
                      onClick={() => { setOpen(false); setQuery('') }}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                      style={{
                        background: focusedIndex === globalIdx ? 'rgba(99,102,241,0.12)' : 'transparent',
                      }}
                      role="option"
                      aria-selected={focusedIndex === globalIdx}
                    >
                      {/* Token logo circle */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white"
                        style={{ background: r.token.logoColor }}
                      >
                        {r.token.symbol.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>
                          {r.token.symbol}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{r.token.name}</div>
                      </div>
                      <div className="text-sm font-mono text-slate-300">{fmtPrice(r.token.price)}</div>
                    </Link>
                  )
                })}
            </div>
          )}

          {/* Pool section */}
          {results.some((r) => r.kind === 'pool') && (
            <div>
              <div
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
                style={{ borderTop: results.some((r) => r.kind === 'token') ? '1px solid rgba(99,102,241,0.1)' : undefined }}
              >
                Pools
              </div>
              {results
                .filter((r): r is Extract<SearchResult, { kind: 'pool' }> => r.kind === 'pool')
                .map((r) => {
                  const globalIdx = results.indexOf(r)
                  return (
                    <Link
                      key={r.pool.id}
                      href={`/pools?token0=${r.pool.token0}&token1=${r.pool.token1}`}
                      onClick={() => { setOpen(false); setQuery('') }}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                      style={{
                        background: focusedIndex === globalIdx ? 'rgba(99,102,241,0.12)' : 'transparent',
                      }}
                      role="option"
                      aria-selected={focusedIndex === globalIdx}
                    >
                      <div className="flex -space-x-1.5 flex-shrink-0">
                        <div
                          className="w-6 h-6 rounded-full border border-[#060611] flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ background: '#6366F1' }}
                        >
                          {r.pool.token0.slice(0, 2)}
                        </div>
                        <div
                          className="w-6 h-6 rounded-full border border-[#060611] flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ background: '#06B6D4' }}
                        >
                          {r.pool.token1.slice(0, 2)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>
                          {r.pool.token0}/{r.pool.token1}
                        </div>
                        <div className="text-xs text-slate-500">{r.pool.dex} · {r.pool.fee}bps</div>
                      </div>
                      <div className="text-xs text-slate-400">{fmtTvl(r.pool.tvl)}</div>
                    </Link>
                  )
                })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

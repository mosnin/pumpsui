'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { type PoolRow } from '@/lib/explore'

// ─── Formatting helpers ────────────────────────────────────────────────────────

function fmtLarge(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toFixed(2)}`
}

// ─── DEX badge colors ─────────────────────────────────────────────────────────

const DEX_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Cetus:    { bg: 'rgba(0,212,170,0.15)',   text: '#00D4AA', border: 'rgba(0,212,170,0.3)'   },
  Turbos:   { bg: 'rgba(59,130,246,0.15)',  text: '#3B82F6', border: 'rgba(59,130,246,0.3)'  },
  DeepBook: { bg: 'rgba(139,92,246,0.15)',  text: '#8B5CF6', border: 'rgba(139,92,246,0.3)'  },
  Aftermath:{ bg: 'rgba(139,92,246,0.15)',  text: '#8B5CF6', border: 'rgba(139,92,246,0.3)'  },
  FlowX:    { bg: 'rgba(239,68,68,0.15)',   text: '#EF4444', border: 'rgba(239,68,68,0.3)'   },
  Kriya:    { bg: 'rgba(16,185,129,0.15)',  text: '#10B981', border: 'rgba(16,185,129,0.3)'  },
}

const DEFAULT_DEX = { bg: 'rgba(99,102,241,0.15)', text: '#6366F1', border: 'rgba(99,102,241,0.3)' }

function DexBadge({ dex }: { dex: string }) {
  const c = DEX_COLORS[dex] ?? DEFAULT_DEX
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {dex}
    </span>
  )
}

// ─── Column definitions ───────────────────────────────────────────────────────

type SortKey = 'tvl' | 'volume24h' | 'volume7d' | 'apr' | 'fee'

interface Column {
  key: SortKey
  label: string
}

const COLUMNS: Column[] = [
  { key: 'fee',       label: 'Fee'       },
  { key: 'tvl',       label: 'TVL'       },
  { key: 'volume24h', label: 'Vol 24h'   },
  { key: 'volume7d',  label: 'Vol 7d'    },
  { key: 'apr',       label: 'APR'       },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  rows: PoolRow[]
}

export function PoolsTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('tvl')
  const [sortAsc, setSortAsc] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey] as number
      const bv = b[sortKey] as number
      return sortAsc ? av - bv : bv - av
    })
  }, [rows, sortKey, sortAsc])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((v) => !v)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) {
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-30">
          <path d="M5 2L2 5h6L5 2zM5 8L2 5h6L5 8z" fill="currentColor" />
        </svg>
      )
    }
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ color: '#6366F1' }}>
        {sortAsc
          ? <path d="M5 2L2 7h6L5 2z" />
          : <path d="M5 8L2 3h6L5 8z" />}
      </svg>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
            {/* Pool */}
            <th className="text-left px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Pool</span>
            </th>
            {/* Dynamic columns */}
            {COLUMNS.map((col) => (
              <th key={col.key} className="text-right px-4 py-3">
                <button
                  onClick={() => handleSort(col.key)}
                  className="inline-flex items-center gap-1 flex-row-reverse text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {col.label} <SortIcon col={col.key} />
                </button>
              </th>
            ))}
            {/* Actions */}
            <th className="px-4 py-3 w-32" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.id}
              className="group transition-colors"
              style={{
                borderBottom: '1px solid rgba(99,102,241,0.07)',
                background: hoveredId === row.id ? 'rgba(255,255,255,0.02)' : 'transparent',
              }}
              onMouseEnter={() => setHoveredId(row.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Pool pair + DEX badge */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  {/* Double token logo */}
                  <div className="flex -space-x-2 flex-shrink-0">
                    <div
                      className="w-7 h-7 rounded-full border-2 border-[#060611] flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: '#6366F1' }}
                      aria-hidden="true"
                    >
                      {row.token0.slice(0, 2)}
                    </div>
                    <div
                      className="w-7 h-7 rounded-full border-2 border-[#060611] flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: '#06B6D4' }}
                      aria-hidden="true"
                    >
                      {row.token1.slice(0, 2)}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: '#E2E8F0' }}>
                      {row.token0}/{row.token1}
                    </div>
                    <div className="mt-0.5">
                      <DexBadge dex={row.dex} />
                    </div>
                  </div>
                </div>
              </td>

              {/* Fee */}
              <td className="px-4 py-3 text-right font-mono text-sm text-slate-300">
                {row.fee}bps
              </td>

              {/* TVL */}
              <td className="px-4 py-3 text-right font-mono text-sm" style={{ color: '#E2E8F0' }}>
                {fmtLarge(row.tvl)}
              </td>

              {/* Volume 24h */}
              <td className="px-4 py-3 text-right font-mono text-sm text-slate-300">
                {fmtLarge(row.volume24h)}
              </td>

              {/* Volume 7d */}
              <td className="px-4 py-3 text-right font-mono text-sm text-slate-300">
                {fmtLarge(row.volume7d)}
              </td>

              {/* APR */}
              <td className="px-4 py-3 text-right">
                <span className="font-mono text-sm font-semibold" style={{ color: '#10B981' }}>
                  {row.apr.toFixed(1)}%
                </span>
              </td>

              {/* Add Liquidity button */}
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/pools?token0=${row.token0}&token1=${row.token1}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
                  style={{
                    background: 'rgba(6,182,212,0.15)',
                    color: '#06B6D4',
                    border: '1px solid rgba(6,182,212,0.25)',
                  }}
                >
                  Add Liquidity
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

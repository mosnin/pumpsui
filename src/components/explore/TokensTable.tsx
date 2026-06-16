'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { type TokenRow } from '@/lib/explore'

// ─── Formatting helpers ────────────────────────────────────────────────────────

function fmtPrice(p: number): string {
  if (p >= 1000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  if (p >= 1) return `$${p.toFixed(2)}`
  if (p >= 0.01) return `$${p.toFixed(4)}`
  return `$${p.toFixed(8)}`
}

function fmtLarge(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toFixed(2)}`
}

// ─── PriceChange ──────────────────────────────────────────────────────────────

function PctCell({ value }: { value: number }) {
  const color = value > 0 ? '#10B981' : value < 0 ? '#EF4444' : '#94a3b8'
  return (
    <span className="font-mono text-xs" style={{ color }}>
      {value > 0 ? '+' : ''}{value.toFixed(2)}%
    </span>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ points, positive }: { points: number[]; positive: boolean }) {
  if (points.length < 2) return null
  const W = 60
  const H = 24
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * W
    const y = H - ((p - min) / range) * H
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const color = positive ? '#10B981' : '#EF4444'
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Token logo circle ────────────────────────────────────────────────────────

function TokenLogo({ symbol, color }: { symbol: string; color: string }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
      style={{ background: color }}
      aria-hidden="true"
    >
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  )
}

// ─── Column definitions ───────────────────────────────────────────────────────

type SortKey = 'rank' | 'price' | 'change1h' | 'change24h' | 'change7d' | 'volume24h' | 'tvl' | 'marketCap'

interface Column {
  key: SortKey
  label: string
  align?: 'right'
}

const COLUMNS: Column[] = [
  { key: 'rank',      label: '#'          },
  { key: 'price',     label: 'Price',     align: 'right' },
  { key: 'change1h',  label: '1h %',      align: 'right' },
  { key: 'change24h', label: '24h %',     align: 'right' },
  { key: 'change7d',  label: '7d %',      align: 'right' },
  { key: 'volume24h', label: 'Volume 24h',align: 'right' },
  { key: 'tvl',       label: 'TVL',       align: 'right' },
  { key: 'marketCap', label: 'Market Cap',align: 'right' },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  rows: TokenRow[]
}

export function TokensTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(10)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey] as number
      const bv = b[sortKey] as number
      return sortAsc ? av - bv : bv - av
    })
  }, [rows, sortKey, sortAsc])

  const visible = sorted.slice(0, page)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((v) => !v)
    } else {
      setSortKey(key)
      setSortAsc(false) // default desc for most metrics
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
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
              {/* # */}
              <th className="text-left px-4 py-3 w-10">
                <button
                  onClick={() => handleSort('rank')}
                  className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
                >
                  # <SortIcon col="rank" />
                </button>
              </th>
              {/* Token */}
              <th className="text-left px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Token</span>
              </th>
              {/* Dynamic columns */}
              {COLUMNS.filter((c) => c.key !== 'rank').map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  <button
                    onClick={() => handleSort(col.key)}
                    className={`inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors ${col.align === 'right' ? 'flex-row-reverse' : ''}`}
                  >
                    {col.label} <SortIcon col={col.key} />
                  </button>
                </th>
              ))}
              {/* Sparkline header */}
              <th className="text-right px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">7d Chart</span>
              </th>
              {/* Actions */}
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <motion.tr
                key={row.symbol}
                className="group transition-colors"
                style={{
                  borderBottom: '1px solid rgba(99,102,241,0.07)',
                  background: hoveredRow === row.rank ? 'rgba(255,255,255,0.02)' : 'transparent',
                }}
                onMouseEnter={() => setHoveredRow(row.rank)}
                onMouseLeave={() => setHoveredRow(null)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
              >
                {/* Rank */}
                <td className="px-4 py-3 text-slate-500 text-xs font-mono">{row.rank}</td>

                {/* Token name + symbol */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <TokenLogo symbol={row.symbol} color={row.logoColor} />
                    <div>
                      <div className="font-semibold text-sm" style={{ color: '#E2E8F0' }}>{row.symbol}</div>
                      <div className="text-xs text-slate-500">{row.name}</div>
                    </div>
                  </div>
                </td>

                {/* Price */}
                <td className="px-4 py-3 text-right font-mono text-sm" style={{ color: '#E2E8F0' }}>
                  {fmtPrice(row.price)}
                </td>

                {/* 1h */}
                <td className="px-4 py-3 text-right">
                  <PctCell value={row.change1h} />
                </td>

                {/* 24h */}
                <td className="px-4 py-3 text-right">
                  <PctCell value={row.change24h} />
                </td>

                {/* 7d */}
                <td className="px-4 py-3 text-right">
                  <PctCell value={row.change7d} />
                </td>

                {/* Volume 24h */}
                <td className="px-4 py-3 text-right font-mono text-sm text-slate-300">
                  {fmtLarge(row.volume24h)}
                </td>

                {/* TVL */}
                <td className="px-4 py-3 text-right font-mono text-sm text-slate-300">
                  {fmtLarge(row.tvl)}
                </td>

                {/* Market cap */}
                <td className="px-4 py-3 text-right font-mono text-sm text-slate-300">
                  {fmtLarge(row.marketCap)}
                </td>

                {/* Sparkline */}
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex justify-end">
                    <Sparkline points={row.sparkline} positive={row.change7d >= 0} />
                  </div>
                </td>

                {/* Swap button (shown on hover) */}
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/swap?tokenIn=USDC&tokenOut=${row.symbol}`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{
                      background: 'rgba(99,102,241,0.2)',
                      color: '#818CF8',
                      border: '1px solid rgba(99,102,241,0.3)',
                    }}
                  >
                    Swap
                  </Link>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show more */}
      {page < sorted.length && (
        <div className="px-4 py-4 text-center">
          <button
            onClick={() => setPage((p) => p + 10)}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: 'rgba(99,102,241,0.12)',
              color: '#818CF8',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            Show more ({sorted.length - page} remaining)
          </button>
        </div>
      )}
    </div>
  )
}

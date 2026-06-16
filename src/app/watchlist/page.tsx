'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, TrendingUp, TrendingDown, ArrowUpDown, Search } from 'lucide-react'
import { useWatchlistStore } from '@/store/watchlistStore'
import { WatchlistButton } from '@/components/common/WatchlistButton'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'change' | 'volume' | 'marketCap' | 'price'
type SortDir = 'asc' | 'desc'

interface TokenInfo {
  coinType: string
  symbol: string
  name: string
  price: number
  change24h: number
  volume24h: number
  marketCap: number
  iconColor: string
  sparkline: number[] // 7 data points, relative values 0-100
}

// ─── Mock token registry (keyed by coinType) ─────────────────────────────────

const TOKEN_REGISTRY: Record<string, TokenInfo> = {
  '0x2::sui::SUI': {
    coinType: '0x2::sui::SUI',
    symbol: 'SUI',
    name: 'Sui',
    price: 2.88,
    change24h: 5.21,
    volume24h: 182_400_000,
    marketCap: 7_820_000_000,
    iconColor: '#3B82F6',
    sparkline: [58, 55, 62, 70, 68, 74, 80],
  },
  '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN': {
    coinType: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
    symbol: 'USDC',
    name: 'USD Coin',
    price: 1.00,
    change24h: 0.01,
    volume24h: 94_200_000,
    marketCap: 45_000_000_000,
    iconColor: '#2563EB',
    sparkline: [50, 50, 50, 51, 50, 50, 50],
  },
  '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN': {
    coinType: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
    symbol: 'ETH',
    name: 'Ethereum (Wormhole)',
    price: 3_182,
    change24h: 1.74,
    volume24h: 56_800_000,
    marketCap: 382_000_000_000,
    iconColor: '#8B5CF6',
    sparkline: [60, 58, 65, 63, 70, 68, 72],
  },
  '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN': {
    coinType: '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    price: 61_400,
    change24h: -2.11,
    volume24h: 38_900_000,
    marketCap: 1_200_000_000_000,
    iconColor: '#F59E0B',
    sparkline: [70, 72, 68, 65, 62, 60, 58],
  },
  '0x6864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS': {
    coinType: '0x6864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    symbol: 'CETUS',
    name: 'Cetus Protocol',
    price: 0.0821,
    change24h: 11.42,
    volume24h: 14_300_000,
    marketCap: 82_100_000,
    iconColor: '#00D4AA',
    sparkline: [30, 35, 42, 55, 68, 78, 90],
  },
  '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI': {
    coinType: '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI',
    symbol: 'haSUI',
    name: 'Haedal Staked SUI',
    price: 3.14,
    change24h: 4.88,
    volume24h: 8_700_000,
    marketCap: 314_000_000,
    iconColor: '#EC4899',
    sparkline: [50, 54, 58, 60, 64, 68, 72],
  },
}

// Pre-fill some defaults so the page has content on first visit
const DEFAULT_WATCHLIST = Object.keys(TOKEN_REGISTRY).slice(0, 4)

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const w = 72
  const h = 28
  const pad = 2
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })
  const polyline = points.join(' ')

  // Area fill path
  const areaPath = [
    `M ${points[0]}`,
    ...points.slice(1).map((p) => `L ${p}`),
    `L ${points[points.length - 1].split(',')[0]},${h}`,
    `L ${pad},${h}`,
    'Z',
  ].join(' ')

  const color = positive ? '#10B981' : '#EF4444'
  const fillId = `spark-fill-${positive ? 'up' : 'dn'}-${Math.random().toString(36).slice(2, 7)}`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${fillId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function fmtPrice(p: number): string {
  if (p >= 1_000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (p >= 1) return `$${p.toFixed(2)}`
  if (p >= 0.01) return `$${p.toFixed(4)}`
  return `$${p.toFixed(6)}`
}

function fmtCompact(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toFixed(2)}`
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyWatchlist() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-8">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: 'rgba(234,179,8,0.1)',
          border: '1px solid rgba(234,179,8,0.25)',
          color: '#EAB308',
        }}
      >
        <Star size={36} />
      </div>
      <h2 className="text-2xl font-bold mb-3" style={{ color: '#E2E8F0' }}>
        Your Watchlist is Empty
      </h2>
      <p className="text-slate-400 max-w-sm mb-8 text-sm leading-relaxed">
        Star tokens on the{' '}
        <Link href="/swap" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
          Swap
        </Link>{' '}
        or{' '}
        <Link href="/analytics" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
          Analytics
        </Link>{' '}
        pages to track your favourite tokens here.
      </p>
      <Link
        href="/swap"
        className="px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
          color: '#fff',
        }}
      >
        Browse Tokens
      </Link>
    </div>
  )
}

// ─── Sort button ─────────────────────────────────────────────────────────────

function SortButton({
  label,
  field,
  current,
  dir,
  onClick,
}: {
  label: string
  field: SortKey
  current: SortKey
  dir: SortDir
  onClick: () => void
}) {
  const active = current === field
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
        active
          ? 'text-indigo-300 bg-indigo-500/15'
          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5',
      ].join(' ')}
    >
      {label}
      <ArrowUpDown
        size={11}
        className={active ? 'opacity-100' : 'opacity-40'}
        style={{ transform: active && dir === 'asc' ? 'scaleY(-1)' : 'none' }}
      />
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WatchlistPage() {
  const { watchlist, addToWatchlist } = useWatchlistStore()
  const [sortKey, setSortKey] = useState<SortKey>('marketCap')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [search, setSearch] = useState('')

  // On first load, seed some defaults if watchlist is empty
  // (we do this by pre-populating via the store's defaults — done via store initializer)

  // Resolve tokens
  const tokens: TokenInfo[] = watchlist
    .map((ct) => TOKEN_REGISTRY[ct])
    .filter(Boolean as unknown as <T>(v: T | undefined) => v is T)

  // Also include defaults visible even without persisted state for demo
  const visibleTokens = tokens.length > 0
    ? tokens
    : DEFAULT_WATCHLIST.map((ct) => TOKEN_REGISTRY[ct]).filter(Boolean)

  // Search filter
  const filtered = visibleTokens.filter(
    (t) =>
      t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()),
  )

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const mul = sortDir === 'desc' ? -1 : 1
    if (sortKey === 'change') return mul * (a.change24h - b.change24h)
    if (sortKey === 'volume') return mul * (a.volume24h - b.volume24h)
    if (sortKey === 'marketCap') return mul * (a.marketCap - b.marketCap)
    if (sortKey === 'price') return mul * (a.price - b.price)
    return 0
  })

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: '#060611', color: '#E2E8F0' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(234,179,8,0.15)', color: '#EAB308' }}
            >
              <Star size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#E2E8F0' }}>
                Watchlist
              </h1>
              <p className="text-slate-400 text-sm">
                {sorted.length} token{sorted.length !== 1 ? 's' : ''} tracked
              </p>
            </div>
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 w-full sm:w-64"
            style={{
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            <Search size={15} className="text-slate-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search tokens…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600"
              style={{ color: '#E2E8F0' }}
            />
          </div>
        </div>

        {sorted.length === 0 && !search ? (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(13, 13, 31, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <EmptyWatchlist />
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(13, 13, 31, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            {/* Sort controls */}
            <div
              className="px-5 py-3 flex items-center gap-2 flex-wrap border-b"
              style={{ borderColor: 'rgba(99,102,241,0.15)' }}
            >
              <span className="text-xs text-slate-500 mr-1">Sort by:</span>
              <SortButton label="Price"      field="price"     current={sortKey} dir={sortDir} onClick={() => handleSort('price')} />
              <SortButton label="24h Change" field="change"    current={sortKey} dir={sortDir} onClick={() => handleSort('change')} />
              <SortButton label="Volume"     field="volume"    current={sortKey} dir={sortDir} onClick={() => handleSort('volume')} />
              <SortButton label="Market Cap" field="marketCap" current={sortKey} dir={sortDir} onClick={() => handleSort('marketCap')} />
            </div>

            {/* Token list */}
            {sorted.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                No tokens match &ldquo;{search}&rdquo;
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                        Token
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                        Price
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                        24h
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 hidden md:table-cell">
                        Volume 24h
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 hidden lg:table-cell">
                        Market Cap
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500 hidden sm:table-cell">
                        7D Chart
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                        Watch
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((token, i) => (
                      <tr
                        key={token.coinType}
                        className="transition-colors hover:bg-white/[0.025] group"
                        style={{
                          borderBottom:
                            i < sorted.length - 1 ? '1px solid rgba(99,102,241,0.07)' : 'none',
                        }}
                      >
                        {/* Token identity */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                              style={{ background: token.iconColor }}
                            >
                              {token.symbol[0]}
                            </div>
                            <div>
                              <div className="font-semibold" style={{ color: '#E2E8F0' }}>
                                {token.symbol}
                              </div>
                              <div className="text-xs text-slate-500 truncate max-w-[120px]">
                                {token.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-5 py-4 text-right font-mono font-semibold" style={{ color: '#E2E8F0' }}>
                          {fmtPrice(token.price)}
                        </td>

                        {/* 24h change */}
                        <td className="px-5 py-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-sm font-medium ${
                              token.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {token.change24h >= 0 ? (
                              <TrendingUp size={13} />
                            ) : (
                              <TrendingDown size={13} />
                            )}
                            {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                          </span>
                        </td>

                        {/* Volume */}
                        <td className="px-5 py-4 text-right font-mono text-slate-400 hidden md:table-cell">
                          {fmtCompact(token.volume24h)}
                        </td>

                        {/* Market Cap */}
                        <td className="px-5 py-4 text-right font-mono text-slate-400 hidden lg:table-cell">
                          {fmtCompact(token.marketCap)}
                        </td>

                        {/* Sparkline */}
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <div className="flex justify-center">
                            <Sparkline data={token.sparkline} positive={token.change24h >= 0} />
                          </div>
                        </td>

                        {/* Watchlist toggle */}
                        <td className="px-5 py-4 text-center">
                          <div className="flex justify-center">
                            <WatchlistButton coinType={token.coinType} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

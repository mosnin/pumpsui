'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SwapEvent {
  id: string
  address: string
  fromToken: string
  toToken: string
  valueUsd: number
  timestamp: Date
}

interface LiveSwapFeedProps {
  /** Override with real indexer data. When provided, demo generation is disabled. */
  swaps?: SwapEvent[]
  /** Maximum rows to display (default 8) */
  maxRows?: number
  className?: string
}

// ─── Demo data generation ──────────────────────────────────────────────────────

const DEMO_TOKENS = ['SUI', 'USDC', 'USDT', 'WETH', 'WBTC', 'CETUS', 'TURBOS', 'DEEP']

function randomHex(length: number): string {
  const chars = '0123456789abcdef'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function generateAddress(): string {
  return `0x${randomHex(40)}`
}

function shortenAddress(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function generateSwap(): SwapEvent {
  const fromIndex = Math.floor(Math.random() * DEMO_TOKENS.length)
  let toIndex = Math.floor(Math.random() * (DEMO_TOKENS.length - 1))
  if (toIndex >= fromIndex) toIndex++

  return {
    id: crypto.randomUUID(),
    address: generateAddress(),
    fromToken: DEMO_TOKENS[fromIndex],
    toToken: DEMO_TOKENS[toIndex],
    valueUsd: Math.round(Math.random() * 49_900 + 100), // $100–$50,000
    timestamp: new Date(),
  }
}

// ─── Relative time helper ──────────────────────────────────────────────────────

function useRelativeTimes(swaps: SwapEvent[]): void {
  // Force re-renders every 5 s so "X ago" labels stay fresh
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 5_000)
    return () => clearInterval(id)
  }, [])
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

// ─── USD formatting ────────────────────────────────────────────────────────────

function formatValueUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// ─── Row component ─────────────────────────────────────────────────────────────

function SwapRow({ swap, isNew }: { swap: SwapEvent; isNew: boolean }) {
  return (
    <div
      className={[
        'flex items-center justify-between px-4 py-2.5 border-b border-slate-800/60',
        'text-sm hover:bg-white/3 transition-colors',
        isNew ? 'swap-row-enter' : '',
      ].join(' ')}
    >
      {/* Address */}
      <span className="font-mono text-xs text-slate-400 w-28 shrink-0">
        {shortenAddress(swap.address)}
      </span>

      {/* Token pair */}
      <span className="flex items-center gap-1.5 flex-1 px-2">
        <span className="text-slate-200 font-medium">{swap.fromToken}</span>
        <span className="text-slate-600 text-xs">→</span>
        <span className="text-slate-200 font-medium">{swap.toToken}</span>
      </span>

      {/* USD value */}
      <span className="font-mono text-xs text-indigo-300 w-20 text-right shrink-0">
        {formatValueUsd(swap.valueUsd)}
      </span>

      {/* Time */}
      <span className="text-xs text-slate-500 w-20 text-right shrink-0">
        {timeAgo(swap.timestamp)}
      </span>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

/**
 * A live feed of recent swaps.
 *
 * When no `swaps` prop is provided the component generates realistic demo
 * data to illustrate the live feel. Pass real indexer data via `swaps` to
 * disable demo generation.
 */
export function LiveSwapFeed({ swaps: externalSwaps, maxRows = 8, className = '' }: LiveSwapFeedProps) {
  const [demoSwaps, setDemoSwaps] = useState<SwapEvent[]>(() =>
    Array.from({ length: 5 }, () => {
      const s = generateSwap()
      // Stagger initial timestamps so they don't all say "just now"
      s.timestamp = new Date(Date.now() - Math.floor(Math.random() * 30_000))
      return s
    })
  )
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDemo = externalSwaps === undefined

  // Demo: add a new swap every 2–5 seconds
  useEffect(() => {
    if (!isDemo) return

    const schedule = () => {
      const delay = 2_000 + Math.random() * 3_000
      timeoutRef.current = setTimeout(() => {
        const newSwap = generateSwap()
        setDemoSwaps((prev) => [newSwap, ...prev].slice(0, maxRows))
        setNewIds((prev) => {
          const next = new Set(prev)
          next.add(newSwap.id)
          return next
        })
        // Remove the "new" marker after the animation finishes
        setTimeout(() => {
          setNewIds((prev) => {
            const next = new Set(prev)
            next.delete(newSwap.id)
            return next
          })
        }, 400)
        schedule()
      }, delay)
    }

    schedule()
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isDemo, maxRows])

  // Tick for relative time labels
  useRelativeTimes(isDemo ? demoSwaps : (externalSwaps ?? []))

  // intervalRef is used only as a stable container, not for scheduling.
  // Cleanup is handled in the demo effect above via timeoutRef.

  const displayed = isDemo
    ? demoSwaps.slice(0, maxRows)
    : externalSwaps!.slice(0, maxRows)

  return (
    <div
      className={[
        'rounded-xl overflow-hidden',
        'border border-slate-800/80',
        className,
      ].join(' ')}
      style={{ background: 'rgba(13, 13, 31, 0.85)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
        <h3 className="text-sm font-semibold text-slate-200">Live Swaps</h3>
        <span className="flex items-center gap-1.5 text-xs">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-emerald-400">Live</span>
          {isDemo && <span className="text-slate-600 ml-1">(demo)</span>}
        </span>
      </div>

      {/* Column headers */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/40">
        <span className="text-xs text-slate-500 w-28 shrink-0">Address</span>
        <span className="text-xs text-slate-500 flex-1 px-2">Pair</span>
        <span className="text-xs text-slate-500 w-20 text-right shrink-0">Value</span>
        <span className="text-xs text-slate-500 w-20 text-right shrink-0">Time</span>
      </div>

      {/* Rows */}
      <div>
        {displayed.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-slate-600">
            Waiting for swaps…
          </div>
        ) : (
          displayed.map((swap) => (
            <SwapRow
              key={swap.id}
              swap={swap}
              isNew={newIds.has(swap.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

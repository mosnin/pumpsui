'use client'

import { useEffect, useRef, useState } from 'react'
import { useLivePrices, PriceData } from '@/hooks/useLivePrices'
import { adaptiveDecimals } from '@/lib/formatters'

// ─── Tokens shown in the ticker ───────────────────────────────────────────────

const TICKER_TOKENS = ['SUI', 'USDC', 'USDT', 'WETH', 'WBTC', 'CETUS', 'TURBOS', 'DEEP']

// ─── Types ────────────────────────────────────────────────────────────────────

interface TickerItemProps {
  symbol: string
  data: PriceData
  prevPrice: number | null
}

// ─── Single ticker item ───────────────────────────────────────────────────────

function TickerItem({ symbol, data, prevPrice }: TickerItemProps) {
  const [flashClass, setFlashClass] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (prevPrice === null || prevPrice === data.price) return

    const cls = data.price > prevPrice ? 'price-flash-up' : 'price-flash-down'
    setFlashClass(cls)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setFlashClass(''), 850)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [data.price, prevPrice])

  const isPositive = data.change24h > 0
  const isNegative = data.change24h < 0

  const changeColor = isPositive
    ? 'text-emerald-400'
    : isNegative
    ? 'text-red-400'
    : 'text-slate-400'

  const changePrefix = isPositive ? '▲' : isNegative ? '▼' : '—'

  const decimals = adaptiveDecimals(data.price)
  const formatted = data.price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span className="inline-flex items-center gap-1.5 px-4 whitespace-nowrap select-none">
      <span className="text-slate-400 text-xs font-medium">{symbol}</span>
      <span className={`font-mono text-xs text-slate-200 ${flashClass}`}>${formatted}</span>
      <span className={`text-xs font-medium ${changeColor}`}>
        {changePrefix}
        {Math.abs(data.change24h).toFixed(2)}%
      </span>
    </span>
  )
}

// ─── Connection status dot ─────────────────────────────────────────────────────

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span className="flex items-center gap-1 shrink-0 px-3">
      <span
        className={[
          'relative flex h-1.5 w-1.5 shrink-0',
        ].join(' ')}
      >
        {connected ? (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </>
        ) : (
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-slate-500" />
        )}
      </span>
    </span>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

/**
 * A horizontal, auto-scrolling price ticker strip.
 *
 * - Rendered as a CSS marquee (no JS scroll, pauses on hover)
 * - Prices flash green/red when they update
 * - Connection indicator: green pulse = live, grey = disconnected
 */
export function LivePriceTicker() {
  const { prices, connected } = useLivePrices(TICKER_TOKENS)
  const prevPricesRef = useRef<Record<string, number>>({})

  // Snapshot previous prices before the next render cycle so TickerItem
  // receives the "old" value to compare against.
  const prevSnapshot = prevPricesRef.current
  useEffect(() => {
    const next: Record<string, number> = {}
    for (const sym of TICKER_TOKENS) {
      if (prices[sym]) next[sym] = prices[sym].price
    }
    prevPricesRef.current = next
  })

  // Only render tokens we actually have prices for
  const available = TICKER_TOKENS.filter((sym) => prices[sym])

  if (available.length === 0) {
    return (
      <div
        className="w-full h-8 flex items-center"
        style={{
          background: 'rgba(6, 6, 17, 0.95)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.12)',
        }}
      >
        <StatusDot connected={connected} />
        <span className="text-xs text-slate-600 font-mono px-2">Loading prices…</span>
      </div>
    )
  }

  // Duplicate items so the marquee seamlessly loops
  const items = [...available, ...available]

  return (
    <div
      className="w-full h-8 flex items-center overflow-hidden"
      aria-label="Live price ticker"
      role="marquee"
      style={{
        background: 'rgba(6, 6, 17, 0.95)',
        borderBottom: '1px solid rgba(99, 102, 241, 0.12)',
      }}
    >
      <StatusDot connected={connected} />

      {/* Separator */}
      <span className="h-3 w-px bg-slate-700 shrink-0" />

      {/* Scrolling track */}
      <div className="relative flex-1 overflow-hidden">
        <div className="ticker-track">
          {items.map((sym, idx) => {
            const data = prices[sym]
            if (!data) return null
            return (
              <TickerItem
                key={`${sym}-${idx}`}
                symbol={sym}
                data={data}
                prevPrice={prevSnapshot[sym] ?? null}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

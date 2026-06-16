'use client'

import { useEffect, useRef, useState } from 'react'
import { useLivePrices } from '@/hooks/useLivePrices'
import { adaptiveDecimals } from '@/lib/formatters'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceDisplayProps {
  /** Token symbol, e.g. "SUI", "USDC", "WETH" */
  token: string
  /** Show the 24-hour change percentage */
  showChange?: boolean
  className?: string
}

// ─── Change arrow ─────────────────────────────────────────────────────────────

function ChangeArrow({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="text-emerald-400 text-xs font-medium">
        ▲{Math.abs(value).toFixed(2)}%
      </span>
    )
  }
  if (value < 0) {
    return (
      <span className="text-red-400 text-xs font-medium">
        ▼{Math.abs(value).toFixed(2)}%
      </span>
    )
  }
  return <span className="text-slate-400 text-xs font-medium">—0.00%</span>
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Displays a live price for a single token, sourced from the SSE feed.
 * Flashes green on price increase and red on decrease.
 *
 * @example
 * <PriceDisplay token="SUI" showChange />
 * // Renders: $1.2038 ▲2.30%
 */
export function PriceDisplay({ token, showChange = false, className = '' }: PriceDisplayProps) {
  const { prices } = useLivePrices([token])
  const priceData = prices[token.toUpperCase()]

  const prevPriceRef = useRef<number | null>(null)
  const [flashClass, setFlashClass] = useState('')

  useEffect(() => {
    if (!priceData) return
    const current = priceData.price
    const prev = prevPriceRef.current

    if (prev !== null && current !== prev) {
      const cls = current > prev ? 'price-flash-up' : 'price-flash-down'
      setFlashClass(cls)
      const timer = setTimeout(() => setFlashClass(''), 850)
      prevPriceRef.current = current
      return () => clearTimeout(timer)
    }

    prevPriceRef.current = current
  }, [priceData])

  if (!priceData) {
    return (
      <span className={`font-mono text-slate-500 ${className}`}>—</span>
    )
  }

  const decimals = adaptiveDecimals(priceData.price)
  const formatted = priceData.price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`font-mono text-slate-200 transition-colors ${flashClass}`}>
        ${formatted}
      </span>
      {showChange && <ChangeArrow value={priceData.change24h} />}
    </span>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PriceData {
  price: number
  change24h: number
  timestamp: string
}

export type PriceMap = Record<string, PriceData>

export interface UseLivePricesResult {
  prices: PriceMap
  connected: boolean
  lastUpdate: Date | null
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Subscribe to the SSE price feed at /api/ws/prices.
 *
 * Automatically reconnects on error (EventSource handles this natively).
 * Clean up is guaranteed on unmount.
 *
 * @param tokens - Array of token symbols, e.g. ["SUI", "USDC", "WETH"]
 */
export function useLivePrices(tokens: string[]): UseLivePricesResult {
  const [prices, setPrices] = useState<PriceMap>({})
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const esRef = useRef<EventSource | null>(null)

  // Stable string key so useEffect only re-subscribes when tokens actually change
  const tokenKey = tokens.slice().sort().join(',')

  useEffect(() => {
    if (tokens.length === 0) return

    const url = `/api/ws/prices?tokens=${tokens.join(',')}`
    const es = new EventSource(url)
    esRef.current = es

    es.onopen = () => setConnected(true)

    es.onerror = () => {
      setConnected(false)
      // EventSource auto-reconnects; no manual retry needed
    }

    es.onmessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as PriceMap
        setPrices((prev) => ({ ...prev, ...data }))
        setLastUpdate(new Date())
        setConnected(true)
      } catch {
        // Ignore malformed frames
      }
    }

    return () => {
      es.close()
      esRef.current = null
      setConnected(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenKey])

  return { prices, connected, lastUpdate }
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { COINGECKO_API_URL, PRICE_CACHE_TTL_MS } from '@/lib/constants'
import { SUI_TOKENS } from '@/lib/tokens'

interface PriceEntry {
  usd: number
  fetchedAt: number
}

const priceCache = new Map<string, PriceEntry>()

export interface TokenPrices {
  [coingeckoId: string]: number
}

async function fetchPrices(ids: string[]): Promise<TokenPrices> {
  if (ids.length === 0) return {}
  const joined = ids.join(',')
  const url = `${COINGECKO_API_URL}/simple/price?ids=${joined}&vs_currencies=usd`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`)
  const data = await res.json()
  const result: TokenPrices = {}
  for (const id of ids) {
    if (data[id]?.usd !== undefined) {
      result[id] = data[id].usd
    }
  }
  return result
}

export function useTokenPrices(coingeckoIds?: string[]): {
  prices: TokenPrices
  loading: boolean
  error: string | null
  refetch: () => void
} {
  const allIds =
    coingeckoIds ??
    SUI_TOKENS.filter((t) => t.coingeckoId).map((t) => t.coingeckoId as string)

  const [prices, setPrices] = useState<TokenPrices>(() => {
    const cached: TokenPrices = {}
    const now = Date.now()
    for (const id of allIds) {
      const entry = priceCache.get(id)
      if (entry && now - entry.fetchedAt < PRICE_CACHE_TTL_MS) {
        cached[id] = entry.usd
      }
    }
    return cached
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    const now = Date.now()
    const stale = allIds.filter((id) => {
      const entry = priceCache.get(id)
      return !entry || now - entry.fetchedAt >= PRICE_CACHE_TTL_MS
    })
    if (stale.length === 0) return

    setLoading(true)
    setError(null)
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const fresh = await fetchPrices(stale)
      const fetchedAt = Date.now()
      for (const [id, usd] of Object.entries(fresh)) {
        priceCache.set(id, { usd, fetchedAt })
      }
      setPrices((prev) => ({ ...prev, ...fresh }))
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [allIds.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, PRICE_CACHE_TTL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      abortRef.current?.abort()
    }
  }, [load])

  return { prices, loading, error, refetch: load }
}

export function useTokenPrice(coingeckoId: string | undefined): number | null {
  const { prices } = useTokenPrices(coingeckoId ? [coingeckoId] : [])
  if (!coingeckoId) return null
  return prices[coingeckoId] ?? null
}

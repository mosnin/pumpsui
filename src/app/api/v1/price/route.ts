/**
 * GET /api/v1/price?tokens=SUI,USDC,CETUS
 *
 * Returns current USD prices for the requested tokens.
 * Data sourced from CoinGecko (primary) and Pyth Network (high-frequency).
 * Cached for 15 seconds to balance freshness and API rate limits.
 *
 * Query parameters:
 *  - tokens  (required) Comma-separated list of token symbols or fully-qualified
 *             Sui type strings (e.g. "SUI,USDC" or "0x2::sui::SUI,USDC")
 *
 * Responses:
 *  200 { prices: Record<string, PriceData>, updatedAt: string }
 *  400 { error: string }
 *  500 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { SUI_TOKENS } from '@/lib/tokens'
import { fetchPythPrices, PYTH_PRICE_IDS } from '@/lib/pyth'

export const runtime = 'nodejs'
export const revalidate = 0

const API_VERSION = '1.0.0'
const CACHE_TTL_SECONDS = 15

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PriceData {
  symbol: string
  priceUsd: number
  priceChange24h: number | null
  confidence: number | null
  /** "coingecko" | "pyth" | "coingecko+pyth" */
  source: string
  publishTime: string
}

// ---------------------------------------------------------------------------
// In-memory price cache (shared across requests in the same worker instance)
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: PriceData
  cachedAt: number
}

const priceCache = new Map<string, CacheEntry>()

function getCached(symbol: string): PriceData | null {
  const entry = priceCache.get(symbol)
  if (!entry) return null
  if (Date.now() - entry.cachedAt > CACHE_TTL_SECONDS * 1000) return null
  return entry.data
}

function setCache(symbol: string, data: PriceData): void {
  priceCache.set(symbol, { data, cachedAt: Date.now() })
}

// ---------------------------------------------------------------------------
// CoinGecko fetcher
// ---------------------------------------------------------------------------

interface CoinGeckoSimplePrice {
  [id: string]: { usd?: number; usd_24h_change?: number }
}

async function fetchCoingeckoPrices(
  ids: string[]
): Promise<Map<string, { price: number; change24h: number }>> {
  const result = new Map<string, { price: number; change24h: number }>()
  if (ids.length === 0) return result

  try {
    const url =
      `https://api.coingecko.com/api/v3/simple/price` +
      `?ids=${encodeURIComponent(ids.join(','))}&vs_currencies=usd&include_24hr_change=true`

    const res = await fetch(url, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(5_000),
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) return result

    const data = (await res.json()) as CoinGeckoSimplePrice
    for (const [id, values] of Object.entries(data)) {
      if (values.usd !== undefined) {
        result.set(id, { price: values.usd, change24h: values.usd_24h_change ?? 0 })
      }
    }
  } catch {
    // Best-effort — return what we have
  }

  return result
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const tokensParam = searchParams.get('tokens')

  if (!tokensParam) {
    return NextResponse.json(
      { error: 'Missing required parameter: tokens (comma-separated symbols or types)' },
      {
        status: 400,
        headers: { 'X-OmniWeave-Version': API_VERSION },
      }
    )
  }

  const requestedSymbols = tokensParam
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 20) // guard against abuse

  if (requestedSymbols.length === 0) {
    return NextResponse.json(
      { error: 'No valid token symbols provided' },
      { status: 400, headers: { 'X-OmniWeave-Version': API_VERSION } }
    )
  }

  // ── Resolve symbols to token metadata ─────────────────────────────────────
  const tokenMeta = new Map(
    SUI_TOKENS
      .filter(t => requestedSymbols.includes(t.symbol.toUpperCase()))
      .map(t => [t.symbol.toUpperCase(), t])
  )

  // ── Serve from cache where possible ───────────────────────────────────────
  const prices: Record<string, PriceData> = {}
  const needFetch: string[] = []

  for (const sym of requestedSymbols) {
    const cached = getCached(sym)
    if (cached) {
      prices[sym] = cached
    } else {
      needFetch.push(sym)
    }
  }

  if (needFetch.length > 0) {
    // ── CoinGecko fetch ──────────────────────────────────────────────────────
    const cgIds = needFetch
      .map(sym => tokenMeta.get(sym)?.coingeckoId)
      .filter((id): id is string => !!id)

    const cgIdToSymbol = new Map(
      needFetch
        .map(sym => [tokenMeta.get(sym)?.coingeckoId, sym])
        .filter((pair): pair is [string, string] => !!pair[0])
    )

    const cgPrices = await fetchCoingeckoPrices(cgIds)

    // ── Pyth fetch for supported assets ──────────────────────────────────────
    const pythSymbols = needFetch.filter(sym => sym in PYTH_PRICE_IDS)
    const pythIds = pythSymbols.map(
      sym => PYTH_PRICE_IDS[sym as keyof typeof PYTH_PRICE_IDS]
    )

    let pythPrices = new Map<string, { price: number; confidence: number; publishTime: number }>()
    if (pythIds.length > 0) {
      try {
        const rawPyth = await fetchPythPrices(pythIds)
        for (const [id, feed] of rawPyth) {
          // reverse-map: id → symbol
          const sym = Object.entries(PYTH_PRICE_IDS).find(([, v]) => v === id)?.[0]
          if (sym) {
            pythPrices.set(sym.toUpperCase(), {
              price: feed.price,
              confidence: feed.confidence,
              publishTime: feed.publishTime,
            })
          }
        }
      } catch {
        // Pyth is non-critical — CoinGecko covers most tokens
      }
    }

    // ── Merge and cache ───────────────────────────────────────────────────────
    const now = new Date().toISOString()

    for (const sym of needFetch) {
      const meta = tokenMeta.get(sym)
      const cgId = meta?.coingeckoId
      const cg = cgId ? cgPrices.get(cgId) : undefined
      const pyth = pythPrices.get(sym)

      if (!cg && !pyth) {
        // Unknown token — return a null-price entry so the caller knows we tried
        prices[sym] = {
          symbol: sym,
          priceUsd: 0,
          priceChange24h: null,
          confidence: null,
          source: 'unavailable',
          publishTime: now,
        }
        continue
      }

      // Prefer Pyth for real-time price (lower latency), CoinGecko for 24h change
      const priceUsd = pyth?.price ?? cg?.price ?? 0
      const source = pyth && cg ? 'coingecko+pyth' : pyth ? 'pyth' : 'coingecko'

      const entry: PriceData = {
        symbol: sym,
        priceUsd,
        priceChange24h: cg?.change24h ?? null,
        confidence: pyth?.confidence ?? null,
        source,
        publishTime: pyth ? new Date(pyth.publishTime * 1000).toISOString() : now,
      }

      setCache(sym, entry)
      prices[sym] = entry
    }
  }

  return NextResponse.json(
    {
      prices,
      updatedAt: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=30`,
        'X-OmniWeave-Version': API_VERSION,
      },
    }
  )
}

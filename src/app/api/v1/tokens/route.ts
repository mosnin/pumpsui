/**
 * GET /api/v1/tokens
 *
 * Returns the full token list supported by OmniWeave, enriched with live prices.
 * Cached for 60 seconds server-side; individual price data from CoinGecko.
 *
 * Query parameters:
 *  - search  (optional) Filter by symbol, name, or token type (case-insensitive)
 *  - limit   (optional) Max tokens to return (default 50, max 200)
 *  - verified (optional) "true" to return only verified tokens
 *
 * Responses:
 *  200 { tokens: Token[], total: number, updatedAt: string }
 *  500 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { SUI_TOKENS } from '@/lib/tokens'

export const runtime = 'nodejs'
export const revalidate = 60

const API_VERSION = '1.0.0'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublicToken {
  /** Fully-qualified Sui type string, e.g. "0x2::sui::SUI" */
  type: string
  /** Short ticker symbol */
  symbol: string
  /** Human-readable name */
  name: string
  /** Number of decimal places */
  decimals: number
  /** URL to token icon */
  logoURI: string | null
  /** Current USD price (null if unavailable) */
  priceUsd: number | null
  /** 24-hour price change percentage */
  priceChange24h: number | null
  /** Whether this is a verified/curated token */
  verified: boolean
  /** CoinGecko ID (null for tokens not on CoinGecko) */
  coingeckoId: string | null
  /** Popular tags, e.g. ["popular", "stablecoin"] */
  tags: string[]
}

// ---------------------------------------------------------------------------
// Price fetching
// ---------------------------------------------------------------------------

interface CoinGeckoSimplePrice {
  [id: string]: {
    usd?: number
    usd_24h_change?: number
  }
}

async function fetchCoinGeckoPrices(
  ids: string[]
): Promise<Map<string, { price: number; change24h: number }>> {
  const priceMap = new Map<string, { price: number; change24h: number }>()
  if (ids.length === 0) return priceMap

  const url =
    `https://api.coingecko.com/api/v3/simple/price` +
    `?ids=${encodeURIComponent(ids.join(','))}&vs_currencies=usd&include_24hr_change=true`

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      console.warn(`[/api/v1/tokens] CoinGecko responded with ${res.status}`)
      return priceMap
    }

    const data = (await res.json()) as CoinGeckoSimplePrice

    for (const [id, values] of Object.entries(data)) {
      if (values.usd !== undefined) {
        priceMap.set(id, {
          price: values.usd,
          change24h: values.usd_24h_change ?? 0,
        })
      }
    }
  } catch (err) {
    console.warn('[/api/v1/tokens] Price fetch failed:', err)
  }

  return priceMap
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.toLowerCase().trim() ?? ''
  const limitParam = searchParams.get('limit')
  const verifiedOnly = searchParams.get('verified') === 'true'
  const limit = clamp(parseInt(limitParam ?? '50', 10), 1, 200)

  // ── Filter tokens ──────────────────────────────────────────────────────────
  let tokens = SUI_TOKENS.filter(t => {
    if (verifiedOnly && !t.tags?.includes('popular')) return false
    if (!search) return true
    return (
      t.symbol.toLowerCase().includes(search) ||
      t.name.toLowerCase().includes(search) ||
      t.address.toLowerCase().includes(search)
    )
  }).slice(0, limit)

  // ── Fetch live prices ──────────────────────────────────────────────────────
  const coingeckoIds = tokens
    .map(t => t.coingeckoId)
    .filter((id): id is string => !!id)

  const prices = await fetchCoinGeckoPrices(coingeckoIds)

  // ── Assemble response ──────────────────────────────────────────────────────
  const enriched: PublicToken[] = tokens.map(t => ({
    type: t.address,
    symbol: t.symbol,
    name: t.name,
    decimals: t.decimals,
    logoURI: t.logoURI ?? null,
    priceUsd: t.coingeckoId ? (prices.get(t.coingeckoId)?.price ?? null) : null,
    priceChange24h: t.coingeckoId ? (prices.get(t.coingeckoId)?.change24h ?? null) : null,
    verified: Array.isArray(t.tags) && t.tags.length > 0,
    coingeckoId: t.coingeckoId ?? null,
    tags: t.tags ?? [],
  }))

  return NextResponse.json(
    {
      tokens: enriched,
      total: enriched.length,
      updatedAt: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-OmniWeave-Version': API_VERSION,
      },
    }
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min
}

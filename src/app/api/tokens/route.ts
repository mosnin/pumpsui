/**
 * GET /api/tokens
 *
 * Returns the list of tokens supported by OmniWeave, enriched with:
 *  - On-chain metadata (name, symbol, decimals, icon)
 *  - Current USD price (fetched from a price oracle / CoinGecko)
 *  - 24-hour price change percentage
 *
 * The response is cached for 60 seconds — prices update frequently but
 * sub-second freshness is not required for the token list.
 *
 * Query parameters:
 *  - search  (optional) Filter tokens by symbol or name substring (case-insensitive)
 *  - limit   (optional) Maximum number of tokens to return (default 50, max 200)
 *
 * Responses:
 *  200 { tokens: Token[], updatedAt: string }
 *  500 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 60 // Revalidate every 60 seconds (ISR)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Token {
  /** Fully-qualified Sui type string, e.g. "0x2::sui::SUI" */
  type: string
  /** Short ticker symbol, e.g. "SUI" */
  symbol: string
  /** Human-readable name, e.g. "Sui" */
  name: string
  /** Number of decimal places */
  decimals: number
  /** URL to token icon (can be null for unlisted tokens) */
  iconUrl: string | null
  /** USD price (null if unavailable) */
  priceUsd: number | null
  /** 24-hour price change as a percentage (null if unavailable) */
  priceChange24h: number | null
  /** Whether this token is a verified/trusted token */
  verified: boolean
  /** CoinGecko ID used for price lookups (null for tokens not on CoinGecko) */
  coingeckoId: string | null
}

// ---------------------------------------------------------------------------
// Static token registry
// ---------------------------------------------------------------------------

/**
 * Curated list of tokens supported on OmniWeave.
 * Extend this list as new tokens are listed on supported DEXes.
 * Token metadata (symbol, name, decimals) is static; prices are fetched live.
 */
const SUPPORTED_TOKENS: Omit<Token, 'priceUsd' | 'priceChange24h'>[] = [
  {
    type: '0x2::sui::SUI',
    symbol: 'SUI',
    name: 'Sui',
    decimals: 9,
    iconUrl: 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg',
    verified: true,
    coingeckoId: 'sui',
  },
  {
    // USDC bridged via Wormhole
    type: '0x5d4b302506645c37ff133b98c4b50a4ae3606ed::coin::COIN',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    iconUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
    verified: true,
    coingeckoId: 'usd-coin',
  },
  {
    // USDT bridged via Wormhole
    type: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    iconUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    verified: true,
    coingeckoId: 'tether',
  },
  {
    // ETH bridged via Wormhole
    type: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
    symbol: 'ETH',
    name: 'Ethereum (Wormhole)',
    decimals: 8,
    iconUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    verified: true,
    coingeckoId: 'ethereum',
  },
  {
    // BTC bridged via Wormhole
    type: '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',
    symbol: 'BTC',
    name: 'Bitcoin (Wormhole)',
    decimals: 8,
    iconUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    verified: true,
    coingeckoId: 'bitcoin',
  },
  {
    // CETUS governance token
    type: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    symbol: 'CETUS',
    name: 'Cetus Protocol',
    decimals: 9,
    iconUrl: 'https://assets.coingecko.com/coins/images/30188/small/cetus.png',
    verified: true,
    coingeckoId: 'cetus-protocol',
  },
  {
    // TURBOS governance token
    type: '0x5d1f47ea69bb0de31c313d7928bf0f45dee843799d038f2672dd3a63f8e4e6a0::turbos::TURBOS',
    symbol: 'TURBOS',
    name: 'Turbos Finance',
    decimals: 9,
    iconUrl: null,
    verified: true,
    coingeckoId: 'turbos-finance',
  },
  {
    // DEEP — DeepBook's token
    type: '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946fd85::deep::DEEP',
    symbol: 'DEEP',
    name: 'DeepBook',
    decimals: 6,
    iconUrl: null,
    verified: true,
    coingeckoId: null,
  },
  {
    // BUCK — Bucket Protocol stablecoin
    type: '0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK',
    symbol: 'BUCK',
    name: 'Bucket USD',
    decimals: 9,
    iconUrl: null,
    verified: true,
    coingeckoId: 'bucket-protocol',
  },
  {
    // vSUI — Aftermath staked SUI
    type: '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT',
    symbol: 'vSUI',
    name: 'Aftermath Staked SUI',
    decimals: 9,
    iconUrl: null,
    verified: true,
    coingeckoId: null,
  },
]

// ---------------------------------------------------------------------------
// Price fetching
// ---------------------------------------------------------------------------

interface CoinGeckoSimplePrice {
  [id: string]: {
    usd?: number
    usd_24h_change?: number
  }
}

/**
 * Fetch current USD prices for all tokens that have a coingeckoId.
 * Returns an empty map on any network error so the token list can still
 * be returned without prices rather than failing entirely.
 */
async function fetchPrices(
  coingeckoIds: string[]
): Promise<Map<string, { price: number; change24h: number }>> {
  const priceMap = new Map<string, { price: number; change24h: number }>()

  if (coingeckoIds.length === 0) return priceMap

  const ids = coingeckoIds.join(',')
  const url =
    `https://api.coingecko.com/api/v3/simple/price` +
    `?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true`

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 }, // use Next.js fetch cache
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      console.warn(`[/api/tokens] CoinGecko responded with ${res.status}`)
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
    console.warn('[/api/tokens] Price fetch failed:', err)
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
  const limit = clamp(parseInt(limitParam ?? '50', 10), 1, 200)

  // -------------------------------------------------------------------------
  // 1. Filter by search query
  // -------------------------------------------------------------------------
  let tokens = SUPPORTED_TOKENS.filter(t => {
    if (!search) return true
    return (
      t.symbol.toLowerCase().includes(search) ||
      t.name.toLowerCase().includes(search) ||
      t.type.toLowerCase().includes(search)
    )
  }).slice(0, limit)

  // -------------------------------------------------------------------------
  // 2. Fetch prices for tokens that have a CoinGecko ID
  // -------------------------------------------------------------------------
  const coingeckoIds = tokens
    .map(t => t.coingeckoId)
    .filter((id): id is string => id !== null)

  const prices = await fetchPrices(coingeckoIds)

  // -------------------------------------------------------------------------
  // 3. Assemble final token list
  // -------------------------------------------------------------------------
  const enrichedTokens: Token[] = tokens.map(t => ({
    ...t,
    priceUsd: t.coingeckoId ? (prices.get(t.coingeckoId)?.price ?? null) : null,
    priceChange24h: t.coingeckoId ? (prices.get(t.coingeckoId)?.change24h ?? null) : null,
  }))

  return NextResponse.json(
    {
      tokens: enrichedTokens,
      total: enrichedTokens.length,
      updatedAt: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
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

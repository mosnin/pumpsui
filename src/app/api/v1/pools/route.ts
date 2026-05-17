/**
 * GET /api/v1/pools
 *
 * Returns pool data for a token pair across all integrated DEXes.
 * Useful for external protocols that want to inspect available liquidity
 * before routing through OmniWeave.
 *
 * Query parameters:
 *  - tokenA  (required) Fully-qualified Sui token type
 *  - tokenB  (required) Fully-qualified Sui token type
 *  - dex     (optional) Filter by DEX id: "cetus" | "turbos" | "deepbook" | "aftermath" | "flowx" | "kriya"
 *
 * Responses:
 *  200 { pools: PoolInfo[], total: number, timestamp: string }
 *  400 { error: string }
 *  500 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getQuiClient } from '@/lib/suiClient'
import { DEX_ADAPTERS } from '@/lib/routing/dexAdapters'
import type { Pool } from '@/lib/routing/types'
import { DexId } from '@/lib/routing/types'

export const runtime = 'nodejs'
export const revalidate = 0

const API_VERSION = '1.0.0'

// ---------------------------------------------------------------------------
// Response type
// ---------------------------------------------------------------------------

export interface PoolInfo {
  /** On-chain pool object ID */
  poolId: string
  /** DEX identifier */
  dex: string
  /** First token type */
  tokenA: string
  /** Second token type */
  tokenB: string
  /** Raw reserve of tokenA in base units */
  reserveA: string
  /** Raw reserve of tokenB in base units */
  reserveB: string
  /** Swap fee in basis points */
  feeBps: number
  /** Total liquidity in pool (LP units or virtual for CLMMs) */
  liquidity: string
  /** Current sqrt price (Q64.64) — only for CLMM pools */
  sqrtPrice: string | null
  /** Whether this is a concentrated liquidity pool */
  isCLMM: boolean
  /** Estimated TVL in USD (null if price unavailable) */
  tvlUsd: number | null
  /** Estimated 24h volume in USD (null until indexer integration) */
  volume24hUsd: number | null
  /** Current price of tokenA in units of tokenB */
  price: number | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive the price of tokenA in tokenB from pool reserves. */
function computePrice(pool: Pool): number | null {
  if (pool.reserveA === 0n || pool.reserveB === 0n) return null
  // For CLMM pools with sqrtPrice, compute from that instead
  if (pool.sqrtPrice !== undefined && pool.sqrtPrice > 0n) {
    const sqrtPriceNum = Number(pool.sqrtPrice)
    // sqrtPrice is Q64.64: actual_price = (sqrtPrice / 2^64)^2
    const price = (sqrtPriceNum / 2 ** 64) ** 2
    return price > 0 ? price : null
  }
  return Number(pool.reserveB) / Number(pool.reserveA)
}

function serializePool(pool: Pool): PoolInfo {
  return {
    poolId: pool.id,
    dex: pool.dexId,
    tokenA: pool.tokenA,
    tokenB: pool.tokenB,
    reserveA: pool.reserveA.toString(),
    reserveB: pool.reserveB.toString(),
    feeBps: pool.fee,
    liquidity: pool.liquidity.toString(),
    sqrtPrice: pool.sqrtPrice !== undefined ? pool.sqrtPrice.toString() : null,
    isCLMM: pool.sqrtPrice !== undefined,
    tvlUsd: null, // TODO: compute from live token prices once price API is integrated
    volume24hUsd: null, // TODO: integrate with indexer
    price: computePrice(pool),
  }
}

const VALID_DEX_IDS = new Set<string>(Object.values(DexId))

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const tokenA = searchParams.get('tokenA')
  const tokenB = searchParams.get('tokenB')
  const dexFilter = searchParams.get('dex')?.toLowerCase()

  if (!tokenA) {
    return error('Missing required parameter: tokenA', 400)
  }
  if (!tokenB) {
    return error('Missing required parameter: tokenB', 400)
  }
  if (tokenA === tokenB) {
    return error('tokenA and tokenB must be different tokens', 400)
  }
  if (dexFilter && !VALID_DEX_IDS.has(dexFilter)) {
    return error(
      `Invalid dex filter. Supported values: ${Array.from(VALID_DEX_IDS).join(', ')}`,
      400
    )
  }

  let pools: Pool[]
  try {
    const client = getQuiClient()

    // Fan out pool fetches to all DEX adapters in parallel
    const adapters = dexFilter
      ? DEX_ADAPTERS.filter(a => a.dexId === dexFilter)
      : DEX_ADAPTERS

    const results = await Promise.all(
      adapters.map(adapter =>
        adapter.fetchPools(tokenA, tokenB, client).catch(err => {
          console.warn(`[/api/v1/pools] ${adapter.dexId} fetchPools failed:`, err)
          return [] as Pool[]
        })
      )
    )

    // Deduplicate by pool ID
    const seen = new Set<string>()
    pools = results.flat().filter(p => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
  } catch (err) {
    console.error('[/api/v1/pools] Error:', err)
    return error('Internal error fetching pool data', 500)
  }

  // Sort by liquidity descending (highest TVL first)
  pools.sort((a, b) => {
    const la = a.liquidity
    const lb = b.liquidity
    return la < lb ? 1 : la > lb ? -1 : 0
  })

  const serialized = pools.map(serializePool)

  return NextResponse.json(
    {
      pools: serialized,
      total: serialized.length,
      tokenA,
      tokenB,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-OmniWeave-Version': API_VERSION,
      },
    }
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function error(message: string, status: 400 | 500): NextResponse {
  return NextResponse.json(
    { error: message },
    { status, headers: { 'X-OmniWeave-Version': API_VERSION } }
  )
}

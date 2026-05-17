/**
 * GET /api/v1/quote
 *
 * Public versioned quote API — same routing engine as /api/quote plus:
 *  - API key support via x-api-key header
 *  - Rate limiting: 100 req/min (unauthenticated) · 1000 req/min (with key)
 *  - Enhanced response: routeDetails, gasEstimate, dexBreakdown
 *  - X-OmniWeave-Version response header
 *
 * Query parameters:
 *  - tokenIn    (required) Fully-qualified Sui token type, e.g. "0x2::sui::SUI"
 *  - tokenOut   (required) Fully-qualified Sui token type
 *  - amountIn   (required) Amount to sell in base units (integer string)
 *  - maxHops    (optional) Maximum route hops, default 3, max 4
 *  - maxSplits  (optional) Maximum split portions, default 3, max 4
 *  - slippage   (optional) Slippage in bps for minAmountOut calc, default 50
 *
 * Responses:
 *  200 { quote, minAmountOut, fee, routeDetails, gasEstimate, dexBreakdown, executedAt, params }
 *  400 { error: string }
 *  429 { error: 'Rate limit exceeded' }
 *  500 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getQuiClient } from '@/lib/suiClient'
import { OmniWeaveAggregator } from '@/lib/routing/aggregator'
import {
  applySlippage,
  computeProtocolFee,
  amountAfterFee,
  OMNIWEAVE_FEE_BPS,
} from '@/lib/routing/transactionBuilder'
import type { QuoteResult, Route, SplitRoute } from '@/lib/routing/types'

export const runtime = 'nodejs'
export const revalidate = 0

const API_VERSION = '1.0.0'

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter
// In production, replace with Redis/Upstash for multi-instance correctness.
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

/** Returns true when the request is within the allowed rate limit. */
function checkRateLimit(ip: string, apiKey: string | null): boolean {
  const limit = apiKey ? 1000 : 100 // requests per minute
  const key = apiKey ?? ip
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 })
    return true
  }

  if (entry.count >= limit) return false
  entry.count++
  return true
}

/** Returns the remaining count and reset timestamp for a given key. */
function getRateLimitInfo(
  ip: string,
  apiKey: string | null
): { remaining: number; resetAt: number; limit: number } {
  const limit = apiKey ? 1000 : 100
  const key = apiKey ?? ip
  const entry = rateLimitMap.get(key)
  if (!entry) return { remaining: limit, resetAt: Date.now() + 60_000, limit }
  return {
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
    limit,
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const apiKey = request.headers.get('x-api-key')

  // ── Rate limiting ──────────────────────────────────────────────────────────
  if (!checkRateLimit(ip, apiKey)) {
    const info = getRateLimitInfo(ip, apiKey)
    return NextResponse.json(
      { error: 'Rate limit exceeded. Provide an x-api-key header for higher limits.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(info.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(info.resetAt / 1000)),
          'X-OmniWeave-Version': API_VERSION,
        },
      }
    )
  }

  const { searchParams } = new URL(request.url)

  // ── Parse & validate parameters ───────────────────────────────────────────
  const tokenIn = searchParams.get('tokenIn')
  const tokenOut = searchParams.get('tokenOut')
  const amountInStr = searchParams.get('amountIn')
  const maxHopsStr = searchParams.get('maxHops')
  const maxSplitsStr = searchParams.get('maxSplits')
  const slippageStr = searchParams.get('slippage') ?? '50'

  if (!tokenIn) return errorResponse('Missing required parameter: tokenIn', 400)
  if (!tokenOut) return errorResponse('Missing required parameter: tokenOut', 400)
  if (!amountInStr) return errorResponse('Missing required parameter: amountIn', 400)
  if (tokenIn === tokenOut) return errorResponse('tokenIn and tokenOut must be different tokens', 400)

  let amountIn: bigint
  try {
    amountIn = BigInt(amountInStr)
    if (amountIn <= 0n) throw new RangeError('amountIn must be positive')
  } catch {
    return errorResponse('Invalid amountIn: must be a positive integer string', 400)
  }

  const maxHops = clamp(parseInt(maxHopsStr ?? '3', 10), 1, 4)
  const maxSplits = clamp(parseInt(maxSplitsStr ?? '3', 10), 1, 4)
  const slippageBps = clamp(parseInt(slippageStr, 10), 0, 5_000)

  // ── Deduct OmniWeave protocol fee ──────────────────────────────────────────
  const protocolFeeAmount = computeProtocolFee(amountIn)
  const amountInAfterFee = amountAfterFee(amountIn)

  // ── Run the aggregator ────────────────────────────────────────────────────
  let quote: QuoteResult
  try {
    const client = getQuiClient()
    const aggregator = new OmniWeaveAggregator(client)
    quote = await aggregator.getQuote(tokenIn, tokenOut, amountInAfterFee, {
      maxHops,
      maxSplits,
    })
  } catch (err) {
    console.error('[/api/v1/quote] Aggregator error:', err)
    return errorResponse('Internal error computing quote', 500)
  }

  // ── Compute minAmountOut ───────────────────────────────────────────────────
  const minAmountOut =
    quote.outputAmount > 0n ? applySlippage(quote.outputAmount, slippageBps) : 0n

  // ── Build enhanced response ───────────────────────────────────────────────
  const serializedQuote = serializeQuote(quote)
  const routeDetails = buildRouteDetails(quote)
  const gasEstimate = extractGasEstimate(quote)
  const dexBreakdown = buildDexBreakdown(quote)

  const info = getRateLimitInfo(ip, apiKey)

  const body = {
    quote: serializedQuote,
    minAmountOut: minAmountOut.toString(),
    slippageBps,
    fee: {
      bps: Number(OMNIWEAVE_FEE_BPS),
      amountIn: protocolFeeAmount.toString(),
      amountInAfterFee: amountInAfterFee.toString(),
    },
    // Enhanced fields (v1 additions)
    routeDetails,
    gasEstimate,
    dexBreakdown,
    executedAt: new Date().toISOString(),
    params: {
      tokenIn,
      tokenOut,
      amountIn: amountIn.toString(),
      maxHops,
      maxSplits,
    },
  }

  return NextResponse.json(body, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=1',
      'X-OmniWeave-Version': API_VERSION,
      'X-RateLimit-Limit': String(info.limit),
      'X-RateLimit-Remaining': String(info.remaining),
      'X-RateLimit-Reset': String(Math.ceil(info.resetAt / 1000)),
    },
  })
}

// ---------------------------------------------------------------------------
// Enhanced response builders
// ---------------------------------------------------------------------------

/**
 * Human-readable breakdown of the selected route's hops.
 * Useful for displaying "SUI → USDC → CETUS" with per-hop details.
 */
function buildRouteDetails(quote: QuoteResult) {
  if (quote.useSplit && quote.bestSplitRoute) {
    return {
      type: 'split' as const,
      portions: quote.bestSplitRoute.routes.map(({ route, portionBps }) => ({
        portionBps,
        portionPct: (portionBps / 100).toFixed(1),
        inputAmount: route.inputAmount.toString(),
        outputAmount: route.outputAmount.toString(),
        priceImpact: route.priceImpact,
        hops: route.path.length,
        path: route.path.map(step => ({
          dex: step.pool.dexId,
          poolId: step.pool.id,
          tokenIn: step.tokenIn,
          tokenOut: step.tokenOut,
          amountIn: step.amountIn.toString(),
          amountOut: step.amountOut.toString(),
          feeBps: step.pool.fee,
        })),
      })),
    }
  }

  if (quote.bestRoute) {
    return {
      type: 'single' as const,
      hops: quote.bestRoute.path.length,
      path: quote.bestRoute.path.map(step => ({
        dex: step.pool.dexId,
        poolId: step.pool.id,
        tokenIn: step.tokenIn,
        tokenOut: step.tokenOut,
        amountIn: step.amountIn.toString(),
        amountOut: step.amountOut.toString(),
        feeBps: step.pool.fee,
      })),
    }
  }

  return null
}

/** Sum of gas estimates across all route hops (in MIST). */
function extractGasEstimate(quote: QuoteResult): {
  totalMist: string
  totalSui: string
} {
  let totalMist = 0n

  if (quote.useSplit && quote.bestSplitRoute) {
    for (const { route } of quote.bestSplitRoute.routes) {
      totalMist += route.gasEstimate
    }
  } else if (quote.bestRoute) {
    totalMist = quote.bestRoute.gasEstimate
  }

  return {
    totalMist: totalMist.toString(),
    totalSui: (Number(totalMist) / 1e9).toFixed(6),
  }
}

/**
 * Shows which DEXes are used and what percentage of volume each gets.
 * Useful for analytics and understanding routing decisions.
 */
function buildDexBreakdown(quote: QuoteResult): Array<{
  dex: string
  portionBps: number
  portionPct: string
  poolIds: string[]
}> {
  const dexMap = new Map<string, { portionBps: number; poolIds: Set<string> }>()

  const addRoute = (route: Route, weight: number) => {
    for (const step of route.path) {
      const dex = step.pool.dexId
      const existing = dexMap.get(dex) ?? { portionBps: 0, poolIds: new Set<string>() }
      existing.portionBps += weight
      existing.poolIds.add(step.pool.id)
      dexMap.set(dex, existing)
    }
  }

  if (quote.useSplit && quote.bestSplitRoute) {
    for (const { route, portionBps } of quote.bestSplitRoute.routes) {
      addRoute(route, portionBps)
    }
  } else if (quote.bestRoute) {
    addRoute(quote.bestRoute, 10_000)
  }

  return Array.from(dexMap.entries()).map(([dex, { portionBps, poolIds }]) => ({
    dex,
    portionBps,
    portionPct: (portionBps / 100).toFixed(1),
    poolIds: Array.from(poolIds),
  }))
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function errorResponse(message: string, status: 400 | 429 | 500): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { 'X-OmniWeave-Version': API_VERSION },
    }
  )
}

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min
}

/** Convert a QuoteResult (which contains bigint fields) to a JSON-safe object. */
function serializeQuote(quote: QuoteResult): object {
  return {
    useSplit: quote.useSplit,
    outputAmount: quote.outputAmount.toString(),
    priceImpact: quote.priceImpact,
    executionPrice: quote.executionPrice,
    midPrice: quote.midPrice,
    bestRoute: quote.bestRoute
      ? {
          inputAmount: quote.bestRoute.inputAmount.toString(),
          outputAmount: quote.bestRoute.outputAmount.toString(),
          priceImpact: quote.bestRoute.priceImpact,
          gasEstimate: quote.bestRoute.gasEstimate.toString(),
          path: quote.bestRoute.path.map(step => ({
            dexId: step.pool.dexId,
            poolId: step.pool.id,
            tokenIn: step.tokenIn,
            tokenOut: step.tokenOut,
            amountIn: step.amountIn.toString(),
            amountOut: step.amountOut.toString(),
            fee: step.pool.fee,
          })),
        }
      : null,
    bestSplitRoute: quote.bestSplitRoute
      ? {
          totalOutput: quote.bestSplitRoute.totalOutput.toString(),
          priceImpact: quote.bestSplitRoute.priceImpact,
          routes: quote.bestSplitRoute.routes.map(({ route, portionBps }) => ({
            portionBps,
            inputAmount: route.inputAmount.toString(),
            outputAmount: route.outputAmount.toString(),
            dexId: route.path[0]?.pool.dexId,
            poolId: route.path[0]?.pool.id,
          })),
        }
      : null,
  }
}

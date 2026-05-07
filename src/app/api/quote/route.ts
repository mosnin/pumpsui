/**
 * GET /api/quote
 *
 * Returns a swap quote from the OmniWeave routing engine.
 *
 * Query parameters:
 *  - tokenIn    (required) Fully-qualified Sui token type, e.g. "0x2::sui::SUI"
 *  - tokenOut   (required) Fully-qualified Sui token type
 *  - amountIn   (required) Amount to sell in base units (integer string, no decimals)
 *  - maxHops    (optional) Maximum route hops, default 3, max 4
 *  - maxSplits  (optional) Maximum split portions, default 3, max 4
 *  - slippage   (optional) Slippage in bps for minAmountOut calc, default 50
 *
 * Responses:
 *  200 { quote: QuoteResult, minAmountOut: string, executedAt: string }
 *  400 { error: string }
 *  500 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getQuiClient } from '@/lib/suiClient'
import { OmniWeaveAggregator } from '@/lib/routing/aggregator'
import { applySlippage } from '@/lib/routing/transactionBuilder'
import type { QuoteResult } from '@/lib/routing/types'

// Cache duration for identical requests (ms)
const CACHE_TTL_MS = 3_000

export const runtime = 'nodejs'
// Disable Next.js response caching — quotes must always be fresh
export const revalidate = 0

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)

  // -------------------------------------------------------------------------
  // 1. Parse & validate parameters
  // -------------------------------------------------------------------------
  const tokenIn = searchParams.get('tokenIn')
  const tokenOut = searchParams.get('tokenOut')
  const amountInStr = searchParams.get('amountIn')
  const maxHopsStr = searchParams.get('maxHops')
  const maxSplitsStr = searchParams.get('maxSplits')
  const slippageStr = searchParams.get('slippage') ?? '50'

  if (!tokenIn) {
    return errorResponse('Missing required parameter: tokenIn', 400)
  }
  if (!tokenOut) {
    return errorResponse('Missing required parameter: tokenOut', 400)
  }
  if (!amountInStr) {
    return errorResponse('Missing required parameter: amountIn', 400)
  }
  if (tokenIn === tokenOut) {
    return errorResponse('tokenIn and tokenOut must be different tokens', 400)
  }

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

  // -------------------------------------------------------------------------
  // 2. Run the aggregator
  // -------------------------------------------------------------------------
  let quote: QuoteResult
  try {
    const client = getQuiClient()
    const aggregator = new OmniWeaveAggregator(client)

    quote = await aggregator.getQuote(tokenIn, tokenOut, amountIn, {
      maxHops,
      maxSplits,
    })
  } catch (err) {
    console.error('[/api/quote] Aggregator error:', err)
    return errorResponse('Internal error computing quote', 500)
  }

  // -------------------------------------------------------------------------
  // 3. Compute minAmountOut with slippage
  // -------------------------------------------------------------------------
  const minAmountOut =
    quote.outputAmount > 0n
      ? applySlippage(quote.outputAmount, slippageBps)
      : 0n

  // -------------------------------------------------------------------------
  // 4. Serialize & return
  // -------------------------------------------------------------------------
  const body = {
    quote: serializeQuote(quote),
    minAmountOut: minAmountOut.toString(),
    slippageBps,
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
      'Cache-Control': `public, s-maxage=${CACHE_TTL_MS / 1000}, stale-while-revalidate=1`,
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function errorResponse(message: string, status: 400 | 500): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min
}

/**
 * Convert a QuoteResult (which contains bigint fields) to a JSON-safe object.
 * BigInts are serialised as decimal strings so they survive JSON.stringify.
 */
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

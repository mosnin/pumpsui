/**
 * GET /api/cross-chain-quote
 *
 * Returns a unified cross-chain quote: bridge quote + optional DEX swap quote.
 *
 * Query parameters:
 *  - fromChainId  (required) Source chain ID (e.g. 1 for Ethereum)
 *  - fromToken    (required) Token address or symbol on the source chain
 *  - toToken      (required) Desired Sui coin type (fully qualified)
 *  - amount       (required) Amount in source token base units (integer string)
 *  - recipient    (optional) Destination Sui address
 *
 * Response:
 *  200 { quote: CrossChainQuote, timestamp: number }
 *  400 { error: string }
 *  404 { error: string }   — no bridge route found
 *  500 { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCrossChainQuote } from '@/lib/crossChainQuote'
import type { CrossChainQuote } from '@/lib/crossChainQuote'

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = req.nextUrl

    const fromChainIdStr = searchParams.get('fromChainId')
    const fromToken      = searchParams.get('fromToken')
    const toToken        = searchParams.get('toToken')
    const amountStr      = searchParams.get('amount')
    const recipient      = searchParams.get('recipient') ?? '0x0000000000000000000000000000000000000001'

    // ── Validation ─────────────────────────────────────────────────────────────
    const missing = [
      !fromChainIdStr && 'fromChainId',
      !fromToken      && 'fromToken',
      !toToken        && 'toToken',
      !amountStr      && 'amount',
    ].filter(Boolean)

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required parameters: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    const fromChainId = parseInt(fromChainIdStr!, 10)
    if (isNaN(fromChainId)) {
      return NextResponse.json({ error: 'fromChainId must be an integer' }, { status: 400 })
    }

    let amount: bigint
    try {
      amount = BigInt(amountStr!)
      if (amount <= 0n) throw new RangeError('amount must be positive')
    } catch {
      return NextResponse.json(
        { error: 'amount must be a positive integer string (in base units)' },
        { status: 400 }
      )
    }

    // ── Fetch quote ────────────────────────────────────────────────────────────
    const quote = await getCrossChainQuote({
      fromChainId,
      fromToken: fromToken!,
      toToken: toToken!,
      amount,
      recipient,
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'No bridge route found for this token pair and chain' },
        { status: 404 }
      )
    }

    // Serialize bigint fields for JSON transport
    return NextResponse.json(
      {
        quote: serializeQuote(quote),
        timestamp: Date.now(),
        params: { fromChainId, fromToken, toToken, amount: amount.toString(), recipient },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (err) {
    console.error('[cross-chain-quote] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

// ── Serialization helper ───────────────────────────────────────────────────────

function serializeQuote(q: CrossChainQuote): object {
  return {
    intermediateToken: q.intermediateToken,
    finalToken: q.finalToken,
    totalTimeSeconds: q.totalTimeSeconds,
    totalFeeUSD: q.totalFeeUSD,
    estimatedOutput: q.estimatedOutput.toString(),
    priceImpact: q.priceImpact,
    bridgeQuote: {
      ...q.bridgeQuote,
      fromAmount: q.bridgeQuote.fromAmount.toString(),
      toAmount:   q.bridgeQuote.toAmount.toString(),
      fee:        q.bridgeQuote.fee.toString(),
    },
    swapQuote: q.swapQuote
      ? {
          ...q.swapQuote,
          inputAmount:  q.swapQuote.inputAmount.toString(),
          outputAmount: q.swapQuote.outputAmount.toString(),
        }
      : null,
    steps: q.steps.map((step) => {
      if (step.type === 'bridge') {
        return {
          type: 'bridge',
          fromChain: step.fromChain,
          toChain: step.toChain,
          bridge: {
            ...step.bridge,
            fromAmount: step.bridge.fromAmount.toString(),
            toAmount:   step.bridge.toAmount.toString(),
            fee:        step.bridge.fee.toString(),
          },
        }
      }
      return {
        type: 'swap',
        dexId: step.dexId,
        tokenIn: step.tokenIn,
        tokenOut: step.tokenOut,
        amountIn:  step.amountIn.toString(),
        amountOut: step.amountOut.toString(),
      }
    }),
  }
}

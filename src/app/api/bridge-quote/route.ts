/**
 * Bridge quote API endpoint.
 *
 * GET /api/bridge-quote?fromChainId=1&toChainId=784&fromToken=0x...&toToken=0x...&amount=1000000&recipient=0x...
 *
 * Returns: sorted array of BridgeQuote objects from all compatible bridges.
 * Failed bridge adapters are silently excluded (best-effort aggregation).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllBridgeQuotes } from '@/lib/bridges'
import type { BridgeQuoteParams } from '@/lib/bridges/types'

/** Cache header: quotes are valid for 15 seconds */
const CACHE_MAX_AGE = 15

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl

    // ── Parse & validate params ──────────────────────────────────────────────

    const fromChainIdStr = searchParams.get('fromChainId')
    const toChainIdStr   = searchParams.get('toChainId')
    const fromToken      = searchParams.get('fromToken')
    const toToken        = searchParams.get('toToken')
    const amountStr      = searchParams.get('amount')
    const recipient      = searchParams.get('recipient')

    const missing = [
      !fromChainIdStr && 'fromChainId',
      !toChainIdStr   && 'toChainId',
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
    const toChainId   = parseInt(toChainIdStr!, 10)
    let   amount: bigint

    if (isNaN(fromChainId) || isNaN(toChainId)) {
      return NextResponse.json(
        { error: 'fromChainId and toChainId must be integers' },
        { status: 400 }
      )
    }

    try {
      amount = BigInt(amountStr!)
    } catch {
      return NextResponse.json(
        { error: 'amount must be a valid integer (in base units)' },
        { status: 400 }
      )
    }

    // ── Fetch quotes ─────────────────────────────────────────────────────────

    const params: BridgeQuoteParams = {
      fromChainId,
      toChainId,
      fromToken: fromToken!,
      toToken: toToken!,
      amount,
      recipient: recipient ?? '0x0000000000000000000000000000000000000001',
    }

    const quotes = await getAllBridgeQuotes(params)

    // Serialize BigInt fields to strings for JSON
    const serialized = quotes.map((q) => ({
      ...q,
      fromAmount:  q.fromAmount.toString(),
      toAmount:    q.toAmount.toString(),
      fee:         q.fee.toString(),
    }))

    return NextResponse.json(
      {
        quotes: serialized,
        count: serialized.length,
        params: {
          fromChainId,
          toChainId,
          fromToken,
          toToken,
          amount: amount.toString(),
        },
        timestamp: Date.now(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=60`,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (err) {
    console.error('[bridge-quote] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bridge-quote
 * Accepts the same params as JSON body (useful for non-GET-safe addresses).
 */
export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { fromChainId, toChainId, fromToken, toToken, amount, recipient } = body as {
      fromChainId?: unknown
      toChainId?: unknown
      fromToken?: unknown
      toToken?: unknown
      amount?: unknown
      recipient?: unknown
    }

    if (!fromChainId || !toChainId || !fromToken || !toToken || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: fromChainId, toChainId, fromToken, toToken, amount' },
        { status: 400 }
      )
    }

    const params: BridgeQuoteParams = {
      fromChainId: Number(fromChainId),
      toChainId:   Number(toChainId),
      fromToken:   String(fromToken),
      toToken:     String(toToken),
      amount:      BigInt(String(amount)),
      recipient:   String(recipient ?? '0x0000000000000000000000000000000000000001'),
    }

    const quotes = await getAllBridgeQuotes(params)
    const serialized = quotes.map((q) => ({
      ...q,
      fromAmount: q.fromAmount.toString(),
      toAmount:   q.toAmount.toString(),
      fee:        q.fee.toString(),
    }))

    return NextResponse.json({ quotes: serialized, count: serialized.length })
  } catch (err) {
    console.error('[bridge-quote] POST error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}

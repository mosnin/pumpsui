/**
 * GET /api/chart?token=SUI&vs=USDC&timeframe=1h&limit=200
 *
 * Returns OHLCV candlestick data. Proxies to CoinGecko free API
 * and falls back to deterministic synthetic data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchChartData, generateCandleData, type Timeframe } from '@/lib/chartData'

export const runtime = 'nodejs'
export const revalidate = 60

const VALID_TIMEFRAMES = new Set<string>(['1m', '5m', '15m', '1h', '4h', '1d', '1w'])

const BASE_PRICES: Record<string, number> = {
  SUI: 1.42, USDC: 1.0, USDT: 1.0,
  WETH: 3_210, WBTC: 67_400,
  CETUS: 0.28, DEEP: 0.18,
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const token     = (searchParams.get('token') ?? searchParams.get('symbol') ?? 'SUI').toUpperCase()
  const vsToken   = (searchParams.get('vs') ?? 'USDC').toUpperCase()
  const timeframe = (searchParams.get('timeframe') ?? searchParams.get('range') ?? '1h') as Timeframe
  const limit     = Math.min(500, Math.max(10, parseInt(searchParams.get('limit') ?? '200', 10)))

  if (!VALID_TIMEFRAMES.has(timeframe)) {
    return NextResponse.json({ error: `Invalid timeframe. Valid: ${[...VALID_TIMEFRAMES].join(', ')}` }, { status: 400 })
  }

  let candles
  try {
    candles = await fetchChartData({ tokenIn: token, tokenOut: vsToken, timeframe, limit })
  } catch {
    candles = generateCandleData(BASE_PRICES[token] ?? 1.0, timeframe, limit)
  }

  return NextResponse.json(
    { candles, token, vsToken, timeframe },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    }
  )
}

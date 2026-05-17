/**
 * GET /api/ws/prices?tokens=SUI,USDC,WETH
 *
 * Server-Sent Events stream of live price updates every 3 seconds.
 * Next.js 14 App Router does not support native WebSockets; SSE is the
 * correct primitive for one-way server→client streaming.
 *
 * Event format:
 *   data: {"SUI":{"price":1.2038,"change24h":2.3,"timestamp":"2024-…"}}\n\n
 */

import { NextRequest } from 'next/server'
import { SUI_TOKENS } from '@/lib/tokens'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PriceData {
  price: number
  change24h: number
  timestamp: string
}

type PriceMap = Record<string, PriceData>

// ─── Token → CoinGecko ID mapping ─────────────────────────────────────────────

/** Build a symbol→coingeckoId map from the shared token registry. */
function buildGeckoMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const token of SUI_TOKENS) {
    if (token.coingeckoId) {
      map[token.symbol.toUpperCase()] = token.coingeckoId
    }
  }
  return map
}

const GECKO_IDS = buildGeckoMap()

// ─── CoinGecko simple/price response ──────────────────────────────────────────

interface CoinGeckoSimplePrice {
  [id: string]: {
    usd?: number
    usd_24h_change?: number
    last_updated_at?: number
  }
}

async function fetchPricesForTokens(tokens: string[]): Promise<PriceMap> {
  const result: PriceMap = {}

  const ids = tokens
    .map((t) => GECKO_IDS[t.toUpperCase()])
    .filter((id): id is string => Boolean(id))

  if (ids.length === 0) return result

  const idToSymbol = new Map<string, string>()
  for (const token of tokens) {
    const id = GECKO_IDS[token.toUpperCase()]
    if (id) idToSymbol.set(id, token.toUpperCase())
  }

  const url =
    `https://api.coingecko.com/api/v3/simple/price` +
    `?ids=${encodeURIComponent(ids.join(','))}` +
    `&vs_currencies=usd` +
    `&include_24hr_change=true` +
    `&include_last_updated_at=true`

  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(6_000),
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) return result

  const data = (await res.json()) as CoinGeckoSimplePrice

  for (const [id, values] of Object.entries(data)) {
    const symbol = idToSymbol.get(id)
    if (!symbol || values.usd === undefined) continue

    result[symbol] = {
      price: values.usd,
      change24h: values.usd_24h_change ?? 0,
      timestamp:
        values.last_updated_at !== undefined
          ? new Date(values.last_updated_at * 1000).toISOString()
          : new Date().toISOString(),
    }
  }

  return result
}

// ─── SSE route handler ────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<Response> {
  const tokenParam = request.nextUrl.searchParams.get('tokens') ?? 'SUI'
  const tokens = tokenParam
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 20) // guard against abuse

  const encoder = new TextEncoder()
  let intervalId: ReturnType<typeof setInterval> | undefined

  const stream = new ReadableStream({
    start(controller) {
      const sendPrices = async () => {
        try {
          const prices = await fetchPricesForTokens(tokens)
          if (Object.keys(prices).length > 0) {
            const payload = `data: ${JSON.stringify(prices)}\n\n`
            controller.enqueue(encoder.encode(payload))
          }
        } catch {
          // Skip failed updates silently — client reconnects on error
        }
      }

      // Send immediately, then every 3 seconds
      void sendPrices()
      intervalId = setInterval(() => void sendPrices(), 3_000)
    },
    cancel() {
      if (intervalId !== undefined) clearInterval(intervalId)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

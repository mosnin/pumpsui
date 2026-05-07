// Pyth Network price feeds for Sui
// Pyth on-chain package: 0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e
// Hermes REST/SSE endpoint for off-chain price data

const HERMES_API = 'https://hermes.pyth.network/v2'

// Pyth price feed IDs — hex-encoded 32-byte identifiers
export const PYTH_PRICE_IDS = {
  SUI:  '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
  BTC:  '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  ETH:  '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  USDC: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  USDT: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  SOL:  '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
} as const

export type PythAsset = keyof typeof PYTH_PRICE_IDS

export interface PriceFeedData {
  /** Hex-encoded price feed ID */
  id: string
  /** Price in USD (scaled by 10^exponent) */
  price: number
  /** Confidence interval (same scale as price) */
  confidence: number
  /** Negative exponent — multiply raw price by 10^exponent to get USD value */
  exponent: number
  /** Unix timestamp (seconds) of when the price was published on-chain */
  publishTime: number
}

// ─── Internal Hermes API response shape ──────────────────────────────────────

interface HermesPriceComponent {
  price: string
  conf: string
  expo: number
  publish_time: number
}

interface HermesParsedEntry {
  id: string
  price: HermesPriceComponent
  ema_price: HermesPriceComponent
}

interface HermesLatestResponse {
  parsed: HermesParsedEntry[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a Hermes parsed entry into a clean PriceFeedData object.
 * The raw price/conf are integer strings; the actual USD value is
 * price * 10^exponent (exponent is negative, e.g. -8).
 */
function parsePriceFeedEntry(entry: HermesParsedEntry): PriceFeedData {
  const expo = entry.price.expo
  const scale = Math.pow(10, expo)
  return {
    id:          `0x${entry.id}`,
    price:       parseInt(entry.price.price, 10) * scale,
    confidence:  parseInt(entry.price.conf, 10) * scale,
    exponent:    expo,
    publishTime: entry.price.publish_time,
  }
}

/**
 * Strip the leading "0x" prefix that Pyth IDs may or may not carry,
 * so we can safely append them as query parameters.
 */
function normaliseId(id: string): string {
  return id.startsWith('0x') ? id.slice(2) : id
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch the latest price data for a list of Pyth price feed IDs.
 *
 * Uses the Hermes REST endpoint `GET /v2/updates/price/latest` which returns
 * a parsed price for every requested ID in a single round-trip.
 *
 * @param priceIds - Array of hex-encoded price feed IDs (with or without 0x prefix)
 * @returns A Map keyed by the full "0x…" price feed ID
 * @throws When the network request fails or returns a non-OK status
 */
export async function fetchPythPrices(
  priceIds: string[],
): Promise<Map<string, PriceFeedData>> {
  if (priceIds.length === 0) return new Map()

  const params = new URLSearchParams()
  for (const id of priceIds) {
    params.append('ids[]', normaliseId(id))
  }

  const url = `${HERMES_API}/updates/price/latest?${params.toString()}`
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(
      `Pyth Hermes request failed: ${response.status} ${response.statusText}`,
    )
  }

  const body = (await response.json()) as HermesLatestResponse
  const result = new Map<string, PriceFeedData>()

  for (const entry of body.parsed ?? []) {
    const feed = parsePriceFeedEntry(entry)
    result.set(feed.id, feed)
  }

  return result
}

/**
 * Subscribe to real-time Pyth price updates via Server-Sent Events (SSE).
 *
 * The Hermes streaming endpoint pushes a new event whenever any of the
 * requested price feeds is updated on-chain (typically every ~400 ms).
 *
 * @param priceIds  - Array of hex-encoded price feed IDs
 * @param onUpdate  - Callback invoked with the latest prices map on each update
 * @returns An unsubscribe function — call it to close the SSE connection
 */
export function subscribeToPythPrices(
  priceIds: string[],
  onUpdate: (prices: Map<string, PriceFeedData>) => void,
): () => void {
  if (priceIds.length === 0) return () => {}

  const params = new URLSearchParams()
  for (const id of priceIds) {
    params.append('ids[]', normaliseId(id))
  }

  // Hermes SSE stream — delivers parsed updates without requiring encoding
  const url = `${HERMES_API}/updates/price/stream?${params.toString()}&parsed=true`
  const source = new EventSource(url)

  source.addEventListener('message', (event: MessageEvent<string>) => {
    try {
      const body = JSON.parse(event.data) as HermesLatestResponse
      const prices = new Map<string, PriceFeedData>()
      for (const entry of body.parsed ?? []) {
        const feed = parsePriceFeedEntry(entry)
        prices.set(feed.id, feed)
      }
      if (prices.size > 0) onUpdate(prices)
    } catch {
      // Malformed frame — ignore and wait for the next one
    }
  })

  source.addEventListener('error', () => {
    // EventSource will attempt reconnection automatically; no action needed.
  })

  return () => source.close()
}

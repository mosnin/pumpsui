// CoinGecko API integration — free public tier
// Rate limit: ~10-30 requests/minute on the free tier.
// All callers should use the 30-second cache to stay well within limits.

import { COINGECKO_API_URL, PRICE_CACHE_TTL_MS } from '@/lib/constants'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface TokenPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  image: string
  last_updated: string
}

// ─── Module-level cache ───────────────────────────────────────────────────────

interface CacheEntry {
  data: TokenPrice
  timestamp: number
}

const priceCache = new Map<string, CacheEntry>()

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Return IDs whose cache entry is missing or older than PRICE_CACHE_TTL_MS. */
function staleIds(ids: string[]): string[] {
  const now = Date.now()
  return ids.filter((id) => {
    const entry = priceCache.get(id)
    return !entry || now - entry.timestamp >= PRICE_CACHE_TTL_MS
  })
}

/** Write a batch of CoinGecko market items into the module cache. */
function populateCache(items: CoinGeckoMarketItem[]): void {
  const now = Date.now()
  for (const item of items) {
    priceCache.set(item.id, {
      data: {
        id:                         item.id,
        symbol:                     item.symbol,
        name:                       item.name,
        current_price:              item.current_price,
        price_change_percentage_24h: item.price_change_percentage_24h ?? 0,
        market_cap:                 item.market_cap ?? 0,
        total_volume:               item.total_volume ?? 0,
        image:                      item.image ?? '',
        last_updated:               item.last_updated ?? new Date().toISOString(),
      },
      timestamp: now,
    })
  }
}

// ─── CoinGecko response shape ─────────────────────────────────────────────────

interface CoinGeckoMarketItem {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number | null
  total_volume: number | null
  price_change_percentage_24h: number | null
  last_updated: string | null
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch current prices and market data for a list of CoinGecko coin IDs.
 *
 * Results are served from an in-memory cache for up to 30 seconds (PRICE_CACHE_TTL_MS)
 * to avoid exhausting the free-tier rate limit.  Only IDs with stale/missing
 * cache entries trigger a network request.
 *
 * @param ids - CoinGecko coin IDs (e.g. "sui", "usd-coin", "weth")
 * @returns Map keyed by coin ID; IDs not found on CoinGecko are omitted
 * @throws When the API request fails
 */
export async function getTokenPrices(ids: string[]): Promise<Map<string, TokenPrice>> {
  if (ids.length === 0) return new Map()

  // Serve everything from cache when possible
  const toFetch = staleIds(ids)

  if (toFetch.length > 0) {
    const params = new URLSearchParams({
      vs_currency:           'usd',
      ids:                   toFetch.join(','),
      order:                 'market_cap_desc',
      per_page:              String(Math.min(toFetch.length, 250)),
      page:                  '1',
      sparkline:             'false',
      price_change_percentage: '24h',
    })

    const response = await fetch(
      `${COINGECKO_API_URL}/coins/markets?${params.toString()}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 0 } },
    )

    if (!response.ok) {
      throw new Error(
        `CoinGecko /coins/markets failed: ${response.status} ${response.statusText}`,
      )
    }

    const items = (await response.json()) as CoinGeckoMarketItem[]
    populateCache(items)
  }

  // Assemble result from cache (stale IDs that weren't found on CoinGecko are omitted)
  const result = new Map<string, TokenPrice>()
  for (const id of ids) {
    const entry = priceCache.get(id)
    if (entry) result.set(id, entry.data)
  }
  return result
}

/**
 * Fetch full metadata for a single coin by its CoinGecko ID.
 *
 * Uses the /coins/markets endpoint so the response is consistent with
 * getTokenPrices (same TokenPrice shape, same cache).
 *
 * @param id - CoinGecko coin ID (e.g. "sui")
 * @returns TokenPrice, or null if the coin is not found / request fails
 */
export async function getTokenMetadata(id: string): Promise<TokenPrice | null> {
  try {
    const map = await getTokenPrices([id])
    return map.get(id) ?? null
  } catch {
    return null
  }
}

/**
 * Invalidate a specific coin's cache entry, forcing the next call to
 * re-fetch from the API.
 */
export function invalidateTokenCache(id: string): void {
  priceCache.delete(id)
}

/**
 * Expose a read-only view of the cache size for monitoring/debugging.
 */
export function getCacheSize(): number {
  return priceCache.size
}

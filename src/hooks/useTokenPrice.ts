'use client'

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { getTokenPrices, type TokenPrice } from '@/lib/coingecko'

// ─── Single token ─────────────────────────────────────────────────────────────

/**
 * Fetch and auto-refresh the price data for a single token.
 *
 * Returns null data when `coingeckoId` is undefined (e.g. while the token
 * list is loading).  React Query will not fire a network request in that case.
 *
 * Refresh cadence:
 * - Refetch every 30s in the background (aligned with the CoinGecko cache TTL)
 * - Data is considered stale after 15s so UI shows a loading indicator on the
 *   second background refresh
 *
 * @param coingeckoId - CoinGecko coin ID (e.g. "sui", "usd-coin", "weth"), or undefined
 */
export function useTokenPrice(
  coingeckoId: string | undefined,
): UseQueryResult<TokenPrice | null, Error> {
  return useQuery<TokenPrice | null, Error>({
    queryKey: ['tokenPrice', coingeckoId],
    queryFn: async () => {
      if (!coingeckoId) return null
      const map = await getTokenPrices([coingeckoId])
      return map.get(coingeckoId) ?? null
    },
    enabled:         !!coingeckoId,
    refetchInterval: 30_000,
    staleTime:       15_000,
    retry:           2,
  })
}

// ─── Multiple tokens ──────────────────────────────────────────────────────────

/**
 * Fetch and auto-refresh price data for a list of tokens in a single request.
 *
 * The query key is derived from the sorted list of IDs so the cache is
 * stable regardless of the order the caller passes IDs in.
 *
 * @param coingeckoIds - Array of CoinGecko coin IDs
 */
export function useTokenPrices(
  coingeckoIds: string[],
): UseQueryResult<Map<string, TokenPrice>, Error> {
  // Sort so the cache key is order-independent
  const sortedKey = [...coingeckoIds].sort().join(',')

  return useQuery<Map<string, TokenPrice>, Error>({
    queryKey: ['tokenPrices', sortedKey],
    queryFn:  () => getTokenPrices(coingeckoIds),
    enabled:  coingeckoIds.length > 0,
    refetchInterval: 30_000,
    staleTime:       15_000,
    retry:           2,
  })
}

// ─── Convenience selector ─────────────────────────────────────────────────────

/**
 * Convenience hook — returns just the current USD price as a number, or null
 * when the data is not yet available.
 *
 * Internally delegates to useTokenPrice so the same React Query cache entry
 * is shared.
 */
export function useTokenPriceUSD(coingeckoId: string | undefined): number | null {
  const { data } = useTokenPrice(coingeckoId)
  return data?.current_price ?? null
}

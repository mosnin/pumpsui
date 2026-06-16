'use client'

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/useDebounce'
import type { SwapRoute } from '@/hooks/useSwap'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface QuoteResult {
  /** Output amount in the token's smallest unit (as a string to avoid bigint serialisation issues) */
  amountOut: string
  /** Human-readable output amount (already decimal-adjusted) */
  amountOutFormatted: string
  /** Exchange rate: how many tokenOut units per 1 tokenIn */
  exchangeRate: number
  /** Price impact as a percentage (e.g. 0.12 means 0.12%) */
  priceImpact: number
  /** Minimum output after slippage (in token's smallest unit) */
  minimumAmountOut: string
  /** Split routing information from the aggregator */
  route: SwapRoute
}

export interface UseQuoteParams {
  /** Fully-qualified Sui coin type of the input token (e.g. "0x2::sui::SUI") */
  tokenIn: string | undefined
  /** Fully-qualified Sui coin type of the output token */
  tokenOut: string | undefined
  /** Human-readable input amount string as the user typed it (e.g. "1.5") */
  amountIn: string
  /** Decimal places for the input token (used to convert amountIn → raw units) */
  decimalsIn: number
  /** Slippage tolerance in basis points (e.g. 50 = 0.5%) */
  slippageBps: number
  /**
   * External enabled gate — set to false to suppress quoting even when all
   * other parameters are valid (e.g. while the wallet is connecting).
   */
  enabled: boolean
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Convert a human-readable amount to raw on-chain units.
 * Returns null when the amount is not a valid positive number.
 */
function toRawAmount(humanAmount: string, decimals: number): bigint | null {
  const n = Number(humanAmount)
  if (!Number.isFinite(n) || n <= 0) return null
  try {
    return BigInt(Math.floor(n * 10 ** decimals))
  } catch {
    return null
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetch an aggregated swap quote from the OmniWeave `/api/quote` endpoint.
 *
 * Features:
 * - 500 ms debounce on `amountIn` to avoid a request on every keystroke
 * - Automatic re-quote every 15 s so the displayed price stays fresh
 * - Data is stale after 10 s so the UI can show a subtle refresh indicator
 * - All inputs validated before firing a request (token types, positive amount)
 *
 * @example
 * const { data: quote, isLoading, isError } = useQuote({
 *   tokenIn: '0x2::sui::SUI',
 *   tokenOut: '0x5d4b3025…::coin::COIN',
 *   amountIn: '10',
 *   decimalsIn: 9,
 *   slippageBps: 50,
 *   enabled: true,
 * })
 */
export function useQuote(
  params: UseQuoteParams,
): UseQueryResult<QuoteResult | null, Error> {
  const { tokenIn, tokenOut, amountIn, decimalsIn, slippageBps, enabled } = params

  // Debounce the user's typed amount so we don't hammer the API on every keystroke
  const debouncedAmount = useDebounce(amountIn, 500)

  const rawAmount = toRawAmount(debouncedAmount, decimalsIn)
  const isReady =
    enabled &&
    !!tokenIn &&
    !!tokenOut &&
    tokenIn !== tokenOut &&
    rawAmount !== null

  return useQuery<QuoteResult | null, Error>({
    queryKey: ['quote', tokenIn, tokenOut, debouncedAmount, slippageBps],
    queryFn: async (): Promise<QuoteResult | null> => {
      if (!isReady || rawAmount === null) return null

      const url = new URL('/api/quote', window.location.origin)
      url.searchParams.set('tokenIn',     tokenIn!)
      url.searchParams.set('tokenOut',    tokenOut!)
      url.searchParams.set('amountIn',    rawAmount.toString())
      url.searchParams.set('slippageBps', String(slippageBps))

      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        const text = await response.text().catch(() => response.statusText)
        throw new Error(`Quote request failed (${response.status}): ${text}`)
      }

      const json = await response.json()
      // Validate minimal shape so downstream consumers can trust the data
      if (
        typeof json?.amountOut !== 'string' ||
        typeof json?.exchangeRate !== 'number'
      ) {
        throw new Error('Unexpected quote response shape from /api/quote')
      }

      return json as QuoteResult
    },
    enabled:         isReady,
    refetchInterval: 15_000,
    staleTime:       10_000,
    retry:           1,
    // Keep previous data visible while the background re-quote is in flight
    placeholderData: (prev) => prev,
  })
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Token, SUI_TOKENS } from '@/lib/tokens'
import {
  DEFAULT_SLIPPAGE_BPS,
  DEFAULT_DEADLINE_MINUTES,
  QUOTE_DEBOUNCE_MS,
  DEX_META,
  DexMeta,
} from '@/lib/constants'
import type { QuoteResult, DexId } from '@/lib/routing/types'

export interface RouteStep {
  dex: DexMeta
  percentage: number
  fee: number // in bps
}

export interface SwapRoute {
  steps: RouteStep[]
  priceImpact: number // percent
  minimumReceived: string
  fee: string // formatted USD
}

export interface SwapQuote {
  amountOut: string
  route: SwapRoute
  exchangeRate: number // tokenOut per tokenIn
  priceImpact: number
}

export interface SwapSettings {
  slippageBps: number
  deadlineMinutes: number
  mevProtection: boolean
}

export interface UseSwapReturn {
  tokenIn: Token | null
  tokenOut: Token | null
  amountIn: string
  amountOut: string
  quote: SwapQuote | null
  rawQuote: QuoteResult | null
  loading: boolean
  error: string | null
  settings: SwapSettings
  setTokenIn: (token: Token | null) => void
  setTokenOut: (token: Token | null) => void
  setAmountIn: (amount: string) => void
  setAmountOut: (amount: string) => void
  flipTokens: () => void
  updateSettings: (partial: Partial<SwapSettings>) => void
  executeSwap: () => Promise<void>
  swapping: boolean
}

// ---------------------------------------------------------------------------
// API response types (bigints are serialised as decimal strings over the wire)
// ---------------------------------------------------------------------------

interface ApiRouteStep {
  dexId: string
  poolId: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  fee: number
}

interface ApiRoute {
  inputAmount: string
  outputAmount: string
  priceImpact: number
  gasEstimate: string
  path: ApiRouteStep[]
}

interface ApiSplitRoutePortion {
  portionBps: number
  inputAmount: string
  outputAmount: string
  dexId: string
  poolId: string
}

interface ApiSplitRoute {
  totalOutput: string
  priceImpact: number
  routes: ApiSplitRoutePortion[]
}

interface ApiQuote {
  useSplit: boolean
  outputAmount: string
  priceImpact: number
  executionPrice: number
  midPrice: number
  bestRoute: ApiRoute | null
  bestSplitRoute: ApiSplitRoute | null
}

interface ApiQuoteResponse {
  quote: ApiQuote
  minAmountOut: string
  slippageBps: number
  executedAt: string
  params: {
    tokenIn: string
    tokenOut: string
    amountIn: string
    maxHops: number
    maxSplits: number
  }
}

// ---------------------------------------------------------------------------
// Deserialise the wire format back to a QuoteResult with proper bigints
// ---------------------------------------------------------------------------

function deserializeQuoteResult(api: ApiQuote): QuoteResult {
  return {
    useSplit: api.useSplit,
    outputAmount: BigInt(api.outputAmount),
    priceImpact: api.priceImpact,
    executionPrice: api.executionPrice,
    midPrice: api.midPrice,
    bestRoute: api.bestRoute
      ? {
          inputAmount: BigInt(api.bestRoute.inputAmount),
          outputAmount: BigInt(api.bestRoute.outputAmount),
          priceImpact: api.bestRoute.priceImpact,
          gasEstimate: BigInt(api.bestRoute.gasEstimate),
          path: api.bestRoute.path.map((step) => ({
            pool: {
              id: step.poolId,
              dexId: step.dexId as DexId,
              tokenA: step.tokenIn,
              tokenB: step.tokenOut,
              reserveA: BigInt(0),
              reserveB: BigInt(0),
              fee: step.fee,
              liquidity: BigInt(0),
            },
            tokenIn: step.tokenIn,
            tokenOut: step.tokenOut,
            amountIn: BigInt(step.amountIn),
            amountOut: BigInt(step.amountOut),
          })),
        }
      : null,
    bestSplitRoute: api.bestSplitRoute
      ? {
          totalOutput: BigInt(api.bestSplitRoute.totalOutput),
          priceImpact: api.bestSplitRoute.priceImpact,
          routes: api.bestSplitRoute.routes.map((portion) => ({
            portionBps: portion.portionBps,
            route: {
              path: [
                {
                  pool: {
                    id: portion.poolId,
                    dexId: portion.dexId as DexId,
                    tokenA: '',
                    tokenB: '',
                    reserveA: BigInt(0),
                    reserveB: BigInt(0),
                    fee: 0,
                    liquidity: BigInt(0),
                  },
                  tokenIn: '',
                  tokenOut: '',
                  amountIn: BigInt(portion.inputAmount),
                  amountOut: BigInt(portion.outputAmount),
                },
              ],
              inputAmount: BigInt(portion.inputAmount),
              outputAmount: BigInt(portion.outputAmount),
              priceImpact: 0,
              gasEstimate: BigInt(0),
            },
          })),
        }
      : null,
  }
}

// ---------------------------------------------------------------------------
// Build display-oriented SwapQuote from the API response
// ---------------------------------------------------------------------------

function buildSwapQuote(
  apiQuote: ApiQuote,
  minAmountOut: string,
  tokenOut: Token,
  slippageBps: number,
): SwapQuote {
  const outputAmount = Number(apiQuote.outputAmount)
  const outputDisplay = (
    outputAmount / Math.pow(10, tokenOut.decimals)
  ).toFixed(Math.min(tokenOut.decimals, 6))

  const minDisplay = (
    Number(minAmountOut) / Math.pow(10, tokenOut.decimals)
  ).toFixed(Math.min(tokenOut.decimals, 6))

  // Build display steps from whichever route is active
  let steps: RouteStep[] = []
  if (apiQuote.useSplit && apiQuote.bestSplitRoute) {
    steps = apiQuote.bestSplitRoute.routes.map((portion) => {
      const dex = DEX_META[portion.dexId] ?? {
        id: portion.dexId,
        name: portion.dexId,
        color: '#6366F1',
        bgColor: 'rgba(99,102,241,0.15)',
      }
      return {
        dex,
        percentage: Math.round(portion.portionBps / 100),
        fee: 25,
      }
    })
  } else if (apiQuote.bestRoute) {
    const seen = new Map<string, number>()
    for (const step of apiQuote.bestRoute.path) {
      seen.set(step.dexId, (seen.get(step.dexId) ?? 0) + 1)
    }
    const total = apiQuote.bestRoute.path.length
    steps = Array.from(seen.entries()).map(([dexId, count]) => {
      const dex = DEX_META[dexId] ?? {
        id: dexId,
        name: dexId,
        color: '#6366F1',
        bgColor: 'rgba(99,102,241,0.15)',
      }
      return {
        dex,
        percentage: Math.round((count / total) * 100),
        fee: 25,
      }
    })
  }

  const estimatedFeeUsd = (outputAmount / Math.pow(10, tokenOut.decimals) * 0.0005).toFixed(2)

  return {
    amountOut: outputDisplay,
    route: {
      steps,
      priceImpact: apiQuote.priceImpact,
      minimumReceived: minDisplay,
      fee: estimatedFeeUsd,
    },
    exchangeRate: apiQuote.executionPrice,
    priceImpact: apiQuote.priceImpact,
  }
}

// ---------------------------------------------------------------------------
// Real quote fetcher — calls /api/quote
// ---------------------------------------------------------------------------

async function fetchQuote(
  tokenIn: string,
  tokenOut: string,
  amountInRaw: bigint,
): Promise<ApiQuoteResponse | null> {
  const res = await fetch(
    `/api/quote?tokenIn=${encodeURIComponent(tokenIn)}&tokenOut=${encodeURIComponent(tokenOut)}&amountIn=${amountInRaw.toString()}`,
    { signal: AbortSignal.timeout(10_000) }
  )
  if (!res.ok) return null
  return res.json()
}

export function useSwap(): UseSwapReturn {
  const [tokenIn, setTokenInState] = useState<Token | null>(SUI_TOKENS[0] ?? null)
  const [tokenOut, setTokenOutState] = useState<Token | null>(SUI_TOKENS[1] ?? null)
  const [amountIn, setAmountInState] = useState<string>('')
  const [amountOut, setAmountOutState] = useState<string>('')
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [rawQuote, setRawQuote] = useState<QuoteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [swapping, setSwapping] = useState(false)
  const [settings, setSettings] = useState<SwapSettings>({
    slippageBps: DEFAULT_SLIPPAGE_BPS,
    deadlineMinutes: DEFAULT_DEADLINE_MINUTES,
    mevProtection: true,
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchAndSetQuote = useCallback(
    async (tIn: Token, tOut: Token, amt: string, slippage: number) => {
      if (!amt || parseFloat(amt) <= 0) {
        setQuote(null)
        setRawQuote(null)
        setAmountOutState('')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      try {
        // Convert display amount to raw base units using token decimals
        const amountInRaw = BigInt(
          Math.round(parseFloat(amt) * Math.pow(10, tIn.decimals))
        )
        const response = await fetchQuote(tIn.address, tOut.address, amountInRaw)
        if (!response) throw new Error('Failed to fetch quote')
        const displayQuote = buildSwapQuote(response.quote, response.minAmountOut, tOut, slippage)
        const deserializedQuote = deserializeQuoteResult(response.quote)
        setQuote(displayQuote)
        setRawQuote(deserializedQuote)
        setAmountOutState(displayQuote.amountOut)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
          setQuote(null)
          setRawQuote(null)
          setAmountOutState('')
        }
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const scheduleQuote = useCallback(
    (tIn: Token | null, tOut: Token | null, amt: string, slippage: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (!tIn || !tOut || !amt || parseFloat(amt) <= 0) {
        setQuote(null)
        setAmountOutState('')
        return
      }
      debounceRef.current = setTimeout(() => {
        fetchAndSetQuote(tIn, tOut, amt, slippage)
      }, QUOTE_DEBOUNCE_MS)
    },
    [fetchAndSetQuote],
  )

  const setAmountIn = useCallback(
    (amount: string) => {
      setAmountInState(amount)
      scheduleQuote(tokenIn, tokenOut, amount, settings.slippageBps)
    },
    [tokenIn, tokenOut, settings.slippageBps, scheduleQuote],
  )

  const setAmountOut = useCallback(
    (amount: string) => {
      setAmountOutState(amount)
      // In a real app, this triggers a reverse quote
    },
    [],
  )

  const setTokenIn = useCallback(
    (token: Token | null) => {
      setTokenInState(token)
      scheduleQuote(token, tokenOut, amountIn, settings.slippageBps)
    },
    [tokenOut, amountIn, settings.slippageBps, scheduleQuote],
  )

  const setTokenOut = useCallback(
    (token: Token | null) => {
      setTokenOutState(token)
      scheduleQuote(tokenIn, token, amountIn, settings.slippageBps)
    },
    [tokenIn, amountIn, settings.slippageBps, scheduleQuote],
  )

  const flipTokens = useCallback(() => {
    setTokenInState(tokenOut)
    setTokenOutState(tokenIn)
    setAmountInState(amountOut)
    scheduleQuote(tokenOut, tokenIn, amountOut, settings.slippageBps)
  }, [tokenIn, tokenOut, amountOut, settings.slippageBps, scheduleQuote])

  const updateSettings = useCallback(
    (partial: Partial<SwapSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial }
        if (partial.slippageBps !== undefined) {
          scheduleQuote(tokenIn, tokenOut, amountIn, next.slippageBps)
        }
        return next
      })
    },
    [tokenIn, tokenOut, amountIn, scheduleQuote],
  )

  const executeSwap = useCallback(async () => {
    if (!tokenIn || !tokenOut || !amountIn || !quote) return
    setSwapping(true)
    setError(null)
    try {
      // Transaction execution is handled by ConfirmSwapModal via useExecuteSwap.
      // This function resets state after a confirmed swap.
      setAmountInState('')
      setAmountOutState('')
      setQuote(null)
      setRawQuote(null)
    } catch (err) {
      if (err instanceof Error) setError(err.message)
    } finally {
      setSwapping(false)
    }
  }, [tokenIn, tokenOut, amountIn, quote])

  // Re-fetch when settings change
  useEffect(() => {
    if (tokenIn && tokenOut && amountIn && parseFloat(amountIn) > 0) {
      scheduleQuote(tokenIn, tokenOut, amountIn, settings.slippageBps)
    }
  }, [settings.slippageBps]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    quote,
    rawQuote,
    loading,
    error,
    settings,
    setTokenIn,
    setTokenOut,
    setAmountIn,
    setAmountOut,
    flipTokens,
    updateSettings,
    executeSwap,
    swapping,
  }
}

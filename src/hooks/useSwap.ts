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

// Simulated quote fetcher — replace with real aggregator API
async function fetchQuote(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  slippageBps: number,
): Promise<SwapQuote> {
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 200))

  const inAmt = parseFloat(amountIn)
  if (isNaN(inAmt) || inAmt <= 0) throw new Error('Invalid amount')

  // Simulated rate with slight noise
  const baseRate = tokenIn.symbol === 'SUI' ? 3.24 : 1 / 3.24
  const rate = baseRate * (1 - (Math.random() * 0.002 - 0.001))
  const outAmt = inAmt * rate

  const priceImpact = inAmt > 1000 ? Math.min(inAmt / 50000, 5) : 0.04

  // Simulated route split across DEXes
  const dexKeys = Object.keys(DEX_META)
  const usedDexes = dexKeys.slice(0, inAmt > 500 ? 3 : 2)
  const pcts =
    usedDexes.length === 2 ? [60, 40] : [50, 30, 20]

  const steps: RouteStep[] = usedDexes.map((key, i) => ({
    dex: DEX_META[key],
    percentage: pcts[i],
    fee: 25,
  }))

  const slippageFactor = 1 - slippageBps / 10000
  const minimumReceived = (outAmt * slippageFactor).toFixed(
    Math.min(tokenOut.decimals, 6),
  )

  return {
    amountOut: outAmt.toFixed(Math.min(tokenOut.decimals, 6)),
    route: {
      steps,
      priceImpact,
      minimumReceived,
      fee: (inAmt * 0.0005 * 3.24).toFixed(2),
    },
    exchangeRate: rate,
    priceImpact,
  }
}

export function useSwap(): UseSwapReturn {
  const [tokenIn, setTokenInState] = useState<Token | null>(SUI_TOKENS[0] ?? null)
  const [tokenOut, setTokenOutState] = useState<Token | null>(SUI_TOKENS[1] ?? null)
  const [amountIn, setAmountInState] = useState<string>('')
  const [amountOut, setAmountOutState] = useState<string>('')
  const [quote, setQuote] = useState<SwapQuote | null>(null)
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
        setAmountOutState('')
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      try {
        const q = await fetchQuote(tIn, tOut, amt, slippage)
        setQuote(q)
        setAmountOutState(q.amountOut)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
          setQuote(null)
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
      // Placeholder — integrate with @mysten/dapp-kit + actual DEX SDKs
      await new Promise((r) => setTimeout(r, 1500))
      setAmountInState('')
      setAmountOutState('')
      setQuote(null)
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

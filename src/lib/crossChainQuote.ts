/**
 * Cross-chain quote engine for OmniWeave.
 *
 * Combines a bridge quote (any chain → Sui) with an optional DEX swap quote
 * (bridge output token → desired Sui token) into a single unified quote.
 *
 * Example flow:
 *   ETH on Ethereum
 *     → (Wormhole bridge) → wETH on Sui
 *     → (Cetus DEX swap)  → SUI
 */

import { getAllBridgeQuotes } from '@/lib/bridges'
import type { BridgeQuote } from '@/lib/bridges/types'
import { CHAIN_IDS } from '@/lib/bridges/types'
import { BRIDGE_TOKEN_MAP } from '@/lib/bridges/tokenMap'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface SwapQuote {
  dexId: string
  inputToken: string
  outputToken: string
  inputAmount: bigint
  outputAmount: bigint
  priceImpact: number
}

export type CrossChainStep =
  | { type: 'bridge'; bridge: BridgeQuote; fromChain: string; toChain: string }
  | {
      type: 'swap'
      dexId: string
      tokenIn: string
      tokenOut: string
      amountIn: bigint
      amountOut: bigint
    }

export interface CrossChainQuote {
  bridgeQuote: BridgeQuote
  swapQuote: SwapQuote | null  // null when bridge output === desired token
  intermediateToken: string    // Sui coin type that arrives after bridging
  finalToken: string           // Sui coin type the user ultimately receives
  totalTimeSeconds: number
  totalFeeUSD: number
  estimatedOutput: bigint
  priceImpact: number
  steps: CrossChainStep[]
}

export interface GetCrossChainQuoteParams {
  fromChainId: number
  fromToken: string   // token address / symbol on the source chain
  toToken: string     // desired Sui coin type
  amount: bigint
  recipient: string
}

// ─── Chain-id → tokenMap key ──────────────────────────────────────────────────

const CHAIN_ID_TO_KEY: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM]:  'ethereum',
  [CHAIN_IDS.BNB_CHAIN]: 'bsc',
  [CHAIN_IDS.ARBITRUM]:  'arbitrum',
  [CHAIN_IDS.OPTIMISM]:  'optimism',
  [CHAIN_IDS.BASE]:      'base',
  [CHAIN_IDS.POLYGON]:   'polygon',
  [CHAIN_IDS.AVALANCHE]: 'avalanche',
  [CHAIN_IDS.SOLANA]:    'solana',
}

// ─── Main quote function ──────────────────────────────────────────────────────

/**
 * Compute a full cross-chain quote (bridge + optional DEX swap).
 * Returns null when no bridge route can be found for the given token pair.
 */
export async function getCrossChainQuote(
  params: GetCrossChainQuoteParams
): Promise<CrossChainQuote | null> {
  const { fromChainId, fromToken, toToken, amount, recipient } = params

  // 1. Map source token → Sui equivalent
  const bridgeOutputToken = getBridgeOutputOnSui(fromToken, fromChainId)
  if (!bridgeOutputToken) return null

  // 2. Determine what the bridge's destination toToken should be
  //    Use the Sui USDC address as a canonical target when the user wants a
  //    different final token; when the bridge output IS the desired token,
  //    pass that directly.
  const bridgeDestToken =
    bridgeOutputToken === toToken
      ? toToken
      : bridgeOutputToken

  // 3. Fetch bridge quotes
  const bridgeQuotes = await getAllBridgeQuotes({
    fromChainId,
    toChainId: CHAIN_IDS.SUI,
    fromToken,
    toToken: bridgeDestToken,
    amount,
    recipient,
  }).catch(() => [] as BridgeQuote[])

  if (bridgeQuotes.length === 0) return null

  const bestBridgeQuote = bridgeQuotes[0]

  // 4. If the bridge output is already the desired token → no DEX swap needed
  if (bridgeOutputToken === toToken) {
    return {
      bridgeQuote: bestBridgeQuote,
      swapQuote: null,
      intermediateToken: bridgeOutputToken,
      finalToken: toToken,
      totalTimeSeconds: bestBridgeQuote.estimatedTime,
      totalFeeUSD: bestBridgeQuote.totalCostUSD,
      estimatedOutput: bestBridgeQuote.toAmount,
      priceImpact: 0,
      steps: [
        {
          type: 'bridge',
          bridge: bestBridgeQuote,
          fromChain: CHAIN_ID_TO_KEY[fromChainId] ?? 'unknown',
          toChain: 'sui',
        },
      ],
    }
  }

  // 5. Quote the Sui DEX swap: bridgeOutputToken → desiredToken
  const swapAmount = bestBridgeQuote.toAmount
  const swapQuote = await fetchDexSwapQuote(bridgeOutputToken, toToken, swapAmount)

  const steps: CrossChainStep[] = [
    {
      type: 'bridge',
      bridge: bestBridgeQuote,
      fromChain: CHAIN_ID_TO_KEY[fromChainId] ?? 'unknown',
      toChain: 'sui',
    },
  ]

  if (swapQuote) {
    steps.push({
      type: 'swap',
      dexId: swapQuote.dexId,
      tokenIn: bridgeOutputToken,
      tokenOut: toToken,
      amountIn: swapAmount,
      amountOut: swapQuote.outputAmount,
    })
  }

  return {
    bridgeQuote: bestBridgeQuote,
    swapQuote,
    intermediateToken: bridgeOutputToken,
    finalToken: toToken,
    // Bridge takes most of the time; DEX swap adds ~5 s
    totalTimeSeconds: bestBridgeQuote.estimatedTime + (swapQuote ? 5 : 0),
    // Total fee = bridge cost + small DEX overhead estimate
    totalFeeUSD: bestBridgeQuote.totalCostUSD + (swapQuote ? 0.1 : 0),
    estimatedOutput: swapQuote?.outputAmount ?? swapAmount,
    priceImpact: swapQuote?.priceImpact ?? 0,
    steps,
  }
}

// ─── Token mapping helpers ────────────────────────────────────────────────────

/**
 * Given a source token address (or symbol) on a source chain, return the
 * corresponding Sui coin type that arrives after bridging via Wormhole/etc.
 *
 * Uses the BRIDGE_TOKEN_MAP to find a common symbol between source chain and Sui.
 */
function getBridgeOutputOnSui(fromToken: string, fromChainId: number): string | null {
  const chainKey = CHAIN_ID_TO_KEY[fromChainId]
  if (!chainKey) return null

  const sourceMap = BRIDGE_TOKEN_MAP[chainKey as keyof typeof BRIDGE_TOKEN_MAP] as
    | Record<string, string>
    | undefined
  if (!sourceMap) return null

  const suiMap = BRIDGE_TOKEN_MAP.sui as Record<string, string>

  // Find which symbol matches the fromToken (by address or symbol key)
  const tokenUpper = fromToken.toUpperCase()
  const fromLower  = fromToken.toLowerCase()

  // Try direct symbol match first (e.g. "ETH", "USDC")
  if (sourceMap[tokenUpper] && suiMap[tokenUpper]) {
    return suiMap[tokenUpper]
  }

  // Try address match (case-insensitive for EVM)
  for (const [symbol, address] of Object.entries(sourceMap)) {
    if (address.toLowerCase() === fromLower) {
      // Check if there's a corresponding Sui token
      if (suiMap[symbol]) return suiMap[symbol]
      // Some tokens use different symbol names (e.g. ETH → WETH on Sui)
      if (symbol === 'ETH' && suiMap['WETH']) return suiMap['WETH']
      if (symbol === 'BNB' && suiMap['BNB'])  return suiMap['BNB']
      if (symbol === 'SOL' && suiMap['SOL'])  return suiMap['SOL']
      if (symbol === 'AVAX' && suiMap['AVAX'])return suiMap['AVAX']
      if (symbol === 'POL')                   return suiMap['USDC'] ?? null  // fallback
    }
  }

  return null
}

/**
 * Get all bridgeable tokens on a given chain with their Sui equivalents.
 * Returns only tokens that have a known mapping on both chains.
 */
export function getBridgeableTokens(
  fromChainId: number
): Array<{ symbol: string; sourceAddress: string; suiAddress: string }> {
  const chainKey = CHAIN_ID_TO_KEY[fromChainId]
  if (!chainKey) return []

  const sourceMap = BRIDGE_TOKEN_MAP[chainKey as keyof typeof BRIDGE_TOKEN_MAP] as
    | Record<string, string>
    | undefined
  if (!sourceMap) return []

  const suiMap = BRIDGE_TOKEN_MAP.sui as Record<string, string>

  const results: Array<{ symbol: string; sourceAddress: string; suiAddress: string }> = []

  for (const [symbol, sourceAddress] of Object.entries(sourceMap)) {
    // Resolve Sui address — handle ETH→WETH mapping
    const suiSymbol = symbol === 'ETH' ? 'WETH' : symbol
    const suiAddress = suiMap[suiSymbol] ?? suiMap[symbol]
    if (suiAddress) {
      results.push({ symbol, sourceAddress, suiAddress })
    }
  }

  return results
}

// ─── DEX swap quote helper ────────────────────────────────────────────────────

/**
 * Fetch a swap quote from the OmniWeave /api/quote endpoint.
 * Returns null on any error — the cross-chain flow should still work
 * (user gets the bridge output token, just without the extra swap step).
 */
async function fetchDexSwapQuote(
  tokenIn: string,
  tokenOut: string,
  amount: bigint
): Promise<SwapQuote | null> {
  try {
    if (amount <= 0n) return null

    const url = `/api/quote?tokenIn=${encodeURIComponent(tokenIn)}&tokenOut=${encodeURIComponent(tokenOut)}&amountIn=${amount.toString()}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null

    const data = await res.json()
    const q = data?.quote

    if (!q) return null

    const outputAmount = BigInt(q.outputAmount ?? '0')
    if (outputAmount <= 0n) return null

    return {
      dexId: q.bestRoute?.path?.[0]?.dexId ?? 'cetus',
      inputToken: tokenIn,
      outputToken: tokenOut,
      inputAmount: amount,
      outputAmount,
      priceImpact: q.priceImpact ?? 0,
    }
  } catch {
    return null
  }
}

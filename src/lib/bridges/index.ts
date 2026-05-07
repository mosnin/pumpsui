/**
 * Bridge aggregator — exports all bridge providers and the quote-aggregation function.
 *
 * Bridge coverage (as of May 2026):
 *
 * | Bridge       | EVM→Sui | Solana→Sui | Notable assets     | Status |
 * |--------------|---------|------------|-------------------|--------|
 * | Wormhole     |   ✓     |     ✓      | ETH, USDC, WBTC   | Live   |
 * | LayerZero    |   ✓     |            | USDC, OFT assets  | Live   |
 * | Celer cBridge|   ✓     |            | ETH, USDC, USDT   | Live   |
 * | Mayan Finance|   ✓     |     ✓      | USDC, SOL, ETH    | Live   |
 * | Axelar       |   ✓     |            | USDC, AXL tokens  | Live   |
 * | AllBridge    |   ✓     |     ✓      | USDC (CCTP)       | Live   |
 */

export { WormholeBridge } from './wormhole'
export { LayerZeroBridge } from './layerzero'
export { CelerBridge } from './celer'
export { MayanBridge } from './mayan'
export { AxelarBridge } from './axelar'
export { AllBridge } from './allbridge'

export type {
  BridgeProvider,
  BridgeQuote,
  BridgeQuoteParams,
  BridgeTx,
  BridgeTxStatus,
  BridgeToken,
  Chain,
  ChainId,
} from './types'

export {
  CHAIN_IDS,
  SUPPORTED_CHAINS,
  BRIDGE_TOKENS,
} from './types'

import type { BridgeProvider, BridgeQuote, BridgeQuoteParams } from './types'
import { WormholeBridge } from './wormhole'
import { LayerZeroBridge } from './layerzero'
import { CelerBridge } from './celer'
import { MayanBridge } from './mayan'
import { AxelarBridge } from './axelar'
import { AllBridge } from './allbridge'

/** All registered bridge providers */
export const ALL_BRIDGES: BridgeProvider[] = [
  new WormholeBridge(),
  new LayerZeroBridge(),
  new CelerBridge(),
  new MayanBridge(),
  new AxelarBridge(),
  new AllBridge(),
]

/**
 * Fetch quotes from all bridges that support the requested route.
 * Runs all requests concurrently; failed bridges are silently excluded.
 * Results are sorted by toAmount descending (best rate first).
 */
export async function getAllBridgeQuotes(params: BridgeQuoteParams): Promise<BridgeQuote[]> {
  const compatibleBridges = ALL_BRIDGES.filter(
    (b) =>
      b.supportedFromChains.includes(params.fromChainId) &&
      b.supportedToChains.includes(params.toChainId)
  )

  if (compatibleBridges.length === 0) return []

  const results = await Promise.allSettled(
    compatibleBridges.map((b) => b.getQuote(params))
  )

  return results
    .filter((r): r is PromiseFulfilledResult<BridgeQuote> => r.status === 'fulfilled')
    .map((r) => r.value)
    .sort((a, b) => {
      // Sort by toAmount descending (most received = best rate)
      if (b.toAmount > a.toAmount) return 1
      if (b.toAmount < a.toAmount) return -1
      return 0
    })
}

/**
 * Get a single bridge by ID.
 */
export function getBridgeById(id: string): BridgeProvider | undefined {
  return ALL_BRIDGES.find((b) => b.id === id)
}

/**
 * Format estimated time into human-readable string.
 */
export function formatEstimatedTime(seconds: number): string {
  if (seconds < 60) return `~${seconds}s`
  if (seconds < 3600) return `~${Math.round(seconds / 60)}m`
  return `~${Math.round(seconds / 3600)}h`
}

/**
 * Format a bridge fee as USD string.
 */
export function formatBridgeFee(feeUSD: number): string {
  if (feeUSD < 0.01) return '<$0.01'
  if (feeUSD < 10) return `$${feeUSD.toFixed(2)}`
  return `$${Math.round(feeUSD)}`
}

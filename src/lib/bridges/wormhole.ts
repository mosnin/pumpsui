/**
 * Wormhole bridge adapter.
 *
 * Wormhole is the most mature Sui bridge, supporting native Sui since mainnet launch (2023).
 * SDK: @wormhole-foundation/sdk (v1.15+), @wormhole-foundation/sdk-sui
 * Portal Bridge UI: https://portalbridge.com/sui
 * Wormhole Connect widget: @wormhole-foundation/wormhole-connect
 *
 * Wormhole chain IDs (internal):
 *   Ethereum=2, Solana=1, BSC=4, Polygon=5, Avalanche=6, Arbitrum=23,
 *   Optimism=24, Base=30, Sui=21
 *
 * Supported: ETH, BSC, Arbitrum, Optimism, Base, Polygon, Avalanche, Solana → Sui (and reverse)
 * Fee: ~0.1% protocol fee + gas on source chain
 * Speed: ~15 min (EVM), ~1 min (Solana via CCTP fast-finality)
 */

import type { BridgeProvider, BridgeQuote, BridgeQuoteParams } from './types'
import { CHAIN_IDS } from './types'

// Mapping from our chain IDs to Wormhole's internal chain IDs
const WORMHOLE_CHAIN_IDS: Record<number, number> = {
  [CHAIN_IDS.ETHEREUM]:  2,
  [CHAIN_IDS.SOLANA]:    1,
  [CHAIN_IDS.BNB_CHAIN]: 4,
  [CHAIN_IDS.POLYGON]:   5,
  [CHAIN_IDS.AVALANCHE]: 6,
  [CHAIN_IDS.ARBITRUM]:  23,
  [CHAIN_IDS.OPTIMISM]:  24,
  [CHAIN_IDS.BASE]:      30,
  [CHAIN_IDS.SUI]:       21,
}

/**
 * Estimated bridge times in seconds (source-chain confirmation + VAA + redemption).
 * Solana is fast via CCTP; EVM chains need ~15 confirmations on Ethereum.
 */
const ESTIMATED_TIMES: Record<number, number> = {
  [CHAIN_IDS.ETHEREUM]:  900,   // 15 min
  [CHAIN_IDS.BNB_CHAIN]: 300,   // 5 min
  [CHAIN_IDS.ARBITRUM]:  180,   // 3 min
  [CHAIN_IDS.OPTIMISM]:  180,   // 3 min
  [CHAIN_IDS.BASE]:      180,   // 3 min
  [CHAIN_IDS.POLYGON]:   300,   // 5 min
  [CHAIN_IDS.AVALANCHE]: 120,   // 2 min
  [CHAIN_IDS.SOLANA]:    60,    // ~1 min via CCTP
}

/**
 * Approximate bridge fee in USD (relayer gas + protocol fee).
 * Wormhole charges ~$2-5 per transfer depending on source chain.
 */
const APPROX_FEE_USD: Record<number, number> = {
  [CHAIN_IDS.ETHEREUM]:  5.00,
  [CHAIN_IDS.BNB_CHAIN]: 1.50,
  [CHAIN_IDS.ARBITRUM]:  1.00,
  [CHAIN_IDS.OPTIMISM]:  0.80,
  [CHAIN_IDS.BASE]:      0.60,
  [CHAIN_IDS.POLYGON]:   0.50,
  [CHAIN_IDS.AVALANCHE]: 0.80,
  [CHAIN_IDS.SOLANA]:    0.30,
}

export class WormholeBridge implements BridgeProvider {
  readonly id = 'wormhole'
  readonly name = 'Wormhole'
  readonly logo = 'https://wormhole.com/token.png'
  readonly color = '#7C3AED'
  readonly website = 'https://portalbridge.com/sui'

  /** Chains this bridge can route FROM (excluding Sui itself) */
  readonly supportedFromChains: number[] = [
    CHAIN_IDS.ETHEREUM,
    CHAIN_IDS.BNB_CHAIN,
    CHAIN_IDS.ARBITRUM,
    CHAIN_IDS.OPTIMISM,
    CHAIN_IDS.BASE,
    CHAIN_IDS.POLYGON,
    CHAIN_IDS.AVALANCHE,
    CHAIN_IDS.SOLANA,
  ]

  /** Can bridge TO Sui and FROM Sui (bidirectional) */
  readonly supportedToChains: number[] = [
    CHAIN_IDS.SUI,
    CHAIN_IDS.ETHEREUM,
    CHAIN_IDS.BNB_CHAIN,
    CHAIN_IDS.ARBITRUM,
    CHAIN_IDS.OPTIMISM,
    CHAIN_IDS.BASE,
    CHAIN_IDS.POLYGON,
    CHAIN_IDS.AVALANCHE,
    CHAIN_IDS.SOLANA,
  ]

  async getQuote(params: BridgeQuoteParams): Promise<BridgeQuote> {
    const { fromChainId, amount } = params

    // Protocol fee: ~0.1% (Wormhole Native Token Transfers) or 0% for CCTP USDC
    // We use a conservative 0.15% estimate for non-USDC, 0% for USDC
    const isUSDC = params.fromToken.toLowerCase().includes('usdc') ||
                   params.fromToken === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    const feeRate = isUSDC ? 0n : 15n  // basis points * 0.01 = %
    const fee = isUSDC ? 0n : (amount * feeRate) / 10000n
    const toAmount = amount - fee

    const feeUSD = APPROX_FEE_USD[fromChainId] ?? 2.50
    const gasCostUSD = feeUSD * 0.4  // rough gas estimate

    const estimatedTime = ESTIMATED_TIMES[fromChainId] ?? 600

    // Build Wormhole Portal deep-link
    const fromWHId = WORMHOLE_CHAIN_IDS[fromChainId] ?? 2
    const url = `https://portalbridge.com/sui?sourceChain=${fromWHId}&targetChain=21`

    return {
      bridgeId: this.id,
      bridgeName: this.name,
      bridgeLogo: this.logo,
      bridgeColor: this.color,
      fromAmount: amount,
      toAmount,
      fee,
      feeUSD,
      gasCostUSD,
      totalCostUSD: feeUSD + gasCostUSD,
      estimatedTime,
      priceImpact: 0,
      route: ['Source Chain', 'Wormhole VAA', 'Sui'],
      url,
    }
  }

  async buildTransaction(quote: BridgeQuote): Promise<unknown> {
    // In a full integration this would call:
    // import { wormhole } from '@wormhole-foundation/sdk'
    // import sui from '@wormhole-foundation/sdk/sui'
    // const wh = await wormhole('Mainnet', [evm, solana, sui])
    // const route = wh.resolver([routes.TokenBridgeRoute, routes.CCTPRoute])
    // ... build and sign the transfer
    console.warn('WormholeBridge.buildTransaction: full SDK integration required')
    return { bridge: 'wormhole', quote }
  }
}

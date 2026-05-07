/**
 * AllBridge Core adapter for Sui.
 *
 * AllBridge integrated with Sui (their 12th chain) with a focus on USDC/stablecoin bridging.
 * Uses Circle's CCTP (Cross-Chain Transfer Protocol) for USDC, offering zero-slippage.
 * Relayer can fund wallets with gas on arrival (good UX for new Sui users).
 *
 * SDK: @allbridge/bridge-core-sdk
 * API: https://core.api.allbridge.io
 * UI: https://core.allbridge.io
 *
 * Supported: ETH, BSC, Solana, Polygon, Avalanche → Sui
 * Focus: USDC (CCTP), USDT, native stablecoins
 * Fee: ~$0.30-2.00 (very low for USDC)
 * Speed: 1-5 min (CCTP fast finality)
 */

import type { BridgeProvider, BridgeQuote, BridgeQuoteParams } from './types'
import { CHAIN_IDS } from './types'

const ESTIMATED_TIMES: Record<number, number> = {
  [CHAIN_IDS.ETHEREUM]:  300,   // 5 min (CCTP fast finality on Ethereum)
  [CHAIN_IDS.BNB_CHAIN]: 180,   // 3 min
  [CHAIN_IDS.SOLANA]:    90,    // 1.5 min
  [CHAIN_IDS.POLYGON]:   120,   // 2 min
  [CHAIN_IDS.AVALANCHE]: 90,    // 1.5 min
  [CHAIN_IDS.ARBITRUM]:  120,   // 2 min
  [CHAIN_IDS.BASE]:      120,   // 2 min
}

/** AllBridge is particularly cheap for USDC due to CCTP */
const APPROX_FEE_USD: Record<number, number> = {
  [CHAIN_IDS.ETHEREUM]:  1.50,
  [CHAIN_IDS.BNB_CHAIN]: 0.50,
  [CHAIN_IDS.SOLANA]:    0.30,
  [CHAIN_IDS.POLYGON]:   0.30,
  [CHAIN_IDS.AVALANCHE]: 0.40,
  [CHAIN_IDS.ARBITRUM]:  0.50,
  [CHAIN_IDS.BASE]:      0.40,
}

export class AllBridge implements BridgeProvider {
  readonly id = 'allbridge'
  readonly name = 'AllBridge Core'
  readonly logo = 'https://core.allbridge.io/favicon.ico'
  readonly color = '#FF6B6B'    // AllBridge red/coral brand color
  readonly website = 'https://core.allbridge.io'

  /** AllBridge supports Solana in addition to EVM chains */
  readonly supportedFromChains: number[] = [
    CHAIN_IDS.ETHEREUM,
    CHAIN_IDS.BNB_CHAIN,
    CHAIN_IDS.SOLANA,
    CHAIN_IDS.POLYGON,
    CHAIN_IDS.AVALANCHE,
    CHAIN_IDS.ARBITRUM,
    CHAIN_IDS.BASE,
  ]

  readonly supportedToChains: number[] = [
    CHAIN_IDS.SUI,
    CHAIN_IDS.ETHEREUM,
    CHAIN_IDS.BNB_CHAIN,
    CHAIN_IDS.SOLANA,
    CHAIN_IDS.POLYGON,
    CHAIN_IDS.AVALANCHE,
  ]

  async getQuote(params: BridgeQuoteParams): Promise<BridgeQuote> {
    const { fromChainId, amount } = params

    // AllBridge CCTP USDC transfers have near-zero slippage
    // Standard transfers have ~0.3% fee
    const isUSDC = params.fromToken.toLowerCase().includes('usdc') ||
                   params.fromToken === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

    const feeBps = isUSDC ? 0n : 30n   // 0% for USDC CCTP, 0.3% otherwise
    const fee = (amount * feeBps) / 10000n
    const toAmount = amount - fee

    const feeUSD = APPROX_FEE_USD[fromChainId] ?? 1.0
    const gasCostUSD = isUSDC ? 0.05 : (feeUSD * 0.3)

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
      estimatedTime: ESTIMATED_TIMES[fromChainId] ?? 180,
      priceImpact: 0,
      route: isUSDC
        ? ['Source Chain', 'Circle CCTP', 'Sui']
        : ['Source Chain', 'AllBridge Pool', 'Sui'],
      url: `https://core.allbridge.io/?sourceChainId=${fromChainId}&destinationChainId=784`,
    }
  }

  async buildTransaction(quote: BridgeQuote): Promise<unknown> {
    // Full integration uses @allbridge/bridge-core-sdk:
    //   import { AllbridgeCoreSdk, NodeRpcUrlsConfig } from '@allbridge/bridge-core-sdk'
    //   const sdk = new AllbridgeCoreSdk(nodeRpcUrlsConfig)
    //   const tx = await sdk.bridge.rawTxBuilder.send(sendParams)
    console.warn('AllBridge.buildTransaction: full SDK integration required')
    return { bridge: 'allbridge', quote }
  }
}

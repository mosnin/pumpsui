/**
 * Axelar Network bridge adapter for Sui.
 *
 * Axelar integrated with Sui Mainnet in May 2025.
 * Enables cross-chain tokenization via Axelar's Interchain Token Service (ITS).
 * Focuses on institutional and asset issuers bridging assets to Sui.
 *
 * SDK: @axelar-network/axelarjs-sdk, @axelar-network/axelar-cgp-sui (Move contracts)
 * GitHub: https://github.com/axelarnetwork/axelar-cgp-sui
 * API: https://api.axelarscan.io
 *
 * Supported: ETH, BSC, Arbitrum, Optimism, Base, Polygon, Avalanche → Sui
 * Fee: ~0.1-0.5% Interchain Gas (paid on source chain)
 * Speed: 2-10 min (DVN + validator confirmations)
 */

import type { BridgeProvider, BridgeQuote, BridgeQuoteParams } from './types'
import { CHAIN_IDS } from './types'

/** Axelar chain names (used in their SDK and API) */
const AXELAR_CHAIN_NAMES: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM]:  'ethereum',
  [CHAIN_IDS.BNB_CHAIN]: 'binance',
  [CHAIN_IDS.ARBITRUM]:  'arbitrum',
  [CHAIN_IDS.OPTIMISM]:  'optimism',
  [CHAIN_IDS.BASE]:      'base',
  [CHAIN_IDS.POLYGON]:   'polygon',
  [CHAIN_IDS.AVALANCHE]: 'avalanche',
  [CHAIN_IDS.SUI]:       'sui',
}

const ESTIMATED_TIMES: Record<number, number> = {
  [CHAIN_IDS.ETHEREUM]:  600,   // 10 min
  [CHAIN_IDS.BNB_CHAIN]: 180,   // 3 min
  [CHAIN_IDS.ARBITRUM]:  120,   // 2 min
  [CHAIN_IDS.OPTIMISM]:  120,   // 2 min
  [CHAIN_IDS.BASE]:      120,   // 2 min
  [CHAIN_IDS.POLYGON]:   180,   // 3 min
  [CHAIN_IDS.AVALANCHE]: 120,   // 2 min
}

const APPROX_FEE_USD: Record<number, number> = {
  [CHAIN_IDS.ETHEREUM]:  6.00,  // Axelar charges more on ETH due to gas
  [CHAIN_IDS.BNB_CHAIN]: 1.50,
  [CHAIN_IDS.ARBITRUM]:  0.80,
  [CHAIN_IDS.OPTIMISM]:  0.70,
  [CHAIN_IDS.BASE]:      0.60,
  [CHAIN_IDS.POLYGON]:   0.40,
  [CHAIN_IDS.AVALANCHE]: 0.60,
}

export class AxelarBridge implements BridgeProvider {
  readonly id = 'axelar'
  readonly name = 'Axelar'
  readonly logo = 'https://axelar.network/favicon-32x32.png'
  readonly color = '#000AFF'    // Axelar brand blue
  readonly website = 'https://axelar.network'

  /** EVM-only; Solana not yet supported by Axelar → Sui */
  readonly supportedFromChains: number[] = [
    CHAIN_IDS.ETHEREUM,
    CHAIN_IDS.BNB_CHAIN,
    CHAIN_IDS.ARBITRUM,
    CHAIN_IDS.OPTIMISM,
    CHAIN_IDS.BASE,
    CHAIN_IDS.POLYGON,
    CHAIN_IDS.AVALANCHE,
  ]

  readonly supportedToChains: number[] = [
    CHAIN_IDS.SUI,
    CHAIN_IDS.ETHEREUM,
    CHAIN_IDS.BNB_CHAIN,
    CHAIN_IDS.ARBITRUM,
    CHAIN_IDS.OPTIMISM,
    CHAIN_IDS.BASE,
    CHAIN_IDS.POLYGON,
    CHAIN_IDS.AVALANCHE,
  ]

  async getQuote(params: BridgeQuoteParams): Promise<BridgeQuote> {
    const { fromChainId, amount } = params

    // Axelar fee: ~0.1% Interchain Gas fee
    const feeBps = 10n    // 0.10%
    const fee = (amount * feeBps) / 10000n
    const toAmount = amount - fee

    const feeUSD = APPROX_FEE_USD[fromChainId] ?? 2.0
    const gasCostUSD = feeUSD * 0.4

    const fromChainName = AXELAR_CHAIN_NAMES[fromChainId] ?? 'ethereum'
    const url = `https://satellite.money/?source=${fromChainName}&destination=sui`

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
      estimatedTime: ESTIMATED_TIMES[fromChainId] ?? 300,
      priceImpact: 0,
      route: ['Source Chain', 'Axelar Gateway', 'Sui ITS'],
      url,
    }
  }

  async buildTransaction(quote: BridgeQuote): Promise<unknown> {
    // Full integration uses @axelar-network/axelarjs-sdk:
    //   const axelar = new AxelarGMPRecoveryAPI({ environment: Environment.MAINNET })
    //   const itsSdk = new InterchainTokenService(...)
    //   await itsSdk.interchainTransfer(...)
    console.warn('AxelarBridge.buildTransaction: full SDK integration required')
    return { bridge: 'axelar', quote }
  }
}

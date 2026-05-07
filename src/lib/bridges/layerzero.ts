/**
 * LayerZero V2 bridge adapter for Sui.
 *
 * LayerZero went live on Sui in October 2025, connecting Sui to 140+ chains.
 * The OFT (Omnichain Fungible Token) standard powers assets like WBTC, PYUSD, USDT0.
 * Stargate Finance (built on LayerZero) was acquired by LayerZero in Aug 2025.
 *
 * SDK: @layerzerolabs/lz-v2-utilities, @layerzerolabs/ui-core
 * API: https://api.stg.stargate.finance/bus/quote (Stargate V3 as LayerZero liquidity layer)
 *
 * LayerZero Endpoint V2 on Sui: deployed Oct 2025
 * Supported assets: USDC, USDT0, WBTC, ETH (via OFT standard)
 * Fee: ~0.06% protocol fee + gas
 * Speed: 1-5 min depending on source chain (DVN confirmations)
 */

import type { BridgeProvider, BridgeQuote, BridgeQuoteParams } from './types'
import { CHAIN_IDS } from './types'

/** LayerZero V2 Endpoint IDs (EID) per chain */
const LZ_ENDPOINT_IDS: Record<number, number> = {
  [CHAIN_IDS.ETHEREUM]:  30101,
  [CHAIN_IDS.BNB_CHAIN]: 30102,
  [CHAIN_IDS.AVALANCHE]: 30106,
  [CHAIN_IDS.POLYGON]:   30109,
  [CHAIN_IDS.ARBITRUM]:  30110,
  [CHAIN_IDS.OPTIMISM]:  30111,
  [CHAIN_IDS.BASE]:      30184,
  [CHAIN_IDS.SUI]:       30164,
}

const ESTIMATED_TIMES: Record<number, number> = {
  [CHAIN_IDS.ETHEREUM]:  300,   // 5 min (20 DVN confirmations)
  [CHAIN_IDS.BNB_CHAIN]: 90,    // 90 sec
  [CHAIN_IDS.ARBITRUM]:  90,    // 90 sec
  [CHAIN_IDS.OPTIMISM]:  120,   // 2 min
  [CHAIN_IDS.BASE]:      90,    // 90 sec
  [CHAIN_IDS.POLYGON]:   120,   // 2 min
  [CHAIN_IDS.AVALANCHE]: 90,    // 90 sec
}

const APPROX_FEE_USD: Record<number, number> = {
  [CHAIN_IDS.ETHEREUM]:  3.50,
  [CHAIN_IDS.BNB_CHAIN]: 0.80,
  [CHAIN_IDS.ARBITRUM]:  0.60,
  [CHAIN_IDS.OPTIMISM]:  0.50,
  [CHAIN_IDS.BASE]:      0.40,
  [CHAIN_IDS.POLYGON]:   0.30,
  [CHAIN_IDS.AVALANCHE]: 0.50,
}

export class LayerZeroBridge implements BridgeProvider {
  readonly id = 'layerzero'
  readonly name = 'LayerZero'
  readonly logo = 'https://layerzero.network/static/logo.svg'
  readonly color = '#3B82F6'
  readonly website = 'https://stargate.finance'

  /** Note: Solana not yet supported in LZ V2 on Sui (EVM-only initially) */
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

    // LayerZero / Stargate V3 fee: ~0.06% for stablecoins
    const feeRate = 6n   // 0.06% in basis-points * 0.01
    const fee = (amount * feeRate) / 10000n
    const toAmount = amount - fee

    const feeUSD = APPROX_FEE_USD[fromChainId] ?? 1.50
    const gasCostUSD = feeUSD * 0.3

    const estimatedTime = ESTIMATED_TIMES[fromChainId] ?? 180

    const srcEid = LZ_ENDPOINT_IDS[fromChainId] ?? 30101
    const dstEid = LZ_ENDPOINT_IDS[CHAIN_IDS.SUI]
    const url = `https://stargate.finance/bridge?srcChain=${srcEid}&dstChain=${dstEid}`

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
      route: ['Source Chain', 'LayerZero DVN', 'Sui'],
      url,
    }
  }

  async buildTransaction(quote: BridgeQuote): Promise<unknown> {
    // Full integration would use:
    // import { createOFTAdapterConfig } from '@layerzerolabs/lz-v2-utilities'
    // Send via the OFT contract send() function with lzParams
    console.warn('LayerZeroBridge.buildTransaction: full SDK integration required')
    return { bridge: 'layerzero', quote }
  }
}

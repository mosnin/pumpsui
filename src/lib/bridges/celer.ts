/**
 * Celer cBridge adapter for Sui.
 *
 * Celer launched cBridge support for Sui in June 2023, making it one of the earliest
 * bridges to support Sui mainnet. Uses xAsset (lock-and-mint) model.
 *
 * Supported tokens initially: ETH, WBTC, USDC, USDT, DAI
 * Source chains: Ethereum, BSC, Arbitrum, Optimism, Polygon, Avalanche
 *
 * API: https://cbridge-prod2.celer.network/v2/
 * Docs: https://cbridge-docs.celer.network/developer/cbridge-apis-for-sui
 * Fee: 0.04–0.19% depending on chain + gas
 * Speed: ~5-20 min
 */

import type { BridgeProvider, BridgeQuote, BridgeQuoteParams } from './types'
import { CHAIN_IDS } from './types'

/** Celer internal chain IDs */
const CELER_CHAIN_IDS: Record<number, number> = {
  [CHAIN_IDS.ETHEREUM]:  1,
  [CHAIN_IDS.BNB_CHAIN]: 56,
  [CHAIN_IDS.ARBITRUM]:  42161,
  [CHAIN_IDS.OPTIMISM]:  10,
  [CHAIN_IDS.POLYGON]:   137,
  [CHAIN_IDS.AVALANCHE]: 43114,
  [CHAIN_IDS.SUI]:       784,    // Celer uses Sui's official chain ID
}

/** cBridge API base URL */
const CBRIDGE_API = 'https://cbridge-prod2.celer.network/v2'

const ESTIMATED_TIMES: Record<number, number> = {
  [CHAIN_IDS.ETHEREUM]:  1200,  // 20 min (15 Ethereum confirmations for lock)
  [CHAIN_IDS.BNB_CHAIN]: 300,   // 5 min
  [CHAIN_IDS.ARBITRUM]:  300,   // 5 min
  [CHAIN_IDS.OPTIMISM]:  300,   // 5 min
  [CHAIN_IDS.POLYGON]:   600,   // 10 min
  [CHAIN_IDS.AVALANCHE]: 180,   // 3 min
}

const APPROX_FEE_USD: Record<number, number> = {
  [CHAIN_IDS.ETHEREUM]:  4.00,
  [CHAIN_IDS.BNB_CHAIN]: 1.20,
  [CHAIN_IDS.ARBITRUM]:  0.80,
  [CHAIN_IDS.OPTIMISM]:  0.70,
  [CHAIN_IDS.POLYGON]:   0.40,
  [CHAIN_IDS.AVALANCHE]: 0.70,
}

/** Fee rates in basis points per chain (cBridge charges 4–19 bps) */
const FEE_BPS: Record<number, bigint> = {
  [CHAIN_IDS.ETHEREUM]:  8n,
  [CHAIN_IDS.BNB_CHAIN]: 4n,
  [CHAIN_IDS.ARBITRUM]:  4n,
  [CHAIN_IDS.OPTIMISM]:  4n,
  [CHAIN_IDS.POLYGON]:   4n,
  [CHAIN_IDS.AVALANCHE]: 4n,
}

export class CelerBridge implements BridgeProvider {
  readonly id = 'celer'
  readonly name = 'Celer cBridge'
  readonly logo = 'https://cbridge.celer.network/logo192.png'
  readonly color = '#00D395'
  readonly website = 'https://cbridge.celer.network'

  /** Note: Solana not supported by cBridge (EVM-only) */
  readonly supportedFromChains: number[] = [
    CHAIN_IDS.ETHEREUM,
    CHAIN_IDS.BNB_CHAIN,
    CHAIN_IDS.ARBITRUM,
    CHAIN_IDS.OPTIMISM,
    CHAIN_IDS.POLYGON,
    CHAIN_IDS.AVALANCHE,
  ]

  readonly supportedToChains: number[] = [
    CHAIN_IDS.SUI,
  ]

  async getQuote(params: BridgeQuoteParams): Promise<BridgeQuote> {
    const { fromChainId, amount } = params

    // Try to fetch live quote from cBridge API
    // If API call fails we fall back to static estimates
    try {
      return await this._fetchLiveQuote(params)
    } catch {
      return this._staticQuote(params)
    }
  }

  private async _fetchLiveQuote(params: BridgeQuoteParams): Promise<BridgeQuote> {
    const { fromChainId, toChainId, fromToken, amount } = params

    const srcCelerId = CELER_CHAIN_IDS[fromChainId]
    const dstCelerId = CELER_CHAIN_IDS[toChainId] ?? CELER_CHAIN_IDS[CHAIN_IDS.SUI]

    const resp = await fetch(
      `${CBRIDGE_API}/estimateAmt?src_chain_id=${srcCelerId}&dst_chain_id=${dstCelerId}&token_symbol=${params.fromToken.includes('USDC') ? 'USDC' : 'USDT'}&amt=${amount.toString()}&usr_addr=${params.recipient}&slippage_tolerance=3000`,
      { signal: AbortSignal.timeout(5000) }
    )

    if (!resp.ok) throw new Error(`cBridge API error: ${resp.status}`)
    const data = await resp.json()

    const toAmount = BigInt(data.estimated_receive_amt ?? 0)
    const fee = amount - toAmount

    return {
      bridgeId: this.id,
      bridgeName: this.name,
      bridgeLogo: this.logo,
      bridgeColor: this.color,
      fromAmount: amount,
      toAmount,
      fee,
      feeUSD: APPROX_FEE_USD[fromChainId] ?? 2.0,
      gasCostUSD: (APPROX_FEE_USD[fromChainId] ?? 2.0) * 0.35,
      totalCostUSD: (APPROX_FEE_USD[fromChainId] ?? 2.0) * 1.35,
      estimatedTime: ESTIMATED_TIMES[fromChainId] ?? 600,
      priceImpact: 0,
      route: ['Source Chain', 'cBridge Lock', 'Sui Mint'],
      url: `https://cbridge.celer.network/#/transfer?sourceChainId=${CELER_CHAIN_IDS[fromChainId]}&destinationChainId=${dstCelerId}`,
    }
  }

  private _staticQuote(params: BridgeQuoteParams): BridgeQuote {
    const { fromChainId, amount } = params
    const feeBps = FEE_BPS[fromChainId] ?? 8n
    const fee = (amount * feeBps) / 10000n
    const toAmount = amount - fee

    const feeUSD = APPROX_FEE_USD[fromChainId] ?? 2.0
    const gasCostUSD = feeUSD * 0.35

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
      estimatedTime: ESTIMATED_TIMES[fromChainId] ?? 600,
      priceImpact: 0,
      route: ['Source Chain', 'cBridge Lock', 'Sui Mint'],
      url: `https://cbridge.celer.network/#/transfer?destinationChainId=784`,
    }
  }

  async buildTransaction(quote: BridgeQuote): Promise<unknown> {
    // Full integration: call the cBridge smart contract transferOut()
    // using the @celer-network/cbridge-sdk or direct ABI encoding
    console.warn('CelerBridge.buildTransaction: full SDK integration required')
    return { bridge: 'celer', quote }
  }
}

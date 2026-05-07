/**
 * Mayan Finance bridge adapter.
 *
 * Mayan is a cross-chain swap auction protocol that supports Sui, Solana, and EVM chains.
 * It uses Wormhole for cross-chain messaging with CCTP for USDC transfers.
 * The auction mechanism on Solana finds the best swap rate trustlessly.
 *
 * SDK: @mayanfinance/swap-sdk (npm)
 * Key functions: fetchQuote, swapFromEvm, swapFromSolana, createSwapFromSuiMoveCalls
 *
 * Supported routes:
 *   - Solana ↔ Sui (fastest, ~1 min)
 *   - EVM chains → Sui via Solana auction
 *   - Sui → EVM chains
 *
 * Fee: 0.2-0.5% (auction-based, users get best rate)
 * Speed: 1-5 min (Solana fast), 5-15 min (EVM)
 * Security: Audited by OtterSec; trustless via Wormhole VAAs
 */

import type { BridgeProvider, BridgeQuote, BridgeQuoteParams } from './types'
import { CHAIN_IDS } from './types'

/** Mayan's chain identifiers */
const MAYAN_CHAIN_NAMES: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM]:  'ethereum',
  [CHAIN_IDS.BNB_CHAIN]: 'bsc',
  [CHAIN_IDS.ARBITRUM]:  'arbitrum',
  [CHAIN_IDS.OPTIMISM]:  'optimism',
  [CHAIN_IDS.BASE]:      'base',
  [CHAIN_IDS.POLYGON]:   'polygon',
  [CHAIN_IDS.AVALANCHE]: 'avalanche',
  [CHAIN_IDS.SOLANA]:    'solana',
  [CHAIN_IDS.SUI]:       'sui',
}

/** Mayan API endpoint for quotes */
const MAYAN_API = 'https://price-api.mayan.finance/v3'

const ESTIMATED_TIMES: Record<number, number> = {
  [CHAIN_IDS.SOLANA]:    60,    // ~1 min (Solana → Sui directly)
  [CHAIN_IDS.BASE]:      120,   // 2 min
  [CHAIN_IDS.ARBITRUM]:  150,   // 2.5 min
  [CHAIN_IDS.OPTIMISM]:  150,   // 2.5 min
  [CHAIN_IDS.ETHEREUM]:  600,   // 10 min
  [CHAIN_IDS.BNB_CHAIN]: 180,   // 3 min
  [CHAIN_IDS.POLYGON]:   180,   // 3 min
  [CHAIN_IDS.AVALANCHE]: 120,   // 2 min
}

const APPROX_FEE_USD: Record<number, number> = {
  [CHAIN_IDS.SOLANA]:    0.20,  // very cheap from Solana
  [CHAIN_IDS.BASE]:      0.50,
  [CHAIN_IDS.ARBITRUM]:  0.60,
  [CHAIN_IDS.OPTIMISM]:  0.50,
  [CHAIN_IDS.ETHEREUM]:  4.00,
  [CHAIN_IDS.BNB_CHAIN]: 0.80,
  [CHAIN_IDS.POLYGON]:   0.30,
  [CHAIN_IDS.AVALANCHE]: 0.50,
}

export class MayanBridge implements BridgeProvider {
  readonly id = 'mayan'
  readonly name = 'Mayan Finance'
  readonly logo = 'https://mayan.finance/logo.png'
  readonly color = '#14B8A6'    // teal - Mayan brand
  readonly website = 'https://mayan.finance'

  /** Mayan supports all major chains including Solana (its primary chain) */
  readonly supportedFromChains: number[] = [
    CHAIN_IDS.SOLANA,
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
    CHAIN_IDS.SOLANA,
    CHAIN_IDS.ETHEREUM,
    CHAIN_IDS.BNB_CHAIN,
    CHAIN_IDS.ARBITRUM,
    CHAIN_IDS.OPTIMISM,
    CHAIN_IDS.BASE,
    CHAIN_IDS.POLYGON,
    CHAIN_IDS.AVALANCHE,
  ]

  async getQuote(params: BridgeQuoteParams): Promise<BridgeQuote> {
    try {
      return await this._fetchLiveQuote(params)
    } catch {
      return this._staticQuote(params)
    }
  }

  private async _fetchLiveQuote(params: BridgeQuoteParams): Promise<BridgeQuote> {
    const { fromChainId, toChainId, amount } = params

    const fromChain = MAYAN_CHAIN_NAMES[fromChainId]
    const toChain = MAYAN_CHAIN_NAMES[toChainId] ?? 'sui'

    // Mayan quote API: GET /quote?amountIn=...&fromChain=...&toChain=...&fromToken=...&toToken=...
    const url = new URL(`${MAYAN_API}/quote`)
    url.searchParams.set('amountIn', amount.toString())
    url.searchParams.set('fromChain', fromChain)
    url.searchParams.set('toChain', toChain)
    url.searchParams.set('fromToken', params.fromToken)
    url.searchParams.set('toToken', params.toToken)
    url.searchParams.set('slippage', '0.5')

    const resp = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) })
    if (!resp.ok) throw new Error(`Mayan API error: ${resp.status}`)
    const data = await resp.json()

    // API returns quotes array sorted by output amount
    const best = Array.isArray(data) ? data[0] : data
    if (!best) throw new Error('No Mayan quote')

    const toAmount = BigInt(Math.floor((best.expectedAmountOut ?? 0) * 1e6))
    const fee = amount - toAmount

    return {
      bridgeId: this.id,
      bridgeName: this.name,
      bridgeLogo: this.logo,
      bridgeColor: this.color,
      fromAmount: amount,
      toAmount,
      fee,
      feeUSD: best.swapRelayerFee ?? APPROX_FEE_USD[fromChainId] ?? 1.0,
      gasCostUSD: best.redeemRelayerFee ?? 0.1,
      totalCostUSD: (best.swapRelayerFee ?? 0) + (best.redeemRelayerFee ?? 0),
      estimatedTime: ESTIMATED_TIMES[fromChainId] ?? 300,
      priceImpact: best.priceImpact ?? 0,
      route: fromChainId === CHAIN_IDS.SOLANA
        ? ['Solana', 'Mayan Auction', 'Sui']
        : ['Source Chain', 'Solana Auction', 'Wormhole', 'Sui'],
      url: `https://mayan.finance/?fromChain=${fromChain}&toChain=${toChain}`,
    }
  }

  private _staticQuote(params: BridgeQuoteParams): BridgeQuote {
    const { fromChainId, amount } = params

    // Mayan fee: ~0.3% auction fee
    const fee = (amount * 30n) / 10000n
    const toAmount = amount - fee

    const feeUSD = APPROX_FEE_USD[fromChainId] ?? 1.0
    const gasCostUSD = 0.10

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
      route: fromChainId === CHAIN_IDS.SOLANA
        ? ['Solana', 'Mayan Auction', 'Sui']
        : ['Source Chain', 'Solana Auction', 'Wormhole', 'Sui'],
      url: 'https://mayan.finance',
    }
  }

  async buildTransaction(quote: BridgeQuote): Promise<unknown> {
    // Full integration uses @mayanfinance/swap-sdk:
    //   const quotes = await fetchQuote({ ... })
    //   const swapTx = await swapFromEvm(quote, signer, ...)
    //   // or createSwapFromSuiMoveCalls for Sui → X
    console.warn('MayanBridge.buildTransaction: full SDK integration required')
    return { bridge: 'mayan', quote }
  }
}

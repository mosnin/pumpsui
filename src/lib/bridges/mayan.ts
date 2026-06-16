/**
 * Mayan Finance bridge adapter — wired to the live price-api.mayan.finance/v3/quote API.
 *
 * Mayan is a cross-chain swap auction protocol that supports Sui, Solana, and EVM chains.
 * It uses Wormhole for cross-chain messaging with CCTP for USDC transfers.
 * The auction mechanism on Solana finds the best swap rate trustlessly.
 *
 * API: https://price-api.mayan.finance/v3/quote
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

/** Mayan price API v3 base URL */
const MAYAN_API = 'https://price-api.mayan.finance/v3'

/** Mayan's chain identifier strings */
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

// ─── Live API response shape (v3/quote) ───────────────────────────────────────

interface MayanQuoteResponse {
  // v3 top-level structure; Mayan returns an array of quotes ordered by output
  quotes?: MayanQuote[]
  // Sometimes the API wraps directly
  expectedAmountOut?: number
  swapRelayerFee?: number
  redeemRelayerFee?: number
  priceImpact?: number
  eta?: number                     // seconds
  gasDrop?: number                 // gas airdrop on destination
}

interface MayanQuote {
  expectedAmountOut: number        // human-readable output amount
  priceImpact: number              // 0-1
  swapRelayerFee: number           // USD
  redeemRelayerFee: number         // USD (claim gas on destination)
  clientFee?: number               // optional integrator fee
  eta?: number                     // estimated seconds
  gasDrop?: number
  type?: string                    // 'WH' | 'SWIFT' | 'MCTP'
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

  /**
   * Fetch a live quote from the Mayan v3 quote API.
   *
   * GET https://price-api.mayan.finance/v3/quote
   *   ?amount=<human amount>
   *   &fromToken=<address>
   *   &toToken=<address>
   *   &fromChain=<chainName>
   *   &toChain=<chainName>
   *   &slippage=0.3
   *   &gasDrop=0
   */
  private async _fetchLiveQuote(params: BridgeQuoteParams): Promise<BridgeQuote> {
    const { fromChainId, toChainId, amount, fromToken, toToken } = params

    const fromChain = MAYAN_CHAIN_NAMES[fromChainId]
    const toChain   = MAYAN_CHAIN_NAMES[toChainId] ?? 'sui'

    if (!fromChain) throw new Error(`Mayan: unsupported fromChain ${fromChainId}`)

    // Mayan expects a human-readable amount, not base units.
    // We derive a rough decimal count from token address heuristics.
    const decimals = _guessDecimals(fromToken, fromChainId)
    const humanAmount = Number(amount) / 10 ** decimals

    const url = new URL(`${MAYAN_API}/quote`)
    url.searchParams.set('amount', humanAmount.toFixed(6))
    url.searchParams.set('fromToken', fromToken)
    url.searchParams.set('toToken', toToken)
    url.searchParams.set('fromChain', fromChain)
    url.searchParams.set('toChain', toChain)
    url.searchParams.set('slippage', '0.3')
    url.searchParams.set('gasDrop', '0')

    const resp = await fetch(url.toString(), {
      signal: AbortSignal.timeout(7000),
      headers: { 'Accept': 'application/json' },
    })
    if (!resp.ok) throw new Error(`Mayan API ${resp.status}: ${resp.statusText}`)

    const data: MayanQuoteResponse | MayanQuote[] = await resp.json()

    // Handle both array and object response shapes
    let best: MayanQuote | null = null
    if (Array.isArray(data)) {
      best = data[0] ?? null
    } else if (Array.isArray((data as MayanQuoteResponse).quotes)) {
      best = (data as MayanQuoteResponse).quotes![0] ?? null
    } else if (typeof (data as MayanQuote).expectedAmountOut === 'number') {
      best = data as MayanQuote
    }

    if (!best) throw new Error('Mayan: empty quote response')

    // Convert output back to base units using same decimal count for to-token
    const outDecimals = _guessDecimals(toToken, toChainId)
    const toAmount = BigInt(Math.floor(best.expectedAmountOut * 10 ** outDecimals))
    const fee = amount - toAmount < 0n ? 0n : amount - toAmount

    const swapFee   = best.swapRelayerFee   ?? APPROX_FEE_USD[fromChainId] ?? 1.0
    const redeemFee = best.redeemRelayerFee ?? 0.10
    const eta       = best.eta              ?? ESTIMATED_TIMES[fromChainId] ?? 300

    return {
      bridgeId: this.id,
      bridgeName: this.name,
      bridgeLogo: this.logo,
      bridgeColor: this.color,
      fromAmount: amount,
      toAmount,
      fee,
      feeUSD: swapFee,
      gasCostUSD: redeemFee,
      totalCostUSD: swapFee + redeemFee,
      estimatedTime: eta,
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
    console.warn('MayanBridge.buildTransaction: connect a wallet signer to complete')
    return { bridge: 'mayan', quote }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Heuristically guess token decimal precision from its address.
 * Used when we don't have a token registry look-up.
 */
function _guessDecimals(tokenAddress: string, chainId: number): number {
  const addr = tokenAddress.toLowerCase()
  // USDC / USDT
  if (addr.includes('usdc') || addr.includes('usdt') || addr.includes('a0b869') || addr.includes('dac17f')) return 6
  // WBTC
  if (addr.includes('2260fac') || addr.includes('wbtc')) return 8
  // Sui native
  if (chainId === CHAIN_IDS.SUI) return 9
  // Solana SOL
  if (addr === 'so11111111111111111111111111111111111111112') return 9
  // Default EVM ETH / ERC-20
  return 18
}

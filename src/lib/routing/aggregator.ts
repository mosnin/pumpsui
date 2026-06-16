/**
 * OmniWeaveAggregator — the main entry point for the routing engine.
 *
 * Flow:
 *  1. Fan-out pool fetches to all registered DEX adapters in parallel.
 *  2. Populate a RouteGraph with every returned pool.
 *  3. Search the graph for single-path and split routes.
 *  4. Simulate each candidate route to get exact output amounts.
 *  5. Pick the route (single vs split) that maximises output after gas.
 *  6. Return a fully hydrated QuoteResult.
 *
 * The aggregator is designed to be called repeatedly for live requoting —
 * each call fetches fresh pool state, so callers should debounce as needed
 * (e.g. 300 ms) rather than throttling inside the aggregator.
 */

import type { SuiClient } from '@mysten/sui/client'
import {
  Pool,
  Route,
  SplitRoute,
  QuoteResult,
  QuoteOptions,
} from './types'
import { RouteGraph } from './graph'
import { DEX_ADAPTERS, DexAdapter } from './dexAdapters'

/** Gas price in MIST per gas unit — used for gas-adjusted output comparison */
const GAS_PRICE_MIST = 1_000n

export class OmniWeaveAggregator {
  private readonly adapters: DexAdapter[]

  /**
   * @param suiClient  - A connected @mysten/sui SuiClient instance
   * @param adapters   - DEX adapters to use (defaults to all six supported DEXes)
   */
  constructor(
    private readonly suiClient: SuiClient,
    adapters: DexAdapter[] = DEX_ADAPTERS
  ) {
    this.adapters = adapters
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Compute the best swap quote for tokenIn → tokenOut.
   *
   * @param tokenIn   - Fully-qualified Sui type string, e.g. "0x2::sui::SUI"
   * @param tokenOut  - Fully-qualified Sui type string
   * @param amountIn  - Amount to sell, in base units (no decimals applied)
   * @param options   - Tuning parameters (maxHops, maxSplits, splitGranularityBps)
   * @returns A QuoteResult with the recommended route and metadata
   */
  async getQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    options: QuoteOptions = {}
  ): Promise<QuoteResult> {
    const {
      maxHops = 3,
      maxSplits = 3,
      splitGranularityBps = 1_000,
    } = options

    // 1. Fetch pools from all DEXes in parallel
    const pools = await this.fetchAllPools(tokenIn, tokenOut)

    if (pools.length === 0) {
      return this.emptyQuote()
    }

    // 2. Build graph
    const graph = new RouteGraph()
    for (const pool of pools) {
      graph.addPool(pool)
    }

    // 3. Find routes
    const singleRoutes = graph.findRoutes(tokenIn, tokenOut, amountIn, maxHops)
    const splitRoutes = graph.findSplitRoutes(
      tokenIn,
      tokenOut,
      amountIn,
      maxSplits,
      splitGranularityBps
    )

    // 4. Select the best option
    return this.selectBestRoute(singleRoutes, splitRoutes, amountIn)
  }

  // ---------------------------------------------------------------------------
  // Pool fetching
  // ---------------------------------------------------------------------------

  /**
   * Fan out pool fetching to all adapters in parallel, collecting results.
   * Individual adapter failures are swallowed (with a console warning) so that
   * a single unhealthy DEX does not break the whole quote.
   *
   * For multi-hop support we also fetch pools for intermediate tokens.
   * Currently we search one level of intermediaries (the most common tokens).
   */
  private async fetchAllPools(tokenIn: string, tokenOut: string): Promise<Pool[]> {
    const fetches: Promise<Pool[]>[] = []

    // Direct pair from every adapter
    for (const adapter of this.adapters) {
      fetches.push(
        adapter.fetchPools(tokenIn, tokenOut, this.suiClient).catch(err => {
          console.warn(`[OmniWeave] ${adapter.dexId} fetchPools failed:`, err)
          return []
        })
      )
    }

    // Intermediate hops via common bridge tokens
    const bridgeTokens = BRIDGE_TOKENS.filter(t => t !== tokenIn && t !== tokenOut)
    for (const bridge of bridgeTokens) {
      for (const adapter of this.adapters) {
        fetches.push(
          adapter.fetchPools(tokenIn, bridge, this.suiClient).catch(() => [])
        )
        fetches.push(
          adapter.fetchPools(bridge, tokenOut, this.suiClient).catch(() => [])
        )
      }
    }

    const results = await Promise.all(fetches)
    const allPools = results.flat()

    // Deduplicate by pool ID
    const seen = new Set<string>()
    return allPools.filter(p => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
  }

  /** Fetch pools for a specific token pair from a specific adapter */
  private async fetchCetusPools(tokenA: string, tokenB: string): Promise<Pool[]> {
    const adapter = this.adapters.find(a => a.dexId === 'cetus')
    return adapter ? adapter.fetchPools(tokenA, tokenB, this.suiClient) : []
  }

  /** Fetch pools for a specific token pair from Turbos */
  private async fetchTurbosPools(tokenA: string, tokenB: string): Promise<Pool[]> {
    const adapter = this.adapters.find(a => a.dexId === 'turbos')
    return adapter ? adapter.fetchPools(tokenA, tokenB, this.suiClient) : []
  }

  /** Fetch pools for a specific token pair from DeepBook */
  private async fetchDeepBookPools(tokenA: string, tokenB: string): Promise<Pool[]> {
    const adapter = this.adapters.find(a => a.dexId === 'deepbook')
    return adapter ? adapter.fetchPools(tokenA, tokenB, this.suiClient) : []
  }

  /** Fetch pools for a specific token pair from Aftermath */
  private async fetchAftermathPools(tokenA: string, tokenB: string): Promise<Pool[]> {
    const adapter = this.adapters.find(a => a.dexId === 'aftermath')
    return adapter ? adapter.fetchPools(tokenA, tokenB, this.suiClient) : []
  }

  // ---------------------------------------------------------------------------
  // Route selection
  // ---------------------------------------------------------------------------

  /**
   * Compare all candidate routes and return the best QuoteResult.
   *
   * "Best" means highest gas-adjusted output:
   *   adjustedOutput = outputAmount - gasEstimate * GAS_PRICE_MIST
   *
   * If the best split route beats the best single route by more than
   * SPLIT_IMPROVEMENT_THRESHOLD_BPS basis points, recommend the split.
   */
  private selectBestRoute(
    routes: Route[],
    splitRoutes: SplitRoute[],
    amountIn: bigint
  ): QuoteResult {
    const bestSingle = routes[0] ?? null
    const bestSplit = splitRoutes[0] ?? null

    if (!bestSingle && !bestSplit) {
      return this.emptyQuote()
    }

    const singleAdjusted = bestSingle
      ? bestSingle.outputAmount - bestSingle.gasEstimate * GAS_PRICE_MIST
      : 0n

    // Gas for a split route: roughly one PTB with N move calls
    const splitGas = bestSplit
      ? BigInt(bestSplit.routes.length) * 5_000_000n + 2_000_000n
      : 0n
    const splitAdjusted = bestSplit ? bestSplit.totalOutput - splitGas * GAS_PRICE_MIST : 0n

    // Require split to beat single by at least 5 bps to offset complexity
    const SPLIT_THRESHOLD_BPS = 5n
    const splitThreshold =
      singleAdjusted > 0n
        ? (singleAdjusted * SPLIT_THRESHOLD_BPS) / 10_000n
        : 0n

    const useSplit =
      bestSplit !== null &&
      splitAdjusted > singleAdjusted + splitThreshold

    const effectiveRoute = useSplit ? null : bestSingle
    const effectiveOutput = useSplit
      ? bestSplit!.totalOutput
      : (bestSingle?.outputAmount ?? 0n)
    const effectivePriceImpact = useSplit
      ? bestSplit!.priceImpact
      : (bestSingle?.priceImpact ?? 0)

    // Execution price (float): output per unit input
    const executionPrice =
      amountIn > 0n ? Number(effectiveOutput) / Number(amountIn) : 0

    // Mid price: use the first (best-liquidity) pool in the best route
    const midPrice = this.computeMidPrice(
      useSplit
        ? bestSplit?.routes[0]?.route.path[0]?.pool ?? null
        : bestSingle?.path[0]?.pool ?? null,
      useSplit
        ? bestSplit?.routes[0]?.route.path[0]?.tokenIn ?? ''
        : bestSingle?.path[0]?.tokenIn ?? ''
    )

    return {
      bestRoute: bestSingle,
      bestSplitRoute: bestSplit,
      useSplit,
      outputAmount: effectiveOutput,
      priceImpact: effectivePriceImpact,
      executionPrice,
      midPrice,
    }
  }

  /**
   * Compute the theoretical mid-price of a pool (no fees, no slippage).
   * Returns 0 when the pool or reserves are missing.
   */
  private computeMidPrice(pool: Pool | null, tokenIn: string): number {
    if (!pool) return 0

    if (pool.sqrtPrice !== undefined) {
      // For CLMM: price = sqrtPrice^2 / 2^128
      const sqrtPriceFloat = Number(pool.sqrtPrice) / 2 ** 64
      const price = sqrtPriceFloat * sqrtPriceFloat
      return pool.tokenA === tokenIn ? price : 1 / price
    }

    const [reserveIn, reserveOut] =
      pool.tokenA === tokenIn
        ? [pool.reserveA, pool.reserveB]
        : [pool.reserveB, pool.reserveA]

    if (reserveIn === 0n) return 0
    return Number(reserveOut) / Number(reserveIn)
  }

  /** Return a zero-value QuoteResult when no routes are found */
  private emptyQuote(): QuoteResult {
    return {
      bestRoute: null,
      bestSplitRoute: null,
      useSplit: false,
      outputAmount: 0n,
      priceImpact: 0,
      executionPrice: 0,
      midPrice: 0,
    }
  }
}

// ---------------------------------------------------------------------------
// Bridge token list
// ---------------------------------------------------------------------------

/**
 * Well-known tokens used as intermediate hops in multi-hop routes.
 * These are the Sui mainnet canonical type strings.
 */
export const BRIDGE_TOKENS: string[] = [
  '0x2::sui::SUI',
  '0x5d4b302506645c37ff133b98c4b50a4ae3606ed' +
    '::coin::COIN', // USDC (Wormhole)
  '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c' +
    '::coin::COIN', // USDT (Wormhole)
  '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5' +
    '::coin::COIN', // ETH (Wormhole)
  '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881' +
    '::coin::COIN', // BTC (Wormhole)
]

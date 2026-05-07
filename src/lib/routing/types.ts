/**
 * Core types for the OmniWeave routing engine.
 * These types model pools, routes, and quote results across all supported DEXes.
 */

/** Identifies a supported Sui DEX */
export enum DexId {
  CETUS = 'cetus',
  TURBOS = 'turbos',
  DEEPBOOK = 'deepbook',
  AFTERMATH = 'aftermath',
  FLOWX = 'flowx',
  KRIYA = 'kriya',
}

/**
 * Represents a liquidity pool on any supported DEX.
 * Covers both constant-product AMMs and CLMM (concentrated liquidity) pools.
 */
export interface Pool {
  /** On-chain object ID of the pool */
  id: string
  /** Which DEX this pool belongs to */
  dexId: DexId
  /** Fully-qualified type string for token A, e.g. "0x2::sui::SUI" */
  tokenA: string
  /** Fully-qualified type string for token B */
  tokenB: string
  /** Raw reserve of token A (in base units) */
  reserveA: bigint
  /** Raw reserve of token B (in base units) */
  reserveB: bigint
  /** Swap fee in basis points (e.g. 30 = 0.3%) */
  fee: number
  /** Total liquidity in the pool (LP units or virtual liquidity for CLMMs) */
  liquidity: bigint
  /** Current sqrt price Q64.64 — only present for CLMM pools */
  sqrtPrice?: bigint
  /** Tick spacing — only present for CLMM pools */
  tickSpacing?: number
}

/** A single hop within a route (one pool swap) */
export interface RouteStep {
  /** The pool used for this hop */
  pool: Pool
  /** Token being sold into the pool */
  tokenIn: string
  /** Token being received from the pool */
  tokenOut: string
  /** Amount of tokenIn consumed (base units) */
  amountIn: bigint
  /** Amount of tokenOut received (base units) */
  amountOut: bigint
}

/**
 * A complete swap route, potentially multi-hop.
 * e.g. SUI → USDC → CETUS via two pools.
 */
export interface Route {
  /** Ordered list of swap steps */
  path: RouteStep[]
  /** Total input amount across all steps (base units) */
  inputAmount: bigint
  /** Total output amount from the final step (base units) */
  outputAmount: bigint
  /** Price impact as a percentage (0–100) */
  priceImpact: number
  /** Estimated gas cost in MIST */
  gasEstimate: bigint
}

/**
 * A portion of a split route: one sub-route plus the fraction of input it receives.
 */
export interface SplitRoutePortion {
  route: Route
  /** Fraction of total input this portion receives, in basis points (0–10000) */
  portionBps: number
}

/**
 * A split route distributes the input across multiple routes to reduce price impact.
 * e.g. 60% via Cetus pool, 40% via Turbos pool.
 */
export interface SplitRoute {
  routes: SplitRoutePortion[]
  /** Sum of all portion outputs */
  totalOutput: bigint
  /** Weighted average price impact */
  priceImpact: number
}

/**
 * The full result returned to a caller requesting a quote.
 * Contains both the best single route and best split route so the UI
 * can display comparisons before the user confirms.
 */
export interface QuoteResult {
  /** Best single-path route, or null if no path exists */
  bestRoute: Route | null
  /** Best split route, or null if not beneficial */
  bestSplitRoute: SplitRoute | null
  /** Whether the split route is recommended over the single route */
  useSplit: boolean
  /** The effective output amount (from whichever route is recommended) */
  outputAmount: bigint
  /** Effective price impact percentage */
  priceImpact: number
  /** Output per unit of input, in float (for display) */
  executionPrice: number
  /** Theoretical mid-price ignoring fees and slippage, in float */
  midPrice: number
}

/** Options controlling quote computation depth */
export interface QuoteOptions {
  /** Maximum number of hops in a single route path (default: 3) */
  maxHops?: number
  /** Maximum number of split portions (default: 3) */
  maxSplits?: number
  /** Granularity of split search in bps increments (default: 1000 = 10%) */
  splitGranularityBps?: number
}

/** Internal edge in the route graph */
export interface Edge {
  pool: Pool
  tokenOut: string
}

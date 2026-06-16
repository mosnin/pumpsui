/**
 * Graph-based route finder for OmniWeave.
 *
 * Tokens are nodes; pools are directed edges (bidirectional — each pool creates
 * two edges, one per swap direction).  A modified Dijkstra search maximises
 * output amount rather than minimising cost, making it naturally correct for
 * DEX routing.
 *
 * Split-route search tries a discrete grid of input allocations across the
 * top-K single-pool edges for a pair and picks the split that maximises total
 * output.
 */

import type { Pool, Route, RouteStep, SplitRoute, SplitRoutePortion, Edge } from './types'

// ---------------------------------------------------------------------------
// AMM math utilities
// ---------------------------------------------------------------------------

/**
 * Constant-product AMM output formula with fee.
 *
 * out = (reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee)
 *
 * @param reserveIn  - Pool reserve of the input token (base units)
 * @param reserveOut - Pool reserve of the output token (base units)
 * @param amountIn   - Gross input amount (before fee deduction)
 * @param feeBps     - Fee in basis points (e.g. 30 = 0.3%)
 * @returns Expected output amount (base units), 0n if reserves are empty
 */
export function computeConstantProductAmountOut(
  reserveIn: bigint,
  reserveOut: bigint,
  amountIn: bigint,
  feeBps: number
): bigint {
  if (reserveIn === 0n || reserveOut === 0n || amountIn === 0n) return 0n

  const feeMul = BigInt(10_000 - feeBps)
  const amountInAfterFee = amountIn * feeMul
  const numerator = reserveOut * amountInAfterFee
  const denominator = reserveIn * 10_000n + amountInAfterFee
  return numerator / denominator
}

/**
 * Simplified CLMM (concentrated liquidity) output estimate.
 *
 * Uses the invariant L = liquidity, sqrtP = sqrt(price) in Q64.64 format.
 * This is an approximation that assumes the swap stays within a single tick
 * range — adequate for small-to-medium swaps and quoting purposes.
 *
 * For token A → token B:  Δy = L * (sqrtP_new - sqrtP_old)
 * For token B → token A:  Δx = L * (1/sqrtP_new - 1/sqrtP_old)
 *
 * @param sqrtPrice - Current sqrt price in Q64.64 fixed-point
 * @param liquidity - Active liquidity at the current tick
 * @param amountIn  - Gross input amount (base units)
 * @param tokenIsA  - True when selling token A (the "x" token in xy=k terms)
 * @param feeBps    - Fee in basis points
 * @returns Estimated output amount (base units)
 */
export function computeCLMMAmountOut(
  sqrtPrice: bigint,
  liquidity: bigint,
  amountIn: bigint,
  tokenIsA: boolean,
  feeBps: number
): bigint {
  if (sqrtPrice === 0n || liquidity === 0n || amountIn === 0n) return 0n

  // Q64.64 scale factor
  const Q64 = 1n << 64n

  const feeMul = BigInt(10_000 - feeBps)
  const netAmountIn = (amountIn * feeMul) / 10_000n

  if (tokenIsA) {
    // Selling A (x), getting B (y)
    // Δy = L * sqrtP * Δx / (L + Δx * sqrtP)  (simplified single-range)
    // Using Q64.64: sqrtP is in units where 1.0 == Q64
    const numerator = liquidity * sqrtPrice * netAmountIn
    const denominator = (liquidity * Q64 + netAmountIn * sqrtPrice)
    if (denominator === 0n) return 0n
    return numerator / (denominator * Q64)
  } else {
    // Selling B (y), getting A (x)
    // Δx = L * Δy / (sqrtP * (L * sqrtP + Δy))  (simplified)
    const lSqrtP = (liquidity * sqrtPrice) / Q64
    const denominator = sqrtPrice * (lSqrtP + netAmountIn)
    if (denominator === 0n) return 0n
    return (liquidity * netAmountIn * Q64 * Q64) / denominator
  }
}

/**
 * Estimate price impact percentage for a constant-product pool swap.
 *
 * priceImpact = 1 - (executionPrice / midPrice)
 */
export function computePriceImpact(
  reserveIn: bigint,
  reserveOut: bigint,
  amountIn: bigint,
  amountOut: bigint
): number {
  if (reserveIn === 0n || reserveOut === 0n || amountIn === 0n || amountOut === 0n) return 0

  // Mid price: how many output tokens per input token at current reserves
  const midPriceNum = Number(reserveOut) / Number(reserveIn)
  // Execution price
  const execPrice = Number(amountOut) / Number(amountIn)

  const impact = (1 - execPrice / midPriceNum) * 100
  return Math.max(0, Math.min(100, impact))
}

// ---------------------------------------------------------------------------
// RouteGraph
// ---------------------------------------------------------------------------

/** State node used during Dijkstra-style path search */
interface SearchState {
  token: string
  amountOut: bigint
  steps: RouteStep[]
  visitedPools: Set<string>
}

export class RouteGraph {
  /** token → list of outgoing edges (pool + destination token) */
  private adjacency: Map<string, Edge[]> = new Map()

  // ---------------------------------------------------------------------------
  // Graph construction
  // ---------------------------------------------------------------------------

  /**
   * Register a pool as two directed edges (one per swap direction).
   * Calling this with the same pool twice is safe — duplicate pool IDs are
   * de-duplicated on the edge lists.
   */
  addPool(pool: Pool): void {
    this.addEdge(pool.tokenA, { pool, tokenOut: pool.tokenB })
    this.addEdge(pool.tokenB, { pool, tokenOut: pool.tokenA })
  }

  private addEdge(tokenIn: string, edge: Edge): void {
    const edges = this.adjacency.get(tokenIn) ?? []
    // Prevent duplicate pool entries for the same direction
    if (!edges.some(e => e.pool.id === edge.pool.id && e.tokenOut === edge.tokenOut)) {
      edges.push(edge)
    }
    this.adjacency.set(tokenIn, edges)
  }

  /** Remove all pools — useful when refreshing pool data */
  clear(): void {
    this.adjacency.clear()
  }

  // ---------------------------------------------------------------------------
  // Amount computation
  // ---------------------------------------------------------------------------

  /**
   * Compute the expected output for a single pool swap, dispatching to the
   * correct AMM formula based on whether the pool is a CLMM or classic AMM.
   */
  private computeAmountOut(pool: Pool, amountIn: bigint, tokenIn: string): bigint {
    const isCLMM = pool.sqrtPrice !== undefined

    if (isCLMM) {
      const tokenIsA = pool.tokenA === tokenIn
      return computeCLMMAmountOut(
        pool.sqrtPrice!,
        pool.liquidity,
        amountIn,
        tokenIsA,
        pool.fee
      )
    }

    // Constant-product AMM
    const [reserveIn, reserveOut] =
      pool.tokenA === tokenIn
        ? [pool.reserveA, pool.reserveB]
        : [pool.reserveB, pool.reserveA]

    return computeConstantProductAmountOut(reserveIn, reserveOut, amountIn, pool.fee)
  }

  // ---------------------------------------------------------------------------
  // Single-path route search
  // ---------------------------------------------------------------------------

  /**
   * Find all routes from tokenIn to tokenOut up to maxHops deep.
   *
   * Uses a BFS/priority-queue style search that keeps the state with the
   * highest intermediate output at each expansion step, similar to Dijkstra
   * but maximising rather than minimising.
   *
   * @param tokenIn   - Input token type string
   * @param tokenOut  - Output token type string
   * @param amountIn  - Input amount in base units
   * @param maxHops   - Maximum pool hops (default 3)
   * @returns Array of routes sorted by outputAmount descending
   */
  findRoutes(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    maxHops = 3
  ): Route[] {
    const results: Route[] = []

    // Priority queue ordered by amountOut descending
    const queue: SearchState[] = [
      {
        token: tokenIn,
        amountOut: amountIn,
        steps: [],
        visitedPools: new Set(),
      },
    ]

    while (queue.length > 0) {
      // Pop the state with the highest current output
      queue.sort((a, b) => (b.amountOut > a.amountOut ? 1 : b.amountOut < a.amountOut ? -1 : 0))
      const state = queue.shift()!

      if (state.steps.length > maxHops) continue

      const edges = this.adjacency.get(state.token) ?? []

      for (const edge of edges) {
        const { pool, tokenOut: nextToken } = edge

        // Avoid re-using the same pool in a route (no cycles)
        if (state.visitedPools.has(pool.id)) continue

        const amountOut = this.computeAmountOut(pool, state.amountOut, state.token)
        if (amountOut === 0n) continue

        const step: RouteStep = {
          pool,
          tokenIn: state.token,
          tokenOut: nextToken,
          amountIn: state.amountOut,
          amountOut,
        }

        const newSteps = [...state.steps, step]
        const newVisited = new Set(state.visitedPools)
        newVisited.add(pool.id)

        if (nextToken === tokenOut) {
          // Found a complete route
          results.push(this.buildRoute(newSteps, amountIn))
        } else if (newSteps.length < maxHops) {
          // Keep searching deeper
          queue.push({
            token: nextToken,
            amountOut,
            steps: newSteps,
            visitedPools: newVisited,
          })
        }
      }
    }

    // Sort best first
    results.sort((a, b) => (b.outputAmount > a.outputAmount ? 1 : -1))
    return results
  }

  /** Construct a Route object from an ordered list of steps */
  private buildRoute(steps: RouteStep[], inputAmount: bigint): Route {
    const outputAmount = steps[steps.length - 1].amountOut

    // Aggregate price impact across steps (compound)
    let priceImpact = 0
    for (const step of steps) {
      const isCLMM = step.pool.sqrtPrice !== undefined
      if (!isCLMM) {
        const [rIn, rOut] =
          step.pool.tokenA === step.tokenIn
            ? [step.pool.reserveA, step.pool.reserveB]
            : [step.pool.reserveB, step.pool.reserveA]
        const stepImpact = computePriceImpact(rIn, rOut, step.amountIn, step.amountOut)
        // Compound: total = 1 - (1-p1)(1-p2)...
        priceImpact = 1 - (1 - priceImpact / 100) * (1 - stepImpact / 100)
        priceImpact *= 100
      }
    }

    // Gas estimate: base 5 MIST per step + 1000 for PTB overhead
    const GAS_PER_STEP = 5_000_000n
    const GAS_BASE = 1_000_000n
    const gasEstimate = GAS_BASE + GAS_PER_STEP * BigInt(steps.length)

    return {
      path: steps,
      inputAmount,
      outputAmount,
      priceImpact,
      gasEstimate,
    }
  }

  // ---------------------------------------------------------------------------
  // Split-route search
  // ---------------------------------------------------------------------------

  /**
   * Find the optimal split across direct (single-hop) pools for a token pair.
   *
   * Strategy:
   * 1. Collect all direct pool edges from tokenIn → tokenOut.
   * 2. If fewer than 2 pools exist, no split is possible.
   * 3. Grid-search allocation fractions in `granularityBps` increments.
   * 4. Return the allocation that maximises total output.
   *
   * @param tokenIn         - Input token type string
   * @param tokenOut        - Output token type string
   * @param inputAmount     - Total input amount in base units
   * @param maxSplits       - Maximum number of routes to split across (default 3)
   * @param granularityBps  - Search step size in bps (default 1000 = 10%)
   */
  findSplitRoutes(
    tokenIn: string,
    tokenOut: string,
    inputAmount: bigint,
    maxSplits = 3,
    granularityBps = 1_000
  ): SplitRoute[] {
    // Gather all direct edges for this pair
    const directEdges = (this.adjacency.get(tokenIn) ?? []).filter(
      e => e.tokenOut === tokenOut
    )

    if (directEdges.length < 2) return []

    // Limit to top maxSplits pools by single-unit output
    const rankedEdges = directEdges
      .map(e => ({
        edge: e,
        sampleOut: this.computeAmountOut(e.pool, inputAmount / BigInt(directEdges.length), tokenIn),
      }))
      .sort((a, b) => (b.sampleOut > a.sampleOut ? 1 : -1))
      .slice(0, maxSplits)
      .map(r => r.edge)

    if (rankedEdges.length < 2) return []

    const steps = 10_000 / granularityBps // e.g. 10 steps for 1000bps
    let bestOutput = 0n
    let bestPortions: number[] = rankedEdges.map(() => 0)

    // Enumerate allocations for 2-way splits (extend to N-way if needed)
    // For 2 pools: try all (pct, 100-pct) combos
    // For 3 pools: try all (a, b, 100-a-b) combos
    this.enumerateAllocations(rankedEdges.length, steps, (fractions) => {
      let totalOut = 0n
      for (let i = 0; i < rankedEdges.length; i++) {
        const portion = (inputAmount * BigInt(fractions[i])) / 10_000n
        if (portion === 0n) continue
        totalOut += this.computeAmountOut(rankedEdges[i].pool, portion, tokenIn)
      }
      if (totalOut > bestOutput) {
        bestOutput = totalOut
        bestPortions = [...fractions]
      }
    })

    if (bestOutput === 0n) return []

    // Build the SplitRoute from the best allocation
    const portions: SplitRoutePortion[] = []
    let totalPriceImpact = 0
    let totalWeight = 0

    for (let i = 0; i < rankedEdges.length; i++) {
      const portionBps = bestPortions[i]
      if (portionBps === 0) continue

      const portionIn = (inputAmount * BigInt(portionBps)) / 10_000n
      const portionOut = this.computeAmountOut(rankedEdges[i].pool, portionIn, tokenIn)

      const step: RouteStep = {
        pool: rankedEdges[i].pool,
        tokenIn,
        tokenOut,
        amountIn: portionIn,
        amountOut: portionOut,
      }

      const route = this.buildRoute([step], portionIn)
      portions.push({ route, portionBps })

      totalPriceImpact += route.priceImpact * portionBps
      totalWeight += portionBps
    }

    const weightedPriceImpact = totalWeight > 0 ? totalPriceImpact / totalWeight : 0

    return [
      {
        routes: portions,
        totalOutput: bestOutput,
        priceImpact: weightedPriceImpact,
      },
    ]
  }

  /**
   * Recursively enumerate all ways to allocate `steps` ticks across `n` buckets
   * such that they sum to `steps`.  Calls `callback` for each valid allocation
   * (expressed as basis points, i.e. ticks * granularity).
   */
  private enumerateAllocations(
    n: number,
    steps: number,
    callback: (fractions: number[]) => void,
    depth = 0,
    remaining = steps,
    current: number[] = []
  ): void {
    if (depth === n - 1) {
      if (remaining > 0) {
        callback([...current, remaining * (10_000 / steps)])
      }
      return
    }

    for (let i = 0; i <= remaining; i++) {
      this.enumerateAllocations(
        n,
        steps,
        callback,
        depth + 1,
        remaining - i,
        [...current, i * (10_000 / steps)]
      )
    }
  }
}

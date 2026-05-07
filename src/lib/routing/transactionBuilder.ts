/**
 * Transaction builder for OmniWeave aggregated swaps.
 *
 * Produces Sui Programmable Transaction Blocks (PTBs) that:
 *  - For single routes: call the correct DEX adapter's swap entry in sequence
 *    for each hop, piping the output coin of each hop as the input to the next.
 *  - For split routes: split the input coin proportionally, send each portion
 *    through the appropriate pool, then merge the output coins and transfer to
 *    the recipient.
 *
 * Slippage is applied to the final minAmountOut check only — intermediate hops
 * are unconstrained so that on-chain price movements during the PTB do not
 * cause unnecessary reverts.
 *
 * NOTE on PTB coin threading:
 *   The Sui PTB model requires output coins from one Move call to be passed as
 *   inputs to the next.  Each adapter's buildSwapTransaction appends the swap
 *   move call to the shared Transaction.  In a complete SDK integration the
 *   caller would capture `txb.moveCall(...)` return values and thread them as
 *   `txb.object(result)` arguments.  The scaffolding below represents this
 *   pattern — replace the `/* swap result */` comments with real result
 *   references once each DEX adapter's exact return types are confirmed.
 */

import { Transaction } from '@mysten/sui/transactions'
import type { QuoteResult, SplitRoute, Route, RouteStep } from './types'
import { DEX_ADAPTERS } from './dexAdapters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * OmniWeave protocol objects needed when collecting fees or tracking volume.
 * Leave as empty strings to skip the protocol-level move call.
 */
export interface ProtocolObjects {
  /** Shared Config object ID (protocol fee settings) */
  configObjectId: string
  /** Shared Treasury object ID (fee destination) */
  treasuryObjectId: string
}

// ---------------------------------------------------------------------------
// Public builders
// ---------------------------------------------------------------------------

/**
 * Build a PTB that executes the recommended route from a QuoteResult.
 * Dispatches to buildSplitSwapTx or buildSingleSwapTx based on useSplit.
 *
 * @param quote          - The result of OmniWeaveAggregator.getQuote()
 * @param coinIn         - Object ID of the Coin<T> to be swapped
 * @param recipient      - Address that receives the output coin
 * @param slippageBps    - Maximum acceptable slippage in basis points (e.g. 50 = 0.5%)
 * @param protocol       - Protocol config/treasury object IDs (optional)
 * @returns A fully-constructed Transaction ready to sign and submit
 */
export function buildAggregatedSwapTx(
  quote: QuoteResult,
  coinIn: string,
  recipient: string,
  slippageBps: number,
  protocol: ProtocolObjects = { configObjectId: '', treasuryObjectId: '' }
): Transaction {
  if (quote.useSplit && quote.bestSplitRoute) {
    return buildSplitSwapTx(quote.bestSplitRoute, coinIn, recipient, slippageBps, protocol)
  }

  if (quote.bestRoute) {
    return buildSingleSwapTx(quote.bestRoute, coinIn, recipient, slippageBps, protocol)
  }

  throw new Error('[OmniWeave] buildAggregatedSwapTx: no valid route in QuoteResult')
}

/**
 * Build a PTB for a single-path (possibly multi-hop) route.
 *
 * For a 2-hop route A→B→C the PTB looks like:
 *   [0] split_coins(coinIn, [totalAmount])    → coin_a
 *   [1] swap_on_dex_1(coin_a)                → coin_b
 *   [2] swap_on_dex_2(coin_b)                → coin_c
 *   [3] transfer_objects([coin_c], recipient)
 *
 * Each DEX adapter appends its swap call to the shared txb.  The result
 * coin from each call is threaded as input to the next step.
 */
export function buildSingleSwapTx(
  route: Route,
  coinIn: string,
  recipient: string,
  slippageBps: number,
  protocol: ProtocolObjects = { configObjectId: '', treasuryObjectId: '' }
): Transaction {
  const txb = new Transaction()

  // Split exact amount from the input coin object
  const [exactCoin] = txb.splitCoins(txb.object(coinIn), [
    txb.pure.u64(route.inputAmount),
  ])

  // Walk through each hop and append swap calls.
  // `currentCoin` represents the coin flowing through the route.
  // After each hop it becomes the output coin of that hop's swap call.
  // In this scaffold we hold a reference to the last split/result coin.
  // A full implementation threads the actual moveCall result objects.
  let currentCoin = exactCoin

  for (let i = 0; i < route.path.length; i++) {
    const step = route.path[i]
    const adapter = getAdapter(step.pool.dexId)

    // Apply slippage only on the final hop to avoid unnecessary mid-route reverts
    const isLastHop = i === route.path.length - 1
    const minOut = isLastHop ? applySlippage(step.amountOut, slippageBps) : BigInt(0)

    // Append the DEX-specific swap call.
    // currentCoin is passed conceptually — real threading requires capturing
    // the moveCall result. See note at top of file.
    adapter.buildSwapTransaction(step.pool, step.amountIn, minOut, recipient, txb)

    // After the last hop, `currentCoin` still holds the split coin reference.
    // In a full integration you'd reassign `currentCoin` to the moveCall result.
    void currentCoin // suppress unused-variable lint on non-final hops
  }

  // Record volume with the protocol config if provided
  if (protocol.configObjectId && protocol.treasuryObjectId) {
    appendProtocolFeeCall(txb, protocol, route.outputAmount)
  }

  // Transfer the final output coin to the recipient.
  // In a full integration this would be the result coin from the last hop.
  txb.transferObjects([exactCoin], recipient)

  return txb
}

/**
 * Build a PTB for a split route.
 *
 * The PTB:
 *  1. Splits the input coin into N portions according to each route's inputAmount.
 *  2. Swaps each portion through its designated pool.
 *  3. Merges all output coins into the first.
 *  4. Transfers the merged coin to the recipient.
 *
 * @param splitRoute  - The SplitRoute to execute
 * @param coinIn      - Object ID of the input Coin<T>
 * @param recipient   - Recipient address for the output coin
 * @param slippageBps - Slippage tolerance in basis points
 * @param protocol    - Protocol config/treasury objects (optional)
 */
export function buildSplitSwapTx(
  splitRoute: SplitRoute,
  coinIn: string,
  recipient: string,
  slippageBps: number,
  protocol: ProtocolObjects = { configObjectId: '', treasuryObjectId: '' }
): Transaction {
  const txb = new Transaction()

  // 1. Collect per-portion input amounts (each route stores its own inputAmount)
  const portionAmounts = splitRoute.routes.map(({ route }) => route.inputAmount)

  // 2. Split the source coin into one piece per route portion
  const splitAmountArgs = portionAmounts.map(amt => txb.pure.u64(amt))
  const portionCoins = txb.splitCoins(txb.object(coinIn), splitAmountArgs)

  // 3. Append a swap call for each portion and collect coin references
  //    (In a full implementation each adapter call's result replaces the
  //    portionCoin reference so the actual swapped coin flows into mergeCoins.)
  const outputCoinRefs: ReturnType<typeof txb.splitCoins>[number][] = []

  for (let i = 0; i < splitRoute.routes.length; i++) {
    const { route } = splitRoute.routes[i]
    if (route.path.length === 0) continue

    const step: RouteStep = route.path[0] // split routes are single-hop
    const adapter = getAdapter(step.pool.dexId)

    const minOut = applySlippage(step.amountOut, slippageBps)

    adapter.buildSwapTransaction(step.pool, step.amountIn, minOut, recipient, txb)

    // Collect the portion coin reference; a real integration captures moveCall result
    const portionCoin = Array.isArray(portionCoins) ? portionCoins[i] : portionCoins
    outputCoinRefs.push(portionCoin)
  }

  if (outputCoinRefs.length === 0) {
    throw new Error('[OmniWeave] buildSplitSwapTx: no valid split portions')
  }

  // 4. Merge all portions into the first coin
  if (outputCoinRefs.length > 1) {
    txb.mergeCoins(outputCoinRefs[0], outputCoinRefs.slice(1))
  }

  if (protocol.configObjectId && protocol.treasuryObjectId) {
    appendProtocolFeeCall(txb, protocol, splitRoute.totalOutput)
  }

  txb.transferObjects([outputCoinRefs[0]], recipient)

  return txb
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Append protocol fee / volume tracking call (no-op placeholder) */
function appendProtocolFeeCall(
  txb: Transaction,
  protocol: ProtocolObjects,
  outputAmount: bigint
): void {
  // Placeholder: real implementation calls
  // omniweave::router::record_swap(config, treasury, outputAmount)
  void txb
  void protocol
  void outputAmount
}

/**
 * Apply slippage to an amount, returning the minimum acceptable output.
 *
 * @param amount      - Expected amount (base units)
 * @param slippageBps - Slippage in basis points (e.g. 50 = 0.5%)
 * @returns Minimum acceptable amount after slippage deduction
 */
export function applySlippage(amount: bigint, slippageBps: number): bigint {
  if (slippageBps <= 0) return amount
  const slippage = BigInt(Math.round(slippageBps))
  return (amount * (BigInt(10_000) - slippage)) / BigInt(10_000)
}

/**
 * Retrieve the DEX adapter for a given dexId string.
 * Throws if the dexId is not registered.
 */
function getAdapter(dexId: string) {
  const adapter = DEX_ADAPTERS.find(a => a.dexId === dexId)
  if (!adapter) {
    throw new Error(`[OmniWeave] No adapter registered for dexId: ${dexId}`)
  }
  return adapter
}

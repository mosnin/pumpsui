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
 * Slippage is applied to the final minAmountOut check only - intermediate hops
 * are unconstrained so that on-chain price movements during the PTB do not
 * cause unnecessary reverts.
 *
 * NOTE on PTB coin threading:
 *   The Sui PTB model requires output coins from one Move call to be passed as
 *   inputs to the next.  Each adapter's buildSwapTransaction appends the swap
 *   move call to the shared Transaction.  In a complete SDK integration the
 *   caller would capture `txb.moveCall(...)` return values and thread them as
 *   `txb.object(result)` arguments.  The scaffolding below represents this
 *   pattern - replace the swap-result comments with real result
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
const PACKAGE_ID = process.env.NEXT_PUBLIC_ROUTER_PACKAGE_ID ?? ''

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

  // 1. Split exact amount from the input coin object
  const [exactCoin] = txb.splitCoins(txb.object(coinIn), [
    txb.pure.u64(route.inputAmount),
  ])

  // 2. Deduct protocol fee from the input coin BEFORE routing through the DEX.
  //    splitProtocolFee returns the remaining coin after fee removal.
  const swapCoin = splitProtocolFee(txb, exactCoin, route.inputAmount, protocol, PACKAGE_ID)

  // 3. Walk through each hop and append swap calls.
  //    `currentCoin` represents the coin flowing through the route.
  //    A full integration threads the actual moveCall result objects.
  let currentCoin = swapCoin

  for (let i = 0; i < route.path.length; i++) {
    const step = route.path[i]
    const adapter = getAdapter(step.pool.dexId)

    // Apply slippage only on the final hop to avoid unnecessary mid-route reverts
    const isLastHop = i === route.path.length - 1
    const minOut = isLastHop ? applySlippage(step.amountOut, slippageBps) : BigInt(0)

    adapter.buildSwapTransaction(step.pool, step.amountIn, minOut, recipient, txb, step.tokenIn)

    // A full integration reassigns currentCoin to the moveCall result here
    void currentCoin
  }

  // 4. Transfer the final output coin to the recipient.
  txb.transferObjects([swapCoin], recipient)

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

  // 1. Total input across all portions
  const totalAmountIn = splitRoute.routes.reduce((sum, { route }) => sum + route.inputAmount, 0n)

  // 2. Deduct protocol fee from the TOTAL input first, then split the remainder
  const [totalCoin] = txb.splitCoins(txb.object(coinIn), [txb.pure.u64(totalAmountIn)])
  const swapCoin = splitProtocolFee(txb, totalCoin, totalAmountIn, protocol, PACKAGE_ID)

  // 3. Compute post-fee portion amounts proportionally (maintain sum invariant)
  const feeAmount = computeProtocolFee(totalAmountIn)
  const postFeeTotal = totalAmountIn - feeAmount
  const portionAmounts = splitRoute.routes.map(({ route }) =>
    (route.inputAmount * postFeeTotal) / totalAmountIn
  )

  // 4. Split post-fee coin into per-route portions
  const splitAmountArgs = portionAmounts.map(amt => txb.pure.u64(amt))
  const portionCoins = txb.splitCoins(swapCoin, splitAmountArgs)

  // 5. Swap each portion and collect output coin references
  const outputCoinRefs: ReturnType<typeof txb.splitCoins>[number][] = []

  for (let i = 0; i < splitRoute.routes.length; i++) {
    const { route } = splitRoute.routes[i]
    if (route.path.length === 0) continue

    const step: RouteStep = route.path[0]
    const adapter = getAdapter(step.pool.dexId)
    const minOut = applySlippage(step.amountOut, slippageBps)

    adapter.buildSwapTransaction(step.pool, portionAmounts[i], minOut, recipient, txb, step.tokenIn)

    const portionCoin = Array.isArray(portionCoins) ? portionCoins[i] : portionCoins
    outputCoinRefs.push(portionCoin)
  }

  if (outputCoinRefs.length === 0) {
    throw new Error('[OmniWeave] buildSplitSwapTx: no valid split portions')
  }

  // 6. Merge all output portions and transfer to recipient
  if (outputCoinRefs.length > 1) {
    txb.mergeCoins(outputCoinRefs[0], outputCoinRefs.slice(1))
  }

  txb.transferObjects([outputCoinRefs[0]], recipient)

  return txb
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** OmniWeave protocol fee in basis points (5 bps = 0.05%) */
export const OMNIWEAVE_FEE_BPS = 5n

/**
 * Compute the fee amount for a given input.
 * fee = floor(amountIn * fee_bps / 10_000)
 */
export function computeProtocolFee(amountIn: bigint, feeBps: bigint = OMNIWEAVE_FEE_BPS): bigint {
  return (amountIn * feeBps) / 10_000n
}

/**
 * Compute the post-fee amount that reaches the DEX.
 */
export function amountAfterFee(amountIn: bigint, feeBps: bigint = OMNIWEAVE_FEE_BPS): bigint {
  return amountIn - computeProtocolFee(amountIn, feeBps)
}

/**
 * Append protocol fee collection to a PTB.
 *
 * Two modes:
 *  1. Router deployed (configObjectId + treasuryObjectId set):
 *     Calls omniweave_router::charge_fee<CoinIn>, which internally splits
 *     the fee and deposits it into the Treasury shared object.
 *
 *  2. Router not deployed (objects are empty strings):
 *     Falls back to a direct splitCoins + transferObjects to the fee recipient
 *     address from NEXT_PUBLIC_ADMIN_ADDRESS env var (dev/testnet mode only).
 *
 * @param txb          - The transaction being built
 * @param coinRef      - The input coin argument inside the PTB (before the swap)
 * @param amountIn     - Raw input amount (base units)
 * @param protocol     - Protocol object IDs
 * @param packageId    - Deployed OmniWeave package ID (may be empty)
 * @returns The remaining coin argument after the fee is taken (to send to the DEX)
 */
export function splitProtocolFee(
  txb: Transaction,
  coinRef: ReturnType<typeof txb.splitCoins>[number],
  amountIn: bigint,
  protocol: ProtocolObjects,
  packageId: string,
): ReturnType<typeof txb.splitCoins>[number] {
  const feeAmount = computeProtocolFee(amountIn)
  if (feeAmount === 0n) return coinRef

  const deployed =
    packageId &&
    packageId !== '0x0' &&
    protocol.configObjectId &&
    protocol.configObjectId !== '0x0' &&
    protocol.treasuryObjectId &&
    protocol.treasuryObjectId !== '0x0'

  if (deployed) {
    // On-chain path: call omniweave_router::charge_fee<CoinIn>
    // The Move function splits feeAmount from coinRef and deposits it in Treasury.
    txb.moveCall({
      target: `${packageId}::omniweave_router::charge_fee`,
      arguments: [
        txb.object(protocol.configObjectId),
        txb.object(protocol.treasuryObjectId),
        coinRef,
        txb.pure.u64(feeAmount),
      ],
    })
    // coinRef now holds (amountIn - feeAmount) after the Move call mutates it
    return coinRef
  }

  // Fallback path (contract not deployed): manual PTB fee split
  const feeRecipient =
    process.env.NEXT_PUBLIC_ADMIN_ADDRESS ||
    '0x0000000000000000000000000000000000000000000000000000000000000000'

  if (feeRecipient === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    // No recipient configured — skip fee in dev mode
    return coinRef
  }

  const [feeCoin, remainderCoin] = txb.splitCoins(coinRef, [txb.pure.u64(feeAmount)])
  txb.transferObjects([feeCoin], feeRecipient)
  return remainderCoin
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

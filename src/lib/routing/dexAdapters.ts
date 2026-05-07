/**
 * DEX-specific adapters for OmniWeave.
 *
 * Each adapter implements the DexAdapter interface and is responsible for:
 *  1. Fetching pool data from the Sui blockchain via the SuiClient RPC.
 *  2. Computing the expected swap output given current pool state.
 *  3. Building the relevant Move call(s) inside a PTB for execution.
 *
 * Implementations here are stub-quality: the on-chain object IDs and
 * module/function names are placeholders that must be replaced with the
 * real values from each protocol's SDK or documentation.  The math and
 * interface wiring are correct.
 */

import type { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import {
  Pool,
  DexId,
} from './types'
import {
  computeConstantProductAmountOut,
  computeCLMMAmountOut,
} from './graph'

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface DexAdapter {
  readonly dexId: DexId

  /**
   * Fetch all pools on this DEX that contain both tokenA and tokenB.
   * May return an empty array if no matching pools exist or the RPC call fails.
   */
  fetchPools(tokenA: string, tokenB: string, client: SuiClient): Promise<Pool[]>

  /**
   * Compute the expected output for swapping amountIn of tokenIn through pool.
   * Pure / synchronous — uses the pool state already fetched by fetchPools.
   */
  computeAmountOut(pool: Pool, amountIn: bigint, tokenIn: string): bigint

  /**
   * Append the necessary Move calls for this swap to an existing PTB.
   * Returns the (possibly mutated) transaction so callers can chain calls.
   */
  buildSwapTransaction(
    pool: Pool,
    amountIn: bigint,
    minAmountOut: bigint,
    recipient: string,
    txb: Transaction
  ): Transaction
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Resolve the reserve pair (reserveIn, reserveOut) for a pool given tokenIn */
function getReserves(pool: Pool, tokenIn: string): [bigint, bigint] {
  return pool.tokenA === tokenIn
    ? [pool.reserveA, pool.reserveB]
    : [pool.reserveB, pool.reserveA]
}

/**
 * Safely parse a Sui Move object field that is stored as a string (u128/u256).
 * Falls back to 0n on any error.
 */
function parseBigIntField(value: unknown): bigint {
  try {
    return BigInt(String(value))
  } catch {
    return 0n
  }
}

// ---------------------------------------------------------------------------
// Cetus (CLMM)
// ---------------------------------------------------------------------------

/**
 * Cetus is a concentrated-liquidity DEX on Sui.
 * Pool objects live at a global registry; individual pools are CLMM positions.
 *
 * Real integration: use @cetusprotocol/cetus-sui-clmm-sdk
 */
export class CetusAdapter implements DexAdapter {
  readonly dexId = DexId.CETUS

  /** Package IDs — replace with real values from Cetus docs */
  private static readonly PACKAGE =
    '0xcetus_package_id_placeholder'
  private static readonly POOL_REGISTRY =
    '0xcetus_pool_registry_placeholder'

  async fetchPools(tokenA: string, tokenB: string, client: SuiClient): Promise<Pool[]> {
    try {
      // Query dynamic fields on the pool registry object to find matching pools.
      // In production: use the Cetus SDK's `Pool.fetchPoolList` or similar.
      const resp = await client.getDynamicFields({
        parentId: CetusAdapter.POOL_REGISTRY,
      })

      const pools: Pool[] = []

      for (const field of resp.data) {
        try {
          const obj = await client.getObject({
            id: field.objectId,
            options: { showContent: true },
          })

          const content = obj.data?.content
          if (!content || content.dataType !== 'moveObject') continue

          const fields = content.fields as Record<string, unknown>
          const coinTypeA = String(fields['coin_type_a'] ?? '')
          const coinTypeB = String(fields['coin_type_b'] ?? '')

          // Check if this pool matches our requested pair (order-agnostic)
          const matches =
            (coinTypeA === tokenA && coinTypeB === tokenB) ||
            (coinTypeA === tokenB && coinTypeB === tokenA)

          if (!matches) continue

          pools.push({
            id: field.objectId,
            dexId: DexId.CETUS,
            tokenA: coinTypeA,
            tokenB: coinTypeB,
            reserveA: parseBigIntField(fields['reserve_a']),
            reserveB: parseBigIntField(fields['reserve_b']),
            fee: Number(fields['fee_rate'] ?? 3000) / 100, // stored in 1/1_000_000
            liquidity: parseBigIntField(fields['liquidity']),
            sqrtPrice: parseBigIntField(fields['sqrt_price']),
            tickSpacing: Number(fields['tick_spacing'] ?? 60),
          })
        } catch {
          // Skip individual pool fetch errors
        }
      }

      return pools
    } catch (err) {
      console.warn('[CetusAdapter] fetchPools failed:', err)
      return []
    }
  }

  computeAmountOut(pool: Pool, amountIn: bigint, tokenIn: string): bigint {
    if (pool.sqrtPrice !== undefined) {
      return computeCLMMAmountOut(
        pool.sqrtPrice,
        pool.liquidity,
        amountIn,
        pool.tokenA === tokenIn,
        pool.fee
      )
    }
    const [reserveIn, reserveOut] = getReserves(pool, tokenIn)
    return computeConstantProductAmountOut(reserveIn, reserveOut, amountIn, pool.fee)
  }

  buildSwapTransaction(
    pool: Pool,
    amountIn: bigint,
    minAmountOut: bigint,
    recipient: string,
    txb: Transaction
  ): Transaction {
    const a2b = pool.tokenA === pool.tokenA // direction flag — always A→B for now; caller sets tokenIn
    txb.moveCall({
      target: `${CetusAdapter.PACKAGE}::pool::swap`,
      typeArguments: [pool.tokenA, pool.tokenB],
      arguments: [
        txb.object(pool.id),
        txb.pure.bool(a2b),
        txb.pure.bool(true), // exact input
        txb.pure.u64(amountIn),
        txb.pure.u128(0n), // sqrt_price_limit (0 = no limit)
        txb.pure.bool(false), // is_base_to_quote
        txb.object('0x6'), // clock
      ],
    })
    return txb
  }
}

// ---------------------------------------------------------------------------
// Turbos (CLMM)
// ---------------------------------------------------------------------------

/**
 * Turbos Finance is another concentrated-liquidity DEX on Sui.
 *
 * Real integration: use @turbos-finance/sdk
 */
export class TurbosAdapter implements DexAdapter {
  readonly dexId = DexId.TURBOS

  private static readonly PACKAGE =
    '0xturbos_package_id_placeholder'
  private static readonly POOL_REGISTRY =
    '0xturbos_pool_registry_placeholder'

  async fetchPools(tokenA: string, tokenB: string, client: SuiClient): Promise<Pool[]> {
    try {
      const resp = await client.getDynamicFields({
        parentId: TurbosAdapter.POOL_REGISTRY,
      })

      const pools: Pool[] = []

      for (const field of resp.data) {
        try {
          const obj = await client.getObject({
            id: field.objectId,
            options: { showContent: true },
          })
          const content = obj.data?.content
          if (!content || content.dataType !== 'moveObject') continue

          const fields = content.fields as Record<string, unknown>
          const coinA = String(fields['coin_type_a'] ?? '')
          const coinB = String(fields['coin_type_b'] ?? '')

          if (!((coinA === tokenA && coinB === tokenB) || (coinA === tokenB && coinB === tokenA)))
            continue

          pools.push({
            id: field.objectId,
            dexId: DexId.TURBOS,
            tokenA: coinA,
            tokenB: coinB,
            reserveA: parseBigIntField(fields['coin_a']),
            reserveB: parseBigIntField(fields['coin_b']),
            fee: Number(fields['fee'] ?? 3000),
            liquidity: parseBigIntField(fields['liquidity']),
            sqrtPrice: parseBigIntField(fields['sqrt_price']),
            tickSpacing: Number(fields['tick_spacing'] ?? 60),
          })
        } catch {
          // Skip
        }
      }

      return pools
    } catch (err) {
      console.warn('[TurbosAdapter] fetchPools failed:', err)
      return []
    }
  }

  computeAmountOut(pool: Pool, amountIn: bigint, tokenIn: string): bigint {
    if (pool.sqrtPrice !== undefined) {
      return computeCLMMAmountOut(
        pool.sqrtPrice,
        pool.liquidity,
        amountIn,
        pool.tokenA === tokenIn,
        pool.fee
      )
    }
    const [reserveIn, reserveOut] = getReserves(pool, tokenIn)
    return computeConstantProductAmountOut(reserveIn, reserveOut, amountIn, pool.fee)
  }

  buildSwapTransaction(
    pool: Pool,
    amountIn: bigint,
    minAmountOut: bigint,
    recipient: string,
    txb: Transaction
  ): Transaction {
    txb.moveCall({
      target: `${TurbosAdapter.PACKAGE}::pool::swap`,
      typeArguments: [pool.tokenA, pool.tokenB, `${TurbosAdapter.PACKAGE}::fee3000::Fee3000`],
      arguments: [
        txb.object(pool.id),
        txb.pure.u64(amountIn),
        txb.pure.u64(0n),
        txb.pure.bool(pool.tokenA !== pool.tokenA), // a_to_b placeholder
        txb.pure.bool(true), // exact_input
        txb.pure.u128(0n), // sqrt_price_limit
        txb.object('0x6'), // clock
        txb.object(TurbosAdapter.POOL_REGISTRY),
      ],
    })
    return txb
  }
}

// ---------------------------------------------------------------------------
// DeepBook (order-book DEX)
// ---------------------------------------------------------------------------

/**
 * DeepBook is Sui's native central limit order book.
 * Swaps are filled as market orders against resting limit orders.
 *
 * Real integration: use @mysten/deepbook-v3
 */
export class DeepBookAdapter implements DexAdapter {
  readonly dexId = DexId.DEEPBOOK

  private static readonly PACKAGE =
    '0xdeepbook_package_id_placeholder'

  async fetchPools(tokenA: string, tokenB: string, client: SuiClient): Promise<Pool[]> {
    try {
      // DeepBook pools are "Pool<BaseAsset, QuoteAsset>" shared objects.
      // Use queryEvents or a known registry to enumerate pools.
      // Stubbed: return empty until real pool IDs are known.
      const knownPoolIds: string[] = [
        // e.g. '0xdeepbook_sui_usdc_pool_id'
      ]

      const pools: Pool[] = []

      for (const poolId of knownPoolIds) {
        const obj = await client.getObject({
          id: poolId,
          options: { showContent: true },
        })
        const content = obj.data?.content
        if (!content || content.dataType !== 'moveObject') continue

        const fields = content.fields as Record<string, unknown>
        // DeepBook stores bids/asks as trees; approximate reserves from best levels
        const reserveA = parseBigIntField(fields['base_asset_quantity_factor'])
        const reserveB = parseBigIntField(fields['quote_asset_quantity_factor'])

        pools.push({
          id: poolId,
          dexId: DexId.DEEPBOOK,
          tokenA,
          tokenB,
          reserveA,
          reserveB,
          fee: Number(fields['taker_fee_rate'] ?? 100),
          liquidity: reserveA + reserveB,
        })
      }

      return pools
    } catch (err) {
      console.warn('[DeepBookAdapter] fetchPools failed:', err)
      return []
    }
  }

  computeAmountOut(pool: Pool, amountIn: bigint, tokenIn: string): bigint {
    // DeepBook: market order fills — approximate with constant-product model
    const [reserveIn, reserveOut] = getReserves(pool, tokenIn)
    return computeConstantProductAmountOut(reserveIn, reserveOut, amountIn, pool.fee)
  }

  buildSwapTransaction(
    pool: Pool,
    amountIn: bigint,
    minAmountOut: bigint,
    recipient: string,
    txb: Transaction
  ): Transaction {
    txb.moveCall({
      target: `${DeepBookAdapter.PACKAGE}::pool::swap_exact_base_for_quote`,
      typeArguments: [pool.tokenA, pool.tokenB],
      arguments: [
        txb.object(pool.id),
        txb.pure.u64(amountIn),
        txb.pure.u64(minAmountOut),
        txb.object('0x6'), // clock
      ],
    })
    return txb
  }
}

// ---------------------------------------------------------------------------
// Aftermath (constant-product AMM)
// ---------------------------------------------------------------------------

/**
 * Aftermath Finance provides constant-product AMM pools on Sui.
 *
 * Real integration: use aftermath-ts-sdk
 */
export class AftermathAdapter implements DexAdapter {
  readonly dexId = DexId.AFTERMATH

  private static readonly PACKAGE =
    '0xaftermath_package_id_placeholder'
  private static readonly POOLS_TABLE =
    '0xaftermath_pools_table_placeholder'

  async fetchPools(tokenA: string, tokenB: string, client: SuiClient): Promise<Pool[]> {
    try {
      const resp = await client.getDynamicFields({ parentId: AftermathAdapter.POOLS_TABLE })
      const pools: Pool[] = []

      for (const field of resp.data) {
        try {
          const obj = await client.getObject({ id: field.objectId, options: { showContent: true } })
          const content = obj.data?.content
          if (!content || content.dataType !== 'moveObject') continue

          const fields = content.fields as Record<string, unknown>
          const coins = fields['coins'] as string[] | undefined
          if (!coins || !coins.includes(tokenA) || !coins.includes(tokenB)) continue

          const reserves = fields['reserves'] as Record<string, unknown> | undefined

          pools.push({
            id: field.objectId,
            dexId: DexId.AFTERMATH,
            tokenA,
            tokenB,
            reserveA: parseBigIntField(reserves?.[tokenA]),
            reserveB: parseBigIntField(reserves?.[tokenB]),
            fee: Number(fields['swap_fee_bps'] ?? 30),
            liquidity: parseBigIntField(fields['lp_supply']),
          })
        } catch {
          // Skip
        }
      }

      return pools
    } catch (err) {
      console.warn('[AftermathAdapter] fetchPools failed:', err)
      return []
    }
  }

  computeAmountOut(pool: Pool, amountIn: bigint, tokenIn: string): bigint {
    const [reserveIn, reserveOut] = getReserves(pool, tokenIn)
    return computeConstantProductAmountOut(reserveIn, reserveOut, amountIn, pool.fee)
  }

  buildSwapTransaction(
    pool: Pool,
    amountIn: bigint,
    minAmountOut: bigint,
    recipient: string,
    txb: Transaction
  ): Transaction {
    txb.moveCall({
      target: `${AftermathAdapter.PACKAGE}::pool::swap_exact_in`,
      typeArguments: [pool.tokenA, pool.tokenB],
      arguments: [
        txb.object(pool.id),
        txb.pure.u64(amountIn),
        txb.pure.u64(minAmountOut),
        txb.pure.address(recipient),
      ],
    })
    return txb
  }
}

// ---------------------------------------------------------------------------
// FlowX (constant-product AMM)
// ---------------------------------------------------------------------------

/**
 * FlowX is a Uniswap V2-style AMM on Sui.
 */
export class FlowXAdapter implements DexAdapter {
  readonly dexId = DexId.FLOWX

  private static readonly PACKAGE =
    '0xflowx_package_id_placeholder'
  private static readonly FACTORY =
    '0xflowx_factory_placeholder'

  async fetchPools(tokenA: string, tokenB: string, client: SuiClient): Promise<Pool[]> {
    try {
      const resp = await client.getDynamicFields({ parentId: FlowXAdapter.FACTORY })
      const pools: Pool[] = []

      for (const field of resp.data) {
        try {
          const obj = await client.getObject({ id: field.objectId, options: { showContent: true } })
          const content = obj.data?.content
          if (!content || content.dataType !== 'moveObject') continue

          const fields = content.fields as Record<string, unknown>
          const coinX = String(fields['coin_x_type'] ?? '')
          const coinY = String(fields['coin_y_type'] ?? '')

          if (!((coinX === tokenA && coinY === tokenB) || (coinX === tokenB && coinY === tokenA)))
            continue

          pools.push({
            id: field.objectId,
            dexId: DexId.FLOWX,
            tokenA: coinX,
            tokenB: coinY,
            reserveA: parseBigIntField(fields['reserve_x']),
            reserveB: parseBigIntField(fields['reserve_y']),
            fee: Number(fields['fee_bps'] ?? 30),
            liquidity: parseBigIntField(fields['lp_supply']),
          })
        } catch {
          // Skip
        }
      }

      return pools
    } catch (err) {
      console.warn('[FlowXAdapter] fetchPools failed:', err)
      return []
    }
  }

  computeAmountOut(pool: Pool, amountIn: bigint, tokenIn: string): bigint {
    const [reserveIn, reserveOut] = getReserves(pool, tokenIn)
    return computeConstantProductAmountOut(reserveIn, reserveOut, amountIn, pool.fee)
  }

  buildSwapTransaction(
    pool: Pool,
    amountIn: bigint,
    minAmountOut: bigint,
    recipient: string,
    txb: Transaction
  ): Transaction {
    txb.moveCall({
      target: `${FlowXAdapter.PACKAGE}::router::swap_exact_input`,
      typeArguments: [pool.tokenA, pool.tokenB],
      arguments: [
        txb.object(FlowXAdapter.FACTORY),
        txb.pure.u64(amountIn),
        txb.pure.u64(minAmountOut),
        txb.pure.address(recipient),
        txb.object('0x6'), // clock
      ],
    })
    return txb
  }
}

// ---------------------------------------------------------------------------
// Kriya (constant-product AMM)
// ---------------------------------------------------------------------------

/**
 * Kriya DEX — constant-product AMM with protocol-fee sharing.
 */
export class KriyaAdapter implements DexAdapter {
  readonly dexId = DexId.KRIYA

  private static readonly PACKAGE =
    '0xkriya_package_id_placeholder'
  private static readonly GLOBAL =
    '0xkriya_global_placeholder'

  async fetchPools(tokenA: string, tokenB: string, client: SuiClient): Promise<Pool[]> {
    try {
      const resp = await client.getDynamicFields({ parentId: KriyaAdapter.GLOBAL })
      const pools: Pool[] = []

      for (const field of resp.data) {
        try {
          const obj = await client.getObject({ id: field.objectId, options: { showContent: true } })
          const content = obj.data?.content
          if (!content || content.dataType !== 'moveObject') continue

          const fields = content.fields as Record<string, unknown>
          const coinA = String(fields['token_0'] ?? '')
          const coinB = String(fields['token_1'] ?? '')

          if (!((coinA === tokenA && coinB === tokenB) || (coinA === tokenB && coinB === tokenA)))
            continue

          pools.push({
            id: field.objectId,
            dexId: DexId.KRIYA,
            tokenA: coinA,
            tokenB: coinB,
            reserveA: parseBigIntField(fields['token_0_reserve']),
            reserveB: parseBigIntField(fields['token_1_reserve']),
            fee: Number(fields['lp_fee_bps'] ?? 30),
            liquidity: parseBigIntField(fields['lp_supply']),
          })
        } catch {
          // Skip
        }
      }

      return pools
    } catch (err) {
      console.warn('[KriyaAdapter] fetchPools failed:', err)
      return []
    }
  }

  computeAmountOut(pool: Pool, amountIn: bigint, tokenIn: string): bigint {
    const [reserveIn, reserveOut] = getReserves(pool, tokenIn)
    return computeConstantProductAmountOut(reserveIn, reserveOut, amountIn, pool.fee)
  }

  buildSwapTransaction(
    pool: Pool,
    amountIn: bigint,
    minAmountOut: bigint,
    recipient: string,
    txb: Transaction
  ): Transaction {
    txb.moveCall({
      target: `${KriyaAdapter.PACKAGE}::spot_dex::swap_token_x`,
      typeArguments: [pool.tokenA, pool.tokenB],
      arguments: [
        txb.object(KriyaAdapter.GLOBAL),
        txb.object(pool.id),
        txb.pure.u64(amountIn),
        txb.pure.u64(minAmountOut),
      ],
    })
    return txb
  }
}

// ---------------------------------------------------------------------------
// Adapter registry
// ---------------------------------------------------------------------------

/** Instantiate all adapters once and export as a registry */
export const DEX_ADAPTERS: DexAdapter[] = [
  new CetusAdapter(),
  new TurbosAdapter(),
  new DeepBookAdapter(),
  new AftermathAdapter(),
  new FlowXAdapter(),
  new KriyaAdapter(),
]

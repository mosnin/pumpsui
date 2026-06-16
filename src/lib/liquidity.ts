import { Transaction } from '@mysten/sui/transactions'

// Cetus CLMM add liquidity params
export interface AddLiquidityParams {
  poolId: string
  token0: string
  token1: string
  amount0: bigint
  amount1: bigint
  tickLower: number
  tickUpper: number
  slippageBps: number
}

export interface LPPosition {
  positionId: string
  poolId: string
  dex: string
  token0: string
  token1: string
  amount0: number
  amount1: number
  valueUsd: number
  feesEarned0: number
  feesEarned1: number
  feesEarnedUsd: number
  apr: number
  inRange: boolean
  priceRangeLow: number
  priceRangeHigh: number
  currentPrice: number
}

// Price range presets for CLMM
export const PRICE_RANGE_PRESETS = [
  { label: 'Full Range', tickLower: -887272, tickUpper: 887272, description: 'Maximum range, like a v2 position' },
  { label: '±5%', multiplier: 0.05, description: 'Concentrated, higher fees, higher IL risk' },
  { label: '±10%', multiplier: 0.10, description: 'Balanced concentration' },
  { label: '±20%', multiplier: 0.20, description: 'Wide range, lower IL risk' },
] as const

export function buildAddLiquidityTx(params: AddLiquidityParams): Transaction {
  const txb = new Transaction()
  const CETUS_PACKAGE = process.env.NEXT_PUBLIC_CETUS_PACKAGE_ID ?? '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55'

  txb.moveCall({
    target: `${CETUS_PACKAGE}::pool::add_liquidity_fix_coin`,
    arguments: [
      txb.object(params.poolId),
      txb.pure.u64(params.amount0),
      txb.pure.u64(params.amount1),
      txb.pure.bool(true),
      txb.object('0x6'),
    ],
  })
  return txb
}

export function buildRemoveLiquidityTx(positionId: string, liquidityAmount: bigint): Transaction {
  const txb = new Transaction()
  const CETUS_PACKAGE = process.env.NEXT_PUBLIC_CETUS_PACKAGE_ID ?? '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55'
  txb.moveCall({
    target: `${CETUS_PACKAGE}::pool::remove_liquidity`,
    arguments: [
      txb.object(positionId),
      txb.pure.u128(liquidityAmount),
      txb.object('0x6'),
    ],
  })
  return txb
}

export function buildCollectFeesTx(positionId: string): Transaction {
  const txb = new Transaction()
  const CETUS_PACKAGE = process.env.NEXT_PUBLIC_CETUS_PACKAGE_ID ?? '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55'
  txb.moveCall({
    target: `${CETUS_PACKAGE}::pool::collect_fee`,
    arguments: [
      txb.object(positionId),
    ],
  })
  return txb
}

export function generateDemoPositions(): LPPosition[] {
  return [
    {
      positionId: '0xpos1aabbccdd',
      poolId: '0xpool1aabbccdd',
      dex: 'Cetus',
      token0: 'SUI',
      token1: 'USDC',
      amount0: 1245.5,
      amount1: 1498.2,
      valueUsd: 2996.4,
      feesEarned0: 2.34,
      feesEarned1: 2.81,
      feesEarnedUsd: 5.62,
      apr: 23.4,
      inRange: true,
      priceRangeLow: 1.08,
      priceRangeHigh: 1.42,
      currentPrice: 1.20,
    },
    {
      positionId: '0xpos2eeff0011',
      poolId: '0xpool2eeff0011',
      dex: 'Turbos',
      token0: 'SUI',
      token1: 'USDT',
      amount0: 800.0,
      amount1: 965.6,
      valueUsd: 1931.2,
      feesEarned0: 0.91,
      feesEarned1: 1.10,
      feesEarnedUsd: 2.20,
      apr: 31.7,
      inRange: false,
      priceRangeLow: 1.25,
      priceRangeHigh: 1.45,
      currentPrice: 1.21,
    },
    {
      positionId: '0xpos3223344',
      poolId: '0xpool3223344',
      dex: 'Cetus',
      token0: 'WETH',
      token1: 'USDC',
      amount0: 0.45,
      amount1: 1237.5,
      valueUsd: 2475.0,
      feesEarned0: 0.0,
      feesEarned1: 0.0,
      feesEarnedUsd: 0.0,
      apr: 19.4,
      inRange: true,
      priceRangeLow: 2400.0,
      priceRangeHigh: 3200.0,
      currentPrice: 2750.0,
    },
  ]
}

import { Transaction } from '@mysten/sui/transactions'

export const TWAP_PACKAGE_ID = process.env.NEXT_PUBLIC_TWAP_PACKAGE_ID ?? ''

export const TWAP_PRESETS = [
  { label: '5 chunks · 5 min apart', chunks: 5, intervalMs: 5 * 60 * 1000 },
  { label: '10 chunks · 1 hr apart', chunks: 10, intervalMs: 60 * 60 * 1000 },
  { label: '24 chunks · 1 hr apart (1 day)', chunks: 24, intervalMs: 60 * 60 * 1000 },
  { label: '7 chunks · 1 day apart', chunks: 7, intervalMs: 24 * 60 * 60 * 1000 },
] as const

export type TWAPPreset = (typeof TWAP_PRESETS)[number]

// ─── TWAP order status ────────────────────────────────────────────────────────

export const TWAP_STATUS = {
  ACTIVE: 0,
  COMPLETED: 1,
  CANCELLED: 2,
} as const

export type TWAPStatus = (typeof TWAP_STATUS)[keyof typeof TWAP_STATUS]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TWAPOrder {
  id: string
  owner: string
  tokenIn: string
  tokenOut: string
  tokenInSymbol: string
  tokenOutSymbol: string
  totalAmount: bigint
  chunkAmount: bigint
  numChunks: number
  chunksExecuted: number
  intervalMs: number
  lastExecutionMs: number
  minPrice: bigint
  status: TWAPStatus
}

// ─── Transaction builders ─────────────────────────────────────────────────────

export function buildCreateTWAPTx(
  coinId: string,
  amountBaseUnits: bigint,
  numChunks: number,
  intervalMs: number,
  minPrice: bigint = 0n,
): Transaction {
  const txb = new Transaction()
  const [splitCoin] = txb.splitCoins(txb.object(coinId), [txb.pure.u64(amountBaseUnits)])
  txb.moveCall({
    target: `${TWAP_PACKAGE_ID}::omniweave_twap::create_order`,
    typeArguments: ['0x2::sui::SUI'],
    arguments: [
      splitCoin,
      txb.pure.u64(numChunks),
      txb.pure.u64(intervalMs),
      txb.pure.u64(minPrice),
      txb.object('0x6'), // Clock
    ],
  })
  return txb
}

export function buildCancelTWAPTx(orderId: string): Transaction {
  const txb = new Transaction()
  txb.moveCall({
    target: `${TWAP_PACKAGE_ID}::omniweave_twap::cancel_order`,
    typeArguments: ['0x2::sui::SUI'],
    arguments: [txb.object(orderId)],
  })
  return txb
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/** Format progress for display, e.g. "3/10 chunks" */
export function formatTWAPProgress(chunksExecuted: number, numChunks: number): string {
  return `${chunksExecuted}/${numChunks} chunks`
}

/** Estimate total duration of a TWAP as a human-readable string */
export function estimateTotalDuration(numChunks: number, intervalMs: number): string {
  const totalMs = numChunks * intervalMs
  const hours = totalMs / (1000 * 60 * 60)
  if (hours < 1) return `${Math.round(totalMs / 60000)} minutes`
  if (hours < 24) return `${Math.round(hours)} hours`
  return `${Math.round(hours / 24)} days`
}

/** Format a millisecond duration as "2d 4h", "3h 30m", "45m", "< 1m", or "Ready" */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Ready'
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  if (minutes > 0) return `${minutes}m`
  return '< 1m'
}

/** Milliseconds until next execution window opens (0 if eligible now) */
export function msToNextExecution(lastExecutionMs: number, intervalMs: number): number {
  return Math.max(0, lastExecutionMs + intervalMs - Date.now())
}

/** Build a list of ISO timestamp strings for each scheduled chunk execution */
export function buildExecutionTimeline(
  lastExecutionMs: number,
  intervalMs: number,
  numChunks: number,
  chunksExecuted: number,
): Date[] {
  const dates: Date[] = []
  for (let i = chunksExecuted; i < numChunks; i++) {
    dates.push(new Date(lastExecutionMs + (i - chunksExecuted + 1) * intervalMs))
  }
  return dates
}

/** Format a token amount from base units to display string */
export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  fractionDigits = 4,
): string {
  const divisor = 10n ** BigInt(decimals)
  const whole = amount / divisor
  const frac = amount % divisor
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, fractionDigits)
  const trimmed = fracStr.replace(/0+$/, '')
  return trimmed ? `${whole}.${trimmed}` : `${whole}`
}

// ─── Demo data ────────────────────────────────────────────────────────────────

export function generateDemoTWAPOrders(): TWAPOrder[] {
  const now = Date.now()
  return [
    {
      id: '0x' + 'aa'.repeat(32),
      owner: '0x' + '00'.repeat(32),
      tokenIn: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
      tokenOut: '0x2::sui::SUI',
      tokenInSymbol: 'USDC',
      tokenOutSymbol: 'SUI',
      totalAmount: 1_000_000_000n, // 1000 USDC (6 dec)
      chunkAmount: 100_000_000n,   // 100 USDC per chunk
      numChunks: 10,
      chunksExecuted: 3,
      intervalMs: 60 * 60 * 1000, // 1 hour
      lastExecutionMs: now - 20 * 60 * 1000, // 20 min ago
      minPrice: 0n,
      status: TWAP_STATUS.ACTIVE,
    },
    {
      id: '0x' + 'bb'.repeat(32),
      owner: '0x' + '00'.repeat(32),
      tokenIn: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
      tokenOut: '0x2::sui::SUI',
      tokenInSymbol: 'USDC',
      tokenOutSymbol: 'SUI',
      totalAmount: 168_000_000n, // 168 USDC
      chunkAmount: 24_000_000n,
      numChunks: 7,
      chunksExecuted: 7,
      intervalMs: 24 * 60 * 60 * 1000,
      lastExecutionMs: now - 2 * 24 * 60 * 60 * 1000,
      minPrice: 0n,
      status: TWAP_STATUS.COMPLETED,
    },
  ]
}

import { Transaction } from '@mysten/sui/transactions'

// ─── Constants ────────────────────────────────────────────────────────────────

/// OmniWeave DCA package ID (placeholder — update after deployment)
export const DCA_PACKAGE_ID =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

/// Shared Treasury object ID (matches omniweave_fees::Treasury)
export const TREASURY_OBJECT_ID =
  '0x0000000000000000000000000000000000000000000000000000000000000001'

/// Sui Clock object ID (always the same on-chain)
export const SUI_CLOCK_OBJECT_ID = '0x6'

// ─── Interval presets ─────────────────────────────────────────────────────────

export const DCA_INTERVALS = [
  { label: 'Every hour',  ms: 3_600_000 },
  { label: 'Every day',   ms: 86_400_000 },
  { label: 'Every week',  ms: 604_800_000 },
  { label: 'Every month', ms: 2_592_000_000 },
] as const

export type DCAInterval = (typeof DCA_INTERVALS)[number]

// ─── Position status ──────────────────────────────────────────────────────────

export const DCA_STATUS = {
  ACTIVE: 0,
  PAUSED: 1,
  COMPLETED: 2,
} as const

export type DCAStatus = (typeof DCA_STATUS)[keyof typeof DCA_STATUS]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DCAPosition {
  id: string
  owner: string
  tokenIn: string
  tokenOut: string
  tokenInSymbol: string
  tokenOutSymbol: string
  amountPerCycle: bigint
  intervalMs: bigint
  totalCycles: bigint
  executedCycles: bigint
  lastExecutedMs: bigint
  inputBalance: bigint
  outputBalance: bigint
  status: DCAStatus
}

export interface CreateDCAParams {
  tokenIn: string        // coin type string e.g. "0x2::sui::SUI"
  tokenOut: string       // coin type string
  amountPerCycle: bigint // in base units
  intervalMs: bigint     // milliseconds between executions
  totalCycles: bigint    // total number of executions
  coinObjectId: string   // object ID of coin to fund the position
  clockObjectId?: string // defaults to SUI_CLOCK_OBJECT_ID
}

// ─── Transaction builders ─────────────────────────────────────────────────────

/**
 * Build a PTB that creates a new DCA position.
 * The coin must have a value >= amountPerCycle.
 */
export function buildCreateDCATx(params: CreateDCAParams): Transaction {
  const {
    tokenIn,
    tokenOut,
    amountPerCycle,
    intervalMs,
    totalCycles,
    coinObjectId,
    clockObjectId = SUI_CLOCK_OBJECT_ID,
  } = params

  const tx = new Transaction()

  tx.moveCall({
    target: `${DCA_PACKAGE_ID}::omniweave_dca::create_position`,
    typeArguments: [tokenIn, tokenOut],
    arguments: [
      tx.pure.u64(amountPerCycle),
      tx.pure.u64(intervalMs),
      tx.pure.u64(totalCycles),
      tx.object(coinObjectId),
      tx.object(clockObjectId),
    ],
  })

  return tx
}

/**
 * Build a PTB that pauses an active DCA position.
 * Only the position owner can call this.
 */
export function buildPauseDCATx(
  positionId: string,
  tokenIn: string,
  tokenOut: string,
): Transaction {
  const tx = new Transaction()

  tx.moveCall({
    target: `${DCA_PACKAGE_ID}::omniweave_dca::pause`,
    typeArguments: [tokenIn, tokenOut],
    arguments: [tx.object(positionId)],
  })

  return tx
}

/**
 * Build a PTB that resumes a paused DCA position.
 * Only the position owner can call this.
 */
export function buildResumeDCATx(
  positionId: string,
  tokenIn: string,
  tokenOut: string,
): Transaction {
  const tx = new Transaction()

  tx.moveCall({
    target: `${DCA_PACKAGE_ID}::omniweave_dca::resume`,
    typeArguments: [tokenIn, tokenOut],
    arguments: [tx.object(positionId)],
  })

  return tx
}

/**
 * Build a PTB that cancels a DCA position and returns all remaining funds.
 * The position object is consumed (deleted) by this call.
 */
export function buildCancelDCATx(
  positionId: string,
  tokenIn: string,
  tokenOut: string,
): Transaction {
  const tx = new Transaction()

  tx.moveCall({
    target: `${DCA_PACKAGE_ID}::omniweave_dca::cancel_and_withdraw`,
    typeArguments: [tokenIn, tokenOut],
    arguments: [tx.object(positionId)],
  })

  return tx
}

/**
 * Build a PTB that tops up an existing DCA position with more input tokens.
 * Only the position owner can call this.
 */
export function buildTopUpDCATx(
  positionId: string,
  coinObjectId: string,
  tokenIn: string,
  tokenOut: string,
): Transaction {
  const tx = new Transaction()

  tx.moveCall({
    target: `${DCA_PACKAGE_ID}::omniweave_dca::top_up`,
    typeArguments: [tokenIn, tokenOut],
    arguments: [
      tx.object(positionId),
      tx.object(coinObjectId),
    ],
  })

  return tx
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

/**
 * Returns milliseconds until the next execution window opens.
 * Returns 0 if execution is already eligible.
 */
export function msToNextExecution(
  lastExecutedMs: number,
  intervalMs: number,
): number {
  const nextExecMs = lastExecutedMs + intervalMs
  const now = Date.now()
  return Math.max(0, nextExecMs - now)
}

/**
 * Format a millisecond duration into a human-readable countdown string.
 * Examples: "2d 14h 30m", "4h 12m", "45m", "< 1m"
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Ready'

  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  if (minutes > 0) return `${minutes}m`
  return '< 1m'
}

/**
 * Returns a short human-readable label for an interval in ms.
 */
export function intervalLabel(ms: number): string {
  const match = DCA_INTERVALS.find((i) => i.ms === ms)
  if (match) return match.label

  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)

  if (days > 0) return `Every ${days}d`
  if (hours > 0) return `Every ${hours}h`
  const minutes = Math.floor(totalSeconds / 60)
  return `Every ${minutes}m`
}

/**
 * Format a bigint base-unit amount to a human display string.
 */
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

/**
 * Compute the total cost of a DCA plan in display units.
 * Returns the formatted string and raw bigint.
 */
export function computeTotalCost(
  amountPerCycle: bigint,
  totalCycles: bigint,
): bigint {
  return amountPerCycle * totalCycles
}

// ─── Demo data helpers ────────────────────────────────────────────────────────

/**
 * Generate realistic demo DCA positions for display when wallet is not connected.
 */
export function generateDemoPositions(): DCAPosition[] {
  const now = BigInt(Date.now())
  return [
    {
      id: '0x' + 'aa'.repeat(32),
      owner: '0x' + '00'.repeat(32),
      tokenIn: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
      tokenOut: '0x2::sui::SUI',
      tokenInSymbol: 'USDC',
      tokenOutSymbol: 'SUI',
      amountPerCycle: 50_000_000n, // 50 USDC (6 decimals)
      intervalMs: 604_800_000n,    // weekly
      totalCycles: 10n,
      executedCycles: 3n,
      lastExecutedMs: now - 200_000_000n,
      inputBalance: 350_000_000n,  // 350 USDC remaining
      outputBalance: 120_000_000_000n, // ~120 SUI received
      status: DCA_STATUS.ACTIVE,
    },
    {
      id: '0x' + 'bb'.repeat(32),
      owner: '0x' + '00'.repeat(32),
      tokenIn: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
      tokenOut: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
      tokenInSymbol: 'USDC',
      tokenOutSymbol: 'WETH',
      amountPerCycle: 100_000_000n, // 100 USDC
      intervalMs: 86_400_000n,      // daily
      totalCycles: 30n,
      executedCycles: 30n,
      lastExecutedMs: now - 50_000_000n,
      inputBalance: 0n,
      outputBalance: 60_000_000n,   // ~0.6 WETH (8 decimals)
      status: DCA_STATUS.COMPLETED,
    },
    {
      id: '0x' + 'cc'.repeat(32),
      owner: '0x' + '00'.repeat(32),
      tokenIn: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
      tokenOut: '0x2::sui::SUI',
      tokenInSymbol: 'USDC',
      tokenOutSymbol: 'SUI',
      amountPerCycle: 25_000_000n, // 25 USDC
      intervalMs: 3_600_000n,      // hourly
      totalCycles: 24n,
      executedCycles: 8n,
      lastExecutedMs: now - 7_200_000n,
      inputBalance: 400_000_000n,
      outputBalance: 80_000_000_000n,
      status: DCA_STATUS.PAUSED,
    },
  ]
}

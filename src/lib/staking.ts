import { Transaction } from '@mysten/sui/transactions'

// ─── Environment config ───────────────────────────────────────────────────────

export const STAKING_PACKAGE_ID = process.env.NEXT_PUBLIC_STAKING_PACKAGE_ID ?? ''
export const STAKING_POOL_ID    = process.env.NEXT_PUBLIC_STAKING_POOL_ID    ?? ''

// ─── Lock-period definitions ──────────────────────────────────────────────────

export const LOCK_PERIODS = [
  { label: 'No lock',   ms: 0,              multiplier: '1×',   bonus: '0%'    },
  { label: '3 months',  ms: 7_776_000_000,  multiplier: '1.5×', bonus: '+50%'  },
  { label: '6 months',  ms: 15_552_000_000, multiplier: '2×',   bonus: '+100%' },
  { label: '12 months', ms: 31_104_000_000, multiplier: '3×',   bonus: '+200%' },
] as const

export type LockPeriod = (typeof LOCK_PERIODS)[number]

// ─── Tier definitions ─────────────────────────────────────────────────────────

export const STAKING_TIERS = [
  { name: 'Bronze',  minOmni: 0,       feeDiscount: 0,  color: '#CD7F32' },
  { name: 'Silver',  minOmni: 1_000,   feeDiscount: 10, color: '#C0C0C0' },
  { name: 'Gold',    minOmni: 10_000,  feeDiscount: 20, color: '#FFD700' },
  { name: 'Diamond', minOmni: 100_000, feeDiscount: 25, color: '#B9F2FF' },
] as const

export type StakingTier = (typeof STAKING_TIERS)[number]

// ─── Transaction builders ─────────────────────────────────────────────────────

/**
 * Build a PTB that stakes `amountBaseUnits` of OMNI from the coin at `coinId`
 * into the staking pool, with the given `lockPeriodMs`.
 */
export function buildStakeTx(
  poolId: string,
  coinId: string,
  amountBaseUnits: bigint,
  lockPeriodMs: number,
): Transaction {
  const txb = new Transaction()
  const [stakeCoin] = txb.splitCoins(txb.object(coinId), [txb.pure.u64(amountBaseUnits)])
  txb.moveCall({
    target: `${STAKING_PACKAGE_ID}::omniweave_staking::stake`,
    arguments: [
      txb.object(poolId),
      stakeCoin,
      txb.pure.u64(lockPeriodMs),
      txb.object('0x6'), // Clock
    ],
  })
  return txb
}

/**
 * Build a PTB that unstakes and returns OMNI from an existing `StakePosition`.
 */
export function buildUnstakeTx(poolId: string, positionId: string): Transaction {
  const txb = new Transaction()
  txb.moveCall({
    target: `${STAKING_PACKAGE_ID}::omniweave_staking::unstake`,
    arguments: [
      txb.object(poolId),
      txb.object(positionId),
      txb.object('0x6'), // Clock
    ],
  })
  return txb
}

/**
 * Build a PTB that creates a new governance proposal.
 * Requires a `StakePosition` with sufficient voting power (≥ 10 000 OMNI equiv.).
 */
export function buildCreateProposalTx(
  title: string,
  description: string,
  actionType: number,
  stakePositionId: string,
): Transaction {
  const txb = new Transaction()
  txb.moveCall({
    target: `${STAKING_PACKAGE_ID}::omniweave_governance::create_proposal`,
    arguments: [
      txb.pure.string(title),
      txb.pure.string(description),
      txb.pure.u8(actionType),
      txb.pure.vector('u8', []),
      txb.object(stakePositionId),
      txb.object('0x6'), // Clock
    ],
  })
  return txb
}

/**
 * Build a PTB that casts a vote on a governance proposal.
 * `support = true` → For, `false` → Against.
 */
export function buildVoteTx(
  proposalId: string,
  stakePositionId: string,
  support: boolean,
): Transaction {
  const txb = new Transaction()
  txb.moveCall({
    target: `${STAKING_PACKAGE_ID}::omniweave_governance::vote`,
    arguments: [
      txb.object(proposalId),
      txb.object(stakePositionId),
      txb.pure.bool(support),
      txb.object('0x6'), // Clock
    ],
  })
  return txb
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

/**
 * Convert OMNI base-units (9 decimals) to a human-readable string.
 * e.g. 1_000_000_000_000n → "1,000.00"
 */
export function formatOmni(baseUnits: bigint | number): string {
  const n = typeof baseUnits === 'bigint' ? Number(baseUnits) : baseUnits
  return (n / 1e9).toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/**
 * Return the tier a staker belongs to given their staked balance in base-units.
 */
export function getTierFromStake(stakedBaseUnits: bigint): StakingTier {
  const omni = Number(stakedBaseUnits) / 1e9
  const tier = [...STAKING_TIERS].reverse().find((t) => omni >= t.minOmni)
  return tier ?? STAKING_TIERS[0]
}

/**
 * Compute voting power from staked base-units and a lock multiplier in bps.
 * e.g. 10 000 OMNI at 2× lock = 20 000 voting power
 */
export function computeVotingPower(stakedBaseUnits: bigint, lockMultiplierBps: number): bigint {
  return (stakedBaseUnits * BigInt(lockMultiplierBps)) / 10_000n
}

/**
 * Format a future ms timestamp as a short date string for display.
 * Returns "No lock" when `ms` is 0.
 */
export function formatUnlockDate(lockedUntilMs: number): string {
  if (lockedUntilMs === 0) return 'No lock'
  return new Date(lockedUntilMs).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Convert a lock-period ms value to the bps multiplier used in voting-power calcs.
 */
export function lockMsToMultiplierBps(lockPeriodMs: number): number {
  if (lockPeriodMs === 0)                     return 10_000
  if (lockPeriodMs <= 7_776_000_000)          return 15_000
  if (lockPeriodMs <= 15_552_000_000)         return 20_000
  return 30_000
}

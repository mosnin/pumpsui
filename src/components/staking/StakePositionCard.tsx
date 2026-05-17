'use client'

import { useState } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import {
  STAKING_POOL_ID,
  buildUnstakeTx,
  formatOmni,
  getTierFromStake,
  lockMsToMultiplierBps,
} from '@/lib/staking'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StakePositionData {
  id: string
  stakedBaseUnits: bigint
  lockedUntilMs: number
  stakedAtMs: number
  lockMultiplierBps: number
}

// ─── Countdown helper ─────────────────────────────────────────────────────────

function useCountdown(targetMs: number): string {
  const now = Date.now()
  const diff = targetMs - now
  if (diff <= 0) return 'Unlocked'
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  if (days > 0) return `${days}d ${hours}h remaining`
  const mins = Math.floor((diff % 3_600_000) / 60_000)
  return `${hours}h ${mins}m remaining`
}

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ stakedBaseUnits }: { stakedBaseUnits: bigint }) {
  const tier = getTierFromStake(stakedBaseUnits)
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-bold"
      style={{
        background: `${tier.color}18`,
        color: tier.color,
        border: `1px solid ${tier.color}33`,
      }}
    >
      {tier.name}
    </span>
  )
}

// ─── StakePositionCard ────────────────────────────────────────────────────────

interface Props {
  position: StakePositionData
}

export function StakePositionCard({ position }: Props) {
  const account                            = useCurrentAccount()
  const { mutateAsync: signAndExecute }    = useSignAndExecuteTransaction()
  const [loading, setLoading]              = useState(false)
  const [done, setDone]                    = useState(false)

  const isUnlocked = Date.now() >= position.lockedUntilMs
  const countdown  = useCountdown(position.lockedUntilMs)
  const tier       = getTierFromStake(position.stakedBaseUnits)
  const omniAmount = formatOmni(position.stakedBaseUnits)
  const multiplier = position.lockMultiplierBps / 10_000
  const votingPower = (Number(position.stakedBaseUnits) * position.lockMultiplierBps / 10_000 / 1e9).toLocaleString('en-US', { maximumFractionDigits: 0 })

  const unlockDate = position.lockedUntilMs === 0
    ? 'No lock'
    : new Date(position.lockedUntilMs).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })

  const handleUnstake = async () => {
    if (!account || !isUnlocked) return
    setLoading(true)
    try {
      const tx = buildUnstakeTx(STAKING_POOL_ID, position.id)
      // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
      await signAndExecute({ transaction: tx })
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (done) return null

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-4"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.95), rgba(13,13,31,0.98))',
        border: `1px solid ${isUnlocked ? 'rgba(16,185,129,0.25)' : 'rgba(42,42,90,0.6)'}`,
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {/* OMNI token icon placeholder */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(6,182,212,0.2))',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#818CF8',
            }}
          >
            Ω
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">{omniAmount} OMNI</p>
            <p className="text-xs text-slate-500">Staked</p>
          </div>
        </div>
        <TierBadge stakedBaseUnits={position.stakedBaseUnits} />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div
          className="rounded-lg p-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-slate-500 mb-0.5">Lock period</p>
          <p className="text-white font-semibold">{multiplier}× multiplier</p>
        </div>
        <div
          className="rounded-lg p-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-slate-500 mb-0.5">Voting power</p>
          <p className="font-semibold" style={{ color: '#06B6D4' }}>{votingPower}</p>
        </div>
        <div
          className="rounded-lg p-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-slate-500 mb-0.5">Unlock date</p>
          <p className="text-white font-semibold">{unlockDate}</p>
        </div>
        <div
          className="rounded-lg p-2.5"
          style={{
            background: isUnlocked ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isUnlocked ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          <p className="text-slate-500 mb-0.5">Status</p>
          <p className="font-semibold text-xs" style={{ color: isUnlocked ? '#34d399' : '#f59e0b' }}>
            {countdown}
          </p>
        </div>
      </div>

      {/* Unstake button */}
      <button
        onClick={handleUnstake}
        disabled={!isUnlocked || loading || !account}
        title={!isUnlocked ? `Locked: ${countdown}` : undefined}
        className="w-full rounded-xl py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed"
        style={
          isUnlocked
            ? {
                background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(6,182,212,0.1))',
                color: '#34d399',
                border: '1px solid rgba(16,185,129,0.3)',
              }
            : {
                background: 'rgba(255,255,255,0.03)',
                color: '#475569',
                border: '1px solid rgba(255,255,255,0.06)',
              }
        }
      >
        {loading
          ? 'Unstaking…'
          : isUnlocked
          ? 'Unstake'
          : countdown}
      </button>
    </div>
  )
}

// ─── Mock data export for the staking page ────────────────────────────────────

export const MOCK_POSITIONS: StakePositionData[] = [
  {
    id: '0xpos1',
    stakedBaseUnits: 12_500_000_000_000n,
    lockedUntilMs: Date.now() + 28 * 86_400_000, // 28 days from now
    stakedAtMs: Date.now() - 62 * 86_400_000,
    lockMultiplierBps: 20_000,
  },
  {
    id: '0xpos2',
    stakedBaseUnits: 2_000_000_000_000n,
    lockedUntilMs: 0,
    stakedAtMs: Date.now() - 5 * 86_400_000,
    lockMultiplierBps: 10_000,
  },
]

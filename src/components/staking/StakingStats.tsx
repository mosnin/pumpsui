'use client'

import { useCurrentAccount } from '@mysten/dapp-kit'
import { getTierFromStake } from '@/lib/staking'

// ─── Mock data (replace with on-chain queries post-deployment) ────────────────

const MOCK_TOTAL_STAKED_OMNI  = 42_500_000          // 42.5 M OMNI
const MOCK_TOTAL_SUPPLY_OMNI  = 1_000_000_000       // 1 B OMNI
const MOCK_STAKERS            = 3_841
const MOCK_ESTIMATED_APY      = 18.4                // %
const MOCK_USER_STAKED_BASE   = 12_500_000_000_000n // 12,500 OMNI (base units)

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  sub?: string
  accent?: string
}

function StatCard({ label, value, sub, accent = '#6366F1' }: StatCardProps) {
  return (
    <div
      className="flex flex-col gap-1 rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
        border: '1px solid rgba(42,42,90,0.6)',
      }}
    >
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p
        className="text-2xl font-black tracking-tight"
        style={{
          background: `linear-gradient(135deg, ${accent}, #fff)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

// ─── Tier badge ───────────────────────────────────────────────────────────────

const TIER_ICONS: Record<string, string> = {
  Bronze:  'B',
  Silver:  'S',
  Gold:    'G',
  Diamond: 'D',
}

interface TierBadgeProps {
  stakedBaseUnits: bigint
}

function TierBadge({ stakedBaseUnits }: TierBadgeProps) {
  const tier = getTierFromStake(stakedBaseUnits)
  return (
    <div
      className="flex flex-col gap-1 rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
        border: `1px solid ${tier.color}33`,
      }}
    >
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Your Tier</p>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
          style={{ background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}44` }}
        >
          {TIER_ICONS[tier.name]}
        </div>
        <span className="text-2xl font-black" style={{ color: tier.color }}>
          {tier.name}
        </span>
      </div>
      <p className="text-xs text-slate-500">
        {tier.feeDiscount > 0
          ? `${tier.feeDiscount}% fee discount active`
          : 'Stake 1,000+ OMNI to unlock discounts'}
      </p>
    </div>
  )
}

// ─── StakingStats ─────────────────────────────────────────────────────────────

export function StakingStats() {
  const account = useCurrentAccount()

  const stakedPct = ((MOCK_TOTAL_STAKED_OMNI / MOCK_TOTAL_SUPPLY_OMNI) * 100).toFixed(1)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total OMNI Staked"
        value={`${(MOCK_TOTAL_STAKED_OMNI / 1_000_000).toFixed(1)}M`}
        sub={`${stakedPct}% of total supply`}
        accent="#6366F1"
      />
      <StatCard
        label="Total Stakers"
        value={MOCK_STAKERS.toLocaleString()}
        sub="Active positions"
        accent="#06B6D4"
      />
      <StatCard
        label="Est. APY"
        value={`${MOCK_ESTIMATED_APY}%`}
        sub="Based on 7-day fee avg"
        accent="#10B981"
      />
      {account ? (
        <TierBadge stakedBaseUnits={MOCK_USER_STAKED_BASE} />
      ) : (
        <StatCard
          label="Your Tier"
          value="—"
          sub="Connect wallet to view"
          accent="#64748b"
        />
      )}
    </div>
  )
}

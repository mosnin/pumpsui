'use client'

import { motion } from 'framer-motion'

interface VestingScheduleData {
  label: string
  totalAllocation: number
  claimedAmount: number
  claimableNow: number
  cliffDate: string
  unlockDate: string
  vestingEndDate: string
  color: string
}

// Demo data displayed when not connected / pre-TGE
const DEMO_SCHEDULE: VestingScheduleData = {
  label: 'Team Allocation',
  totalAllocation: 500_000,
  claimedAmount: 0,
  claimableNow: 0,
  cliffDate: 'Jan 2026',
  unlockDate: 'Jan 2026',
  vestingEndDate: 'Jan 2028',
  color: '#8B5CF6',
}

function ProgressBar({
  claimed,
  claimable,
  total,
  color,
}: {
  claimed: number
  claimable: number
  total: number
  color: string
}) {
  const claimedPct = total > 0 ? (claimed / total) * 100 : 0
  const claimablePct = total > 0 ? (claimable / total) * 100 : 0

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-400">Vested</span>
        <span className="text-white font-semibold">
          {((claimedPct + claimablePct)).toFixed(1)}%
        </span>
      </div>
      <div
        className="h-3 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        {/* Claimed portion */}
        <motion.div
          className="h-full rounded-full relative"
          style={{ background: color, width: `${claimedPct + claimablePct}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${claimedPct + claimablePct}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Claimed sub-bar in darker shade */}
          {claimedPct > 0 && (
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: total > 0 ? `${(claimed / (claimed + claimable)) * 100}%` : '0%',
                background: 'rgba(0,0,0,0.3)',
              }}
            />
          )}
        </motion.div>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: color, opacity: 0.5 }} />
          <span className="text-xs text-slate-500">
            Claimed: {claimed.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-xs text-slate-500">
            Claimable: {claimable.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-medium text-slate-300">{value}</span>
    </div>
  )
}

interface VestingCardProps {
  schedule?: VestingScheduleData
  isDemo?: boolean
}

export function VestingCard({ schedule = DEMO_SCHEDULE, isDemo = true }: VestingCardProps) {
  const { label, totalAllocation, claimedAmount, claimableNow, cliffDate, vestingEndDate, color } =
    schedule

  const canClaim = claimableNow > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.95) 0%, rgba(13,13,31,0.98) 100%)',
        border: `1px solid rgba(139,92,246,0.25)`,
        boxShadow: '0 0 40px rgba(139,92,246,0.05)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white">{label}</h4>
          {isDemo && (
            <span
              className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: 'rgba(139,92,246,0.15)',
                color: '#A78BFA',
                border: '1px solid rgba(139,92,246,0.2)',
              }}
            >
              Demo Preview
            </span>
          )}
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: claimableNow > 0 ? '#10B981' : '#64748b' }}
          />
          <span className="text-xs text-slate-400">
            {claimableNow > 0 ? 'Tokens available' : 'Vesting'}
          </span>
        </div>
      </div>

      {/* Total allocation */}
      <div
        className="rounded-xl p-3.5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <p className="text-xs text-slate-500 mb-1">Total Allocation</p>
        <p
          className="text-2xl font-black"
          style={{ color }}
        >
          {totalAllocation.toLocaleString()}{' '}
          <span className="text-sm font-semibold text-slate-400">OMNI</span>
        </p>
      </div>

      {/* Progress bar */}
      <ProgressBar
        claimed={claimedAmount}
        claimable={claimableNow}
        total={totalAllocation}
        color={color}
      />

      {/* Schedule details */}
      <div
        className="rounded-xl p-3.5 flex flex-col gap-2"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <InfoRow label="Cliff Date" value={cliffDate} />
        <InfoRow label="Vesting End" value={vestingEndDate} />
        <InfoRow label="Remaining" value={`${(totalAllocation - claimedAmount).toLocaleString()} OMNI`} />
      </div>

      {/* Claim button */}
      <button
        disabled={!canClaim}
        className="w-full rounded-xl py-3 text-sm font-bold transition-all duration-200"
        style={
          canClaim
            ? {
                background: `linear-gradient(135deg, ${color}, #7C3AED)`,
                color: '#fff',
                boxShadow: '0 4px 24px rgba(139,92,246,0.35)',
              }
            : {
                background: 'rgba(255,255,255,0.04)',
                color: '#64748b',
                cursor: 'not-allowed',
              }
        }
      >
        {canClaim
          ? `Claim ${claimableNow.toLocaleString()} OMNI`
          : 'Nothing to claim yet'}
      </button>
    </motion.div>
  )
}

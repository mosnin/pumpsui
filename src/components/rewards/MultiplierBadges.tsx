'use client'

import { motion } from 'framer-motion'

interface MultiplierBadgeProps {
  label: string
  multiplier: number
  active: boolean
  description: string
  color?: string
}

function MultiplierBadge({ label, multiplier, active, description, color = '#6366F1' }: MultiplierBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{
        background: active
          ? `linear-gradient(135deg, ${color}18, ${color}08)`
          : 'rgba(22,22,48,0.5)',
        border: `1px solid ${active ? color + '35' : 'rgba(42,42,90,0.4)'}`,
        opacity: active ? 1 : 0.5,
      }}
    >
      {/* Indicator dot */}
      <div className="relative flex-shrink-0">
        <div
          className="w-3 h-3 rounded-full"
          style={{ background: active ? color : '#2A2A5A' }}
        />
        {active && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: color }}
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{label}</p>
        <p className="text-xs text-slate-500 truncate">{description}</p>
      </div>

      {/* Badge */}
      <div
        className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-black"
        style={{
          background: active ? `${color}25` : 'rgba(42,42,90,0.5)',
          color: active ? color : '#475569',
          border: `1px solid ${active ? color + '40' : 'transparent'}`,
        }}
      >
        {multiplier}×
      </div>
    </motion.div>
  )
}

interface MultiplierBadgesProps {
  streakDays: number
  isEarlyUser?: boolean
}

export function MultiplierBadges({ streakDays, isEarlyUser = true }: MultiplierBadgesProps) {
  const hasStreak = streakDays >= 7

  const multipliers: MultiplierBadgeProps[] = [
    {
      label: '7-Day Trading Streak',
      multiplier: 2,
      active: hasStreak,
      description: hasStreak
        ? `${streakDays}-day streak — 2× on all points`
        : `${streakDays}/7 days — check in daily to unlock`,
      color: '#F59E0B',
    },
    {
      label: 'Early User',
      multiplier: 1,
      active: isEarlyUser,
      description: 'Season 1 early adopter bonus (baked into base rates)',
      color: '#06B6D4',
    },
  ]

  return (
    <div className="flex flex-col gap-2">
      {multipliers.map((m) => (
        <MultiplierBadge key={m.label} {...m} />
      ))}
      {!hasStreak && (
        <p className="text-xs text-slate-500 px-1 mt-1">
          Check in daily for 7 consecutive days to unlock the 2× streak multiplier.
        </p>
      )}
    </div>
  )
}

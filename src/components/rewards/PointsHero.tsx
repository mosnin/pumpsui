'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform, animate } from 'framer-motion'
import { getTierForPoints, getNextTier, getTierProgress, TIERS } from '@/store/pointsStore'

// ─── Countdown timer ──────────────────────────────────────────────────────────

function useCountdown(targetDate: Date) {
  const calc = () => {
    const diff = Math.max(0, targetDate.getTime() - Date.now())
    const d = Math.floor(diff / 86_400_000)
    const h = Math.floor((diff % 86_400_000) / 3_600_000)
    const m = Math.floor((diff % 3_600_000) / 60_000)
    const s = Math.floor((diff % 60_000) / 1_000)
    return { d, h, m, s }
  }
  const [time, setTime] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1_000)
    return () => clearInterval(id)
  }, [targetDate])
  return time
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ value, className, style }: { value: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevRef = useRef(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const from = prevRef.current
    prevRef.current = value
    const ctrl = animate(from, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = Math.floor(v).toLocaleString()
      },
    })
    return () => ctrl.stop()
  }, [value])

  return (
    <span ref={ref} className={className} style={style}>
      {value.toLocaleString()}
    </span>
  )
}

// ─── Circular rank ring ───────────────────────────────────────────────────────

function RankRing({ percentile }: { percentile: number }) {
  const radius = 54
  const circ = 2 * Math.PI * radius
  const dash = circ * (1 - percentile / 100)

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
        {/* Track */}
        <circle cx="72" cy="72" r={radius} fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="10" />
        {/* Progress */}
        <motion.circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="url(#rank-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: dash }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />
        <defs>
          <linearGradient id="rank-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-2xl font-bold text-white">
          Top {percentile < 1 ? '<1' : Math.round(percentile)}%
        </span>
        <span className="text-xs text-slate-400 mt-0.5">Global rank</span>
      </div>
    </div>
  )
}

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ points }: { points: number }) {
  const tier = getTierForPoints(points)
  const next = getNextTier(points)
  const progress = getTierProgress(points)

  const tierIcons: Record<string, string> = {
    Bronze: '🥉',
    Silver: '🥈',
    Gold: '🥇',
    Diamond: '💎',
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-2xl px-5 py-4 min-w-[180px]"
      style={{
        background: `linear-gradient(135deg, ${tier.gradientFrom}22, ${tier.gradientTo}15)`,
        border: `1px solid ${tier.color}40`,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{tierIcons[tier.name]}</span>
        <span className="font-bold text-sm" style={{ color: tier.color }}>
          {tier.name}
        </span>
        {tier.discount > 0 && (
          <span
            className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: `${tier.color}25`, color: tier.color }}
          >
            {tier.discount}% off fees
          </span>
        )}
      </div>

      {next && (
        <>
          <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${tier.color}, ${next.color})` }}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <p className="text-xs text-slate-400">
            {(next.min - points).toLocaleString()} pts to{' '}
            <span style={{ color: next.color }}>{next.name}</span>
          </p>
        </>
      )}
      {!next && (
        <p className="text-xs" style={{ color: tier.color }}>
          Maximum tier reached ✓
        </p>
      )}
    </div>
  )
}

// ─── PointsHero ───────────────────────────────────────────────────────────────

interface PointsHeroProps {
  totalPoints: number
  /** Simulated global rank percentile (0–100, lower = better) */
  rankPercentile?: number
}

// Season 1 end — 90 days from a fixed anchor
const SEASON_END = new Date('2026-08-15T00:00:00Z')

export function PointsHero({ totalPoints, rankPercentile = 24 }: PointsHeroProps) {
  const { d, h, m, s } = useCountdown(SEASON_END)
  const omniEstimate = (totalPoints * 0.01).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl p-8"
      style={{
        background:
          'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.06) 50%, rgba(245,158,11,0.08) 100%)',
        border: '1px solid rgba(99,102,241,0.25)',
        boxShadow: '0 0 60px rgba(99,102,241,0.1), 0 0 120px rgba(245,158,11,0.05)',
      }}
    >
      {/* Background glow blobs */}
      <div
        className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -right-20 w-72 h-72 rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #F59E0B, transparent)' }}
      />

      <div className="relative flex flex-col lg:flex-row items-center lg:items-start gap-8">
        {/* Left — big number + OMNI estimate */}
        <div className="flex-1 flex flex-col items-center lg:items-start gap-3">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">
            Your Season 1 Points
          </p>

          {/* Massive animated number */}
          <div className="flex items-end gap-3">
            <AnimatedNumber
              value={totalPoints}
              className="text-6xl sm:text-7xl font-black tracking-tighter"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 40%, #FCD34D 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: 'var(--font-display)',
              } as React.CSSProperties}
            />
            <span className="text-2xl font-bold text-amber-400/60 mb-2">pts</span>
          </div>

          {/* OMNI estimate */}
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-4 h-4 rounded-full"
              style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}
            />
            <span className="text-slate-300 text-sm">
              Estimated OMNI at TGE:{' '}
              <span className="font-bold text-white">{omniEstimate} OMNI</span>
            </span>
            <span className="text-xs text-slate-500">(1 pt = 0.01 OMNI)</span>
          </div>

          {/* Tier badge */}
          <div className="mt-2">
            <TierBadge points={totalPoints} />
          </div>

          {/* Season countdown */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500">Season 1 ends in:</span>
            {[
              { val: d, label: 'd' },
              { val: h, label: 'h' },
              { val: m, label: 'm' },
              { val: s, label: 's' },
            ].map(({ val, label }) => (
              <div
                key={label}
                className="flex items-center gap-0.5 rounded-lg px-2.5 py-1"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                <span className="text-sm font-bold text-indigo-300 tabular-nums">
                  {String(val).padStart(2, '0')}
                </span>
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — rank ring */}
        <div className="flex flex-col items-center gap-3">
          <RankRing percentile={rankPercentile} />
          <div className="flex gap-1.5 flex-wrap justify-center">
            {TIERS.map((t) => (
              <div key={t.name} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: t.color }}
                />
                <span className="text-xs text-slate-500">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

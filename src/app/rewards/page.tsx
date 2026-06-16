'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PointsHero } from '@/components/rewards/PointsHero'
import { EarnCard } from '@/components/rewards/EarnCard'
import { DailyCheckin } from '@/components/rewards/DailyCheckin'
import { ActivityFeed } from '@/components/rewards/ActivityFeed'
import { LeaderboardMini } from '@/components/rewards/LeaderboardMini'
import { MultiplierBadges } from '@/components/rewards/MultiplierBadges'
import { usePointsStore, getTierForPoints, getNextTier, getTierProgress, TIERS } from '@/store/pointsStore'

// ─── Confetti (global, fires from anywhere) ───────────────────────────────────

function GlobalConfetti({ trigger }: { trigger: boolean }) {
  if (!trigger) return null
  const pieces = Array.from({ length: 40 })
  const colors = ['#F59E0B', '#6366F1', '#06B6D4', '#10B981', '#EC4899', '#FCD34D', '#A78BFA']

  return (
    <div className="pointer-events-none fixed inset-0 z-[999] overflow-hidden">
      {pieces.map((_, i) => {
        const x = Math.random() * 100
        const color = colors[i % colors.length]
        const size = 6 + Math.random() * 8
        const duration = 1.5 + Math.random() * 1.5
        const delay = Math.random() * 0.4

        return (
          <motion.div
            key={i}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${x}%`,
              width: size,
              height: size,
              background: color,
            }}
            initial={{ y: -20, opacity: 1, rotate: 0, scale: 1 }}
            animate={{
              y: '110vh',
              opacity: [1, 1, 0],
              rotate: Math.random() > 0.5 ? 360 : -360,
              scale: [1, 1, 0.3],
              x: (Math.random() - 0.5) * 200,
            }}
            transition={{ duration, delay, ease: 'easeIn' }}
          />
        )
      })}
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
    </div>
  )
}

// ─── Tier roadmap strip ───────────────────────────────────────────────────────

function TierRoadmap({ points }: { points: number }) {
  const current = getTierForPoints(points)
  const progress = getTierProgress(points)
  const next = getNextTier(points)

  const tierIcons: Record<string, string> = {
    Bronze: '🥉',
    Silver: '🥈',
    Gold: '🥇',
    Diamond: '💎',
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
        border: '1px solid rgba(42,42,90,0.6)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-white">Current Tier</p>
          <p className="text-xs text-slate-400">{current.discount > 0 ? `${current.discount}% fee discount active` : 'No discount yet'}</p>
        </div>
        <span className="text-2xl">{tierIcons[current.name]}</span>
      </div>

      {/* Progress bar over all tiers */}
      <div className="flex items-center gap-2">
        {TIERS.map((tier, i) => {
          const isActive = tier.name === current.name
          const isPast = TIERS.indexOf(tier) < TIERS.indexOf(current)
          return (
            <div key={tier.name} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(42,42,90,0.5)' }}
              >
                {(isPast || isActive) && (
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${tier.gradientFrom}, ${tier.gradientTo})`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: isActive ? `${progress * 100}%` : '100%' }}
                    transition={{ duration: 1.2, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </div>
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? tier.color : isPast ? '#475569' : '#2A2A5A' }}
              >
                {tier.name}
              </span>
            </div>
          )
        })}
      </div>

      {next && (
        <p className="text-xs text-slate-500 mt-3">
          <span className="text-white font-medium">{(next.min - points).toLocaleString()} pts</span>
          {' '}until {next.name} — unlocks{' '}
          <span style={{ color: next.color }}>{next.discount}% fee discount</span>
        </p>
      )}
    </div>
  )
}

// ─── Earn cards data ──────────────────────────────────────────────────────────

const EARN_ACTIONS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 16V4m0 0L3 8m4-4l4 4" />
        <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
    title: 'Swap Tokens',
    points: '1 pt per $1',
    description: 'Earn points for every dollar of swap volume. More volume = more points.',
    action: { label: 'Start Swapping', href: '/swap' },
    accent: '#6366F1',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
      </svg>
    ),
    title: 'Bridge Assets',
    points: '2 pts per $1',
    description: 'Double points for cross-chain bridging. Move assets between chains and earn 2×.',
    action: { label: 'Bridge Now', href: '/bridge' },
    accent: '#06B6D4',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="8" r="3" />
        <path d="M6.5 21C6.5 17.96 7.41 15.5 9 15.5" />
        <circle cx="17" cy="15" r="3" />
        <path d="M14.5 21C14.5 18.52 15.57 16.5 17 16.5" />
        <path d="M14 9l2-2-2-2M12 7h4" />
      </svg>
    ),
    title: 'Refer a Friend',
    points: '500 pts per referral',
    description: 'Share your referral link. Earn 500 points for every friend who completes their first swap.',
    action: { label: 'Get Referral Link', href: '/referral' },
    accent: '#10B981',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'DCA Orders',
    points: '50 pts per cycle',
    description: 'Set up dollar-cost averaging orders. Earn 50 points every time a DCA cycle executes.',
    action: { label: 'Create DCA', href: '/swap' },
    accent: '#8B5CF6',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: 'Daily Check-In',
    points: '10 pts/day',
    description: 'Log in daily and check in to earn 10 points. Hit a 7-day streak to unlock the 2× multiplier.',
    action: { label: 'Check In Now', href: '/rewards' },
    accent: '#F59E0B',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: '7-Day Streak',
    points: '2× multiplier',
    description: 'Trade for 7 consecutive days and all future points are doubled for the duration of your streak.',
    action: { label: 'View Calendar', href: '/rewards' },
    accent: '#EF4444',
  },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const { totalPoints, pointsHistory, streakDays } = usePointsStore()
  const [showConfetti, setShowConfetti] = useState(false)
  const prevPoints = useRef(totalPoints)

  // Fire confetti whenever points increase
  useEffect(() => {
    if (totalPoints > prevPoints.current) {
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 2500)
      prevPoints.current = totalPoints
      return () => clearTimeout(t)
    }
    prevPoints.current = totalPoints
  }, [totalPoints])

  const multiplier = streakDays >= 7 ? 2 : 1

  return (
    <>
      <GlobalConfetti trigger={showConfetti} />

      <div className="relative min-h-screen">
        {/* Background ambient blobs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.07] blur-[100px]"
            style={{ background: '#6366F1' }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-[0.05] blur-[100px]"
            style={{ background: '#F59E0B' }}
          />
          <div
            className="absolute top-3/4 left-1/2 w-64 h-64 rounded-full opacity-[0.05] blur-[80px]"
            style={{ background: '#06B6D4' }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          {/* Page title */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <h1
                className="text-3xl font-black tracking-tight"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #6366F1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Points & Rewards
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Earn points now, convert to{' '}
                <span className="text-indigo-400 font-semibold">OMNI tokens</span> at TGE
              </p>
            </div>

            {/* Season badge */}
            <div
              className="self-start sm:self-auto flex items-center gap-2 rounded-full px-4 py-2"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.1))',
                border: '1px solid rgba(99,102,241,0.3)',
              }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-indigo-300">Season 1 — Live</span>
            </div>
          </motion.div>

          {/* Hero */}
          <PointsHero totalPoints={totalPoints} rankPercentile={Math.max(1, 100 - Math.floor(totalPoints / 100))} />

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left main column */}
            <div className="lg:col-span-2 space-y-8">

              {/* Daily Check-In */}
              <section>
                <SectionHeader
                  title="Daily Check-In"
                  subtitle="Start your day with OmniWeave"
                />
                <DailyCheckin />
              </section>

              {/* Tier Roadmap */}
              <section>
                <SectionHeader
                  title="Reward Tiers"
                  subtitle="Unlock fee discounts as you accumulate points"
                />
                <TierRoadmap points={totalPoints} />
              </section>

              {/* How to Earn */}
              <section>
                <SectionHeader
                  title="How to Earn"
                  subtitle="Multiple ways to rack up points every day"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {EARN_ACTIONS.map((card) => (
                    <EarnCard
                      key={card.title}
                      icon={card.icon}
                      title={card.title}
                      points={card.points}
                      description={card.description}
                      action={card.action}
                      accent={card.accent}
                      multiplier={
                        multiplier > 1 &&
                        (card.title === 'Swap Tokens' || card.title === 'Bridge Assets' || card.title === 'DCA Orders')
                          ? multiplier
                          : undefined
                      }
                    />
                  ))}
                </div>
              </section>

              {/* Activity Feed */}
              <section>
                <SectionHeader
                  title="Recent Activity"
                  subtitle="Your latest point-earning events"
                />
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
                    border: '1px solid rgba(42,42,90,0.6)',
                  }}
                >
                  <ActivityFeed events={pointsHistory} />
                </div>
              </section>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* Multipliers */}
              <section>
                <SectionHeader
                  title="Active Multipliers"
                  subtitle="Bonuses applied to your earned points"
                />
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
                    border: '1px solid rgba(42,42,90,0.6)',
                  }}
                >
                  <MultiplierBadges streakDays={streakDays} />
                </div>
              </section>

              {/* Points breakdown */}
              <section>
                <SectionHeader title="Points Breakdown" />
                <PointsBreakdown />
              </section>

              {/* Leaderboard mini */}
              <section>
                <SectionHeader
                  title="Leaderboard"
                  subtitle="Season 1 top earners"
                />
                <LeaderboardMini userPoints={totalPoints} />
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Points breakdown sidebar card ───────────────────────────────────────────

function PointsBreakdown() {
  const { swapPoints, bridgePoints, referralPoints, dcaPoints, checkinPoints, totalPoints } = usePointsStore()

  const categories = [
    { label: 'Swap', pts: swapPoints, color: '#6366F1' },
    { label: 'Bridge', pts: bridgePoints, color: '#06B6D4' },
    { label: 'Referral', pts: referralPoints, color: '#10B981' },
    { label: 'DCA', pts: dcaPoints, color: '#8B5CF6' },
    { label: 'Check-ins', pts: checkinPoints, color: '#F59E0B' },
  ]

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
        border: '1px solid rgba(42,42,90,0.6)',
      }}
    >
      {categories.map(({ label, pts, color }) => {
        const pct = totalPoints > 0 ? (pts / totalPoints) * 100 : 0
        return (
          <div key={label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-slate-400">{label}</span>
              </div>
              <span className="font-bold text-white">{pts.toLocaleString()}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-white/5">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        )
      })}

      <div
        className="flex items-center justify-between pt-2 mt-1"
        style={{ borderTop: '1px solid rgba(42,42,90,0.4)' }}
      >
        <span className="text-xs text-slate-400 font-medium">Total</span>
        <span
          className="text-sm font-black"
          style={{
            background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {totalPoints.toLocaleString()} pts
        </span>
      </div>
    </div>
  )
}

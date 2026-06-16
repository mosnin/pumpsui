'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { AirdropClaimCard } from '@/components/token/AirdropClaimCard'
import { TokenomicsChart } from '@/components/token/TokenomicsChart'
import { VestingCard } from '@/components/token/VestingCard'
import { OMNI_TOTAL_SUPPLY, OMNI_DISTRIBUTION } from '@/lib/tokenomics'

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  )
}

function StatsBar() {
  const communityPct = OMNI_DISTRIBUTION.find((d) => d.label === 'Community & Rewards')?.percentage ?? 40
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-2xl px-6 py-4"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.8), rgba(13,13,31,0.9))',
        border: '1px solid rgba(42,42,90,0.5)',
      }}
    >
      <div className="flex flex-wrap items-center gap-6 sm:gap-10">
        <StatItem
          label="Total Supply"
          value={`${(OMNI_TOTAL_SUPPLY / 1_000_000_000).toFixed(0)}B OMNI`}
        />
        <div className="h-8 w-px hidden sm:block" style={{ background: 'rgba(42,42,90,0.7)' }} />
        <StatItem label="Community Allocation" value={`${communityPct}%`} />
        <div className="h-8 w-px hidden sm:block" style={{ background: 'rgba(42,42,90,0.7)' }} />
        <StatItem label="TGE Launch" value="TBD" />
        <div className="h-8 w-px hidden sm:block" style={{ background: 'rgba(42,42,90,0.7)' }} />
        <StatItem label="Conversion Rate" value="1,000 pts = 1 OMNI" />
      </div>
    </motion.div>
  )
}

// ─── Utility section ──────────────────────────────────────────────────────────

interface UtilityCardProps {
  icon: React.ReactNode
  title: string
  description: string
  accent: string
  delay?: number
}

function UtilityCard({ icon, title, description, accent, delay = 0 }: UtilityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
        border: '1px solid rgba(42,42,90,0.5)',
      }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          background: `${accent}18`,
          border: `1px solid ${accent}30`,
          color: accent,
        }}
      >
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

const UTILITY_ITEMS: UtilityCardProps[] = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: 'Fee Discounts',
    description:
      'Hold OMNI to reduce protocol fees. Diamond tier holders enjoy up to 50% discount on all swaps and bridges.',
    accent: '#F59E0B',
    delay: 0.2,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8m-4-4v4" />
      </svg>
    ),
    title: 'Governance',
    description:
      'Vote on protocol upgrades, fee parameters, liquidity incentives, and treasury allocations. 1 OMNI = 1 vote.',
    accent: '#6366F1',
    delay: 0.25,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: 'Staking Yield',
    description:
      'Stake OMNI to earn a share of protocol revenue. 50% of all fees flow back to stakers as SUI rewards.',
    accent: '#06B6D4',
    delay: 0.3,
  },
]

function UtilitySection() {
  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="mb-4"
      >
        <h2 className="text-lg font-bold text-white">Token Utility</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          OMNI powers the OmniWeave ecosystem across three pillars
        </p>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {UTILITY_ITEMS.map((item) => (
          <UtilityCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  )
}

// ─── Vesting section ──────────────────────────────────────────────────────────

function VestingSection() {
  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="mb-4"
      >
        <h2 className="text-lg font-bold text-white">Vesting Schedules</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Team and investor tokens are locked and released over time to align long-term incentives
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <VestingCard
          schedule={{
            label: 'Team Allocation',
            totalAllocation: 500_000,
            claimedAmount: 0,
            claimableNow: 0,
            cliffDate: 'Jan 2026',
            unlockDate: 'Jan 2026',
            vestingEndDate: 'Jan 2028',
            color: '#8B5CF6',
          }}
          isDemo
        />
        <VestingCard
          schedule={{
            label: 'Investor Round',
            totalAllocation: 250_000,
            claimedAmount: 0,
            claimableNow: 0,
            cliffDate: 'Jul 2025',
            unlockDate: 'Jul 2025',
            vestingEndDate: 'Jan 2027',
            color: '#06B6D4',
          }}
          isDemo
        />
        <VestingCard
          schedule={{
            label: 'Advisor Grant',
            totalAllocation: 50_000,
            claimedAmount: 0,
            claimableNow: 0,
            cliffDate: 'Apr 2025',
            unlockDate: 'Apr 2025',
            vestingEndDate: 'Apr 2026',
            color: '#10B981',
          }}
          isDemo
        />
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mt-4 text-center text-xs text-slate-500"
      >
        Connect your wallet after TGE to see your personal vesting schedule on-chain
      </motion.p>
    </section>
  )
}

// ─── Page header ──────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
    >
      <div>
        <h1
          className="text-3xl font-black tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 40%, #06B6D4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          OMNI Token
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          The governance and fee-sharing token of OmniWeave
        </p>
      </div>

      {/* Action links */}
      <div className="flex items-center gap-3">
        <Link
          href="/docs"
          className="rounded-lg border px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:text-white hover:border-indigo-500/50"
          style={{ borderColor: 'rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.07)' }}
        >
          Docs
        </Link>
        <Link
          href="/docs"
          className="rounded-lg border px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:text-white hover:border-cyan-500/50"
          style={{ borderColor: 'rgba(6,182,212,0.25)', background: 'rgba(6,182,212,0.07)' }}
        >
          Whitepaper
        </Link>
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TokenPage() {
  return (
    <div className="relative min-h-screen">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div
          className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full opacity-[0.06] blur-[120px]"
          style={{ background: '#6366F1' }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-[0.05] blur-[100px]"
          style={{ background: '#06B6D4' }}
        />
        <div
          className="absolute top-2/3 left-1/4 w-64 h-64 rounded-full opacity-[0.04] blur-[80px]"
          style={{ background: '#8B5CF6' }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Page title + action links */}
        <PageHeader />

        {/* Stats strip */}
        <StatsBar />

        {/* Main two-column: airdrop claim + tokenomics chart */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-4"
          >
            <h2 className="text-lg font-bold text-white">Airdrop & Distribution</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Check your Season 1 airdrop and explore the token distribution
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AirdropClaimCard />
            <TokenomicsChart />
          </div>
        </section>

        {/* Utility: 3-card grid */}
        <UtilitySection />

        {/* Vesting schedules */}
        <VestingSection />
      </div>
    </div>
  )
}

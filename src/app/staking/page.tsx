'use client'

import { motion } from 'framer-motion'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { StakingStats } from '@/components/staking/StakingStats'
import { StakeCard } from '@/components/staking/StakeCard'
import { StakePositionCard, MOCK_POSITIONS } from '@/components/staking/StakePositionCard'

// ─── Info strip ───────────────────────────────────────────────────────────────

function InfoStrip() {
  const items = [
    { icon: '⬡', label: 'Stake OMNI', desc: 'Lock tokens to earn a share of all protocol fees' },
    { icon: '↗', label: 'Earn Protocol Fees', desc: 'Fees in any coin flow proportionally to stakers' },
    { icon: '⚖', label: 'Voting Power', desc: 'Shape the future of OmniWeave through governance' },
    { icon: '%', label: 'Fee Discounts', desc: 'Up to 25% off swap fees for top-tier stakers' },
  ]

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      style={{ borderRadius: '1rem' }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-3 rounded-xl p-4"
          style={{
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.15)',
          }}
        >
          <span
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base font-black"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8' }}
          >
            {item.icon}
          </span>
          <div>
            <p className="text-sm font-bold text-white leading-tight">{item.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Positions panel ──────────────────────────────────────────────────────────

function PositionsPanel() {
  const account = useCurrentAccount()

  if (!account) {
    return (
      <div
        className="rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center h-full"
        style={{
          background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
          border: '1px solid rgba(42,42,90,0.5)',
          minHeight: '320px',
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          ⬡
        </div>
        <p className="text-white font-semibold">No wallet connected</p>
        <p className="text-sm text-slate-500">Connect your wallet to view staking positions</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-white">Your Positions</h2>
      {MOCK_POSITIONS.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
            border: '1px solid rgba(42,42,90,0.5)',
          }}
        >
          <p className="text-slate-400">No active positions. Stake OMNI to get started.</p>
        </div>
      ) : (
        MOCK_POSITIONS.map((pos) => (
          <StakePositionCard key={pos.id} position={pos} />
        ))
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StakingPage() {
  return (
    <div className="relative min-h-screen">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div
          className="absolute top-1/4 left-1/6 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[120px]"
          style={{ background: '#6366F1' }}
        />
        <div
          className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] rounded-full opacity-[0.05] blur-[100px]"
          style={{ background: '#06B6D4' }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Hero header */}
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
                background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              OMNI Staking
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Lock OMNI tokens to earn protocol fees, fee discounts, and governance voting power
            </p>
          </div>

          <div
            className="self-start sm:self-auto flex items-center gap-2 rounded-full px-4 py-2"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.1))',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-sm font-semibold text-indigo-300">Phase 2 — Live</span>
          </div>
        </motion.div>

        {/* Stats strip */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
          <StakingStats />
        </motion.div>

        {/* Info strip */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <InfoStrip />
        </motion.div>

        {/* Main layout: StakeCard left, Positions right */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
        >
          <div>
            <h2 className="text-base font-bold text-white mb-4">Stake / Unstake</h2>
            <StakeCard />
          </div>
          <PositionsPanel />
        </motion.div>
      </div>
    </div>
  )
}

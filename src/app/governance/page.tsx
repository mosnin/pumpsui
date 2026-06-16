'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { ProposalCard, MOCK_PROPOSALS, type ProposalData } from '@/components/governance/ProposalCard'
import { CreateProposalModal } from '@/components/governance/CreateProposalModal'

// Demo: the user's first mock position ID (replace with wallet query post-deploy)
const DEMO_POSITION_ID = '0xpos1'

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type Filter = 'All' | 'Active' | 'Passed' | 'Failed'
const FILTERS: Filter[] = ['All', 'Active', 'Passed', 'Failed']

function filterProposals(proposals: ProposalData[], filter: Filter): ProposalData[] {
  if (filter === 'All') return proposals
  const now = Date.now()
  return proposals.filter((p) => {
    if (filter === 'Active') return !p.executed && now <= p.endMs
    if (filter === 'Passed') {
      const total = p.forVotes + p.againstVotes
      return !p.executed && now > p.endMs && p.forVotes > p.againstVotes && total >= 40_000_000_000_000_000
    }
    if (filter === 'Failed') {
      const total = p.forVotes + p.againstVotes
      return !p.executed && now > p.endMs && (p.forVotes <= p.againstVotes || total < 40_000_000_000_000_000)
    }
    return true
  })
}

// ─── Stats strip ──────────────────────────────────────────────────────────────

function GovernanceStats() {
  const now = Date.now()
  const active  = MOCK_PROPOSALS.filter((p) => now <= p.endMs && !p.executed).length
  const passed  = MOCK_PROPOSALS.filter((p) => {
    const t = p.forVotes + p.againstVotes
    return now > p.endMs && p.forVotes > p.againstVotes && t >= 40_000_000_000_000_000
  }).length
  const totalVoters = 1_247

  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Active Proposals', value: String(active), accent: '#6366F1' },
        { label: 'Proposals Passed', value: String(passed),  accent: '#10B981' },
        { label: 'Unique Voters',    value: totalVoters.toLocaleString(), accent: '#06B6D4' },
      ].map(({ label, value, accent }) => (
        <div
          key={label}
          className="rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
            border: '1px solid rgba(42,42,90,0.6)',
          }}
        >
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p
            className="text-2xl font-black mt-1"
            style={{
              background: `linear-gradient(135deg, ${accent}, #fff)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GovernancePage() {
  const account            = useCurrentAccount()
  const [filter, setFilter] = useState<Filter>('All')
  const [modalOpen, setModal] = useState(false)

  const filtered = filterProposals(MOCK_PROPOSALS, filter)

  return (
    <div className="relative min-h-screen">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div
          className="absolute top-1/3 right-1/4 w-[480px] h-[480px] rounded-full opacity-[0.05] blur-[120px]"
          style={{ background: '#6366F1' }}
        />
        <div
          className="absolute bottom-1/3 left-1/4 w-[360px] h-[360px] rounded-full opacity-[0.04] blur-[100px]"
          style={{ background: '#06B6D4' }}
        />
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
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
              OmniWeave Governance
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Powered by OMNI stakers · Shape the future of the protocol
            </p>
          </div>

          <button
            onClick={() => setModal(true)}
            className="self-start sm:self-auto flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Proposal
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
          <GovernanceStats />
        </motion.div>

        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'rgba(99,102,241,0.2)', color: '#818CF8' }}
          >
            ℹ
          </div>
          <div>
            <p className="text-sm font-semibold text-white">How voting works</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Stake OMNI with a longer lock to gain more voting power (up to 3×). Create proposals with 10,000+ OMNI voting power.
              Proposals pass with majority and 4% of total supply (40M OMNI) quorum in 7 days.
            </p>
          </div>
        </motion.div>

        {/* Filter tabs */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}>
          <div
            className="flex gap-1 rounded-xl p-1 w-fit"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="rounded-lg px-4 py-1.5 text-sm font-medium transition-all"
                style={
                  filter === f
                    ? {
                        background: 'rgba(99,102,241,0.3)',
                        color: '#c7d2fe',
                        border: '1px solid rgba(99,102,241,0.4)',
                      }
                    : { color: '#64748b' }
                }
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Proposals list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-col gap-4"
        >
          {filtered.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
                border: '1px solid rgba(42,42,90,0.5)',
              }}
            >
              <p className="text-slate-400">No {filter.toLowerCase()} proposals found.</p>
            </div>
          ) : (
            filtered.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                stakePositionId={account ? DEMO_POSITION_ID : undefined}
              />
            ))
          )}
        </motion.div>
      </div>

      {/* Create Proposal Modal */}
      <CreateProposalModal
        isOpen={modalOpen}
        onClose={() => setModal(false)}
        stakePositionId={account ? DEMO_POSITION_ID : undefined}
      />
    </div>
  )
}

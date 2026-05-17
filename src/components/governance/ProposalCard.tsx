'use client'

import { useState } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { buildVoteTx, STAKING_PACKAGE_ID } from '@/lib/staking'
import { shortenAddress } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProposalStatus = 'Active' | 'Passed' | 'Failed' | 'Executed'

export interface ProposalData {
  id: string
  title: string
  description: string
  proposer: string
  forVotes: number
  againstVotes: number
  startMs: number
  endMs: number
  executed: boolean
  actionType: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const QUORUM = 40_000_000_000_000_000

function getStatus(p: ProposalData): ProposalStatus {
  if (p.executed) return 'Executed'
  const now = Date.now()
  const total = p.forVotes + p.againstVotes
  if (now <= p.endMs) return 'Active'
  if (p.forVotes > p.againstVotes && total >= QUORUM) return 'Passed'
  return 'Failed'
}

function timeRemaining(endMs: number): string {
  const diff = endMs - Date.now()
  if (diff <= 0) return 'Ended'
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  if (days > 0) return `${days}d ${hours}h left`
  const mins = Math.floor((diff % 3_600_000) / 60_000)
  return `${hours}h ${mins}m left`
}

const STATUS_STYLES: Record<ProposalStatus, { bg: string; color: string }> = {
  Active:   { bg: 'rgba(99,102,241,0.15)',   color: '#818CF8' },
  Passed:   { bg: 'rgba(16,185,129,0.15)',   color: '#34d399' },
  Failed:   { bg: 'rgba(239,68,68,0.12)',    color: '#f87171' },
  Executed: { bg: 'rgba(6,182,212,0.12)',    color: '#22d3ee' },
}

const ACTION_LABELS: Record<number, string> = {
  0: 'Text only',
  1: 'Fee change',
  2: 'Emergency pause',
  3: 'Unpause',
}

// ─── Vote progress bar ────────────────────────────────────────────────────────

function VoteBar({ forVotes, againstVotes }: { forVotes: number; againstVotes: number }) {
  const total = forVotes + againstVotes
  const forPct = total > 0 ? (forVotes / total) * 100 : 50

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs font-medium">
        <span style={{ color: '#34d399' }}>
          For {total > 0 ? forPct.toFixed(1) : '—'}%
        </span>
        <span style={{ color: '#f87171' }}>
          {total > 0 ? (100 - forPct).toFixed(1) : '—'}% Against
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(239,68,68,0.25)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${forPct}%`,
            background: 'linear-gradient(90deg, #10B981, #34d399)',
          }}
        />
      </div>
    </div>
  )
}

// ─── ProposalCard ─────────────────────────────────────────────────────────────

interface Props {
  proposal: ProposalData
  stakePositionId?: string
}

export function ProposalCard({ proposal, stakePositionId }: Props) {
  const account                         = useCurrentAccount()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()
  const [voting, setVoting]             = useState<'for' | 'against' | null>(null)
  const [voted, setVoted]               = useState<boolean | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [expanded, setExpanded]         = useState(false)

  const status = getStatus(proposal)
  const statusStyle = STATUS_STYLES[status]
  const timeLeft = timeRemaining(proposal.endMs)
  const canVote  = status === 'Active' && !!account && !!stakePositionId && voted === null

  const castVote = async (support: boolean) => {
    if (!canVote || !stakePositionId) return
    setVoting(support ? 'for' : 'against')
    setError(null)
    try {
      const tx = buildVoteTx(proposal.id, stakePositionId, support)
      // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
      await signAndExecute({ transaction: tx })
      setVoted(support)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Vote failed')
    } finally {
      setVoting(null)
    }
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 transition-all"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.95), rgba(13,13,31,0.98))',
        border: '1px solid rgba(42,42,90,0.6)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{ background: statusStyle.bg, color: statusStyle.color }}
            >
              {status}
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {ACTION_LABELS[proposal.actionType] ?? 'Unknown'}
            </span>
          </div>
          <h3 className="text-white font-bold text-base leading-tight">{proposal.title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            by{' '}
            <span className="text-indigo-400 font-mono">{shortenAddress(proposal.proposer)}</span>
            {' · '}
            {timeLeft}
          </p>
        </div>
      </div>

      {/* Vote bar */}
      <VoteBar forVotes={proposal.forVotes} againstVotes={proposal.againstVotes} />

      {/* Expanded description */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors text-left"
      >
        {expanded ? 'Hide details ↑' : 'Show details ↓'}
      </button>
      {expanded && (
        <p className="text-sm text-slate-400 leading-relaxed">{proposal.description}</p>
      )}

      {/* Vote buttons */}
      {voted !== null ? (
        <div
          className="rounded-xl p-3 text-center text-sm font-semibold"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          {voted ? 'You voted For' : 'You voted Against'} — vote recorded
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => castVote(true)}
            disabled={!canVote || voting !== null}
            className="rounded-xl py-2.5 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(16,185,129,0.15)',
              color: '#34d399',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            {voting === 'for' ? 'Voting…' : 'Vote For'}
          </button>
          <button
            onClick={() => castVote(false)}
            disabled={!canVote || voting !== null}
            className="rounded-xl py-2.5 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(239,68,68,0.12)',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            {voting === 'against' ? 'Voting…' : 'Vote Against'}
          </button>
        </div>
      )}

      {!account && status === 'Active' && (
        <p className="text-xs text-center text-slate-500">Connect wallet and stake OMNI to vote</p>
      )}

      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  )
}

// ─── Mock proposals export ────────────────────────────────────────────────────

export const MOCK_PROPOSALS: ProposalData[] = [
  {
    id: '0xprop1',
    title: 'Reduce protocol fee from 5 bps to 3 bps',
    description:
      'This proposal aims to increase OmniWeave\'s competitiveness by reducing the swap fee from 5 basis points to 3 basis points. Analysis shows that similar DEX aggregators on Sui charge 2–4 bps, and a reduction could increase volume by an estimated 15–25%, which should more than offset the per-trade fee reduction.',
    proposer: '0x1234567890abcdef1234567890abcdef12345678',
    forVotes: 62_000_000_000_000_000,
    againstVotes: 21_000_000_000_000_000,
    startMs: Date.now() - 2 * 86_400_000,
    endMs: Date.now() + 5 * 86_400_000,
    executed: false,
    actionType: 1,
  },
  {
    id: '0xprop2',
    title: 'Add Aftermath Finance as a whitelisted DEX source',
    description:
      'Aftermath Finance has grown significantly in TVL and daily volume. Whitelisting it as a routing source would improve swap rates for large orders. This is a text-only signal vote — the technical integration will follow in a separate upgrade if passed.',
    proposer: '0xabcdef1234567890abcdef1234567890abcdef12',
    forVotes: 95_000_000_000_000_000,
    againstVotes: 4_000_000_000_000_000,
    startMs: Date.now() - 10 * 86_400_000,
    endMs: Date.now() - 3 * 86_400_000,
    executed: false,
    actionType: 0,
  },
  {
    id: '0xprop3',
    title: 'Allocate 500,000 OMNI to Liquidity Mining Programme',
    description:
      'Proposal to allocate 500,000 OMNI from the Ecosystem Fund to a 90-day liquidity mining programme. Rewards would be distributed to SUI/OMNI and USDC/OMNI LP providers on Cetus. Programme would be managed by a 3-of-5 multisig.',
    proposer: '0xdeadbeef1234567890deadbeef1234567890dead',
    forVotes: 10_000_000_000_000_000,
    againstVotes: 38_000_000_000_000_000,
    startMs: Date.now() - 8 * 86_400_000,
    endMs: Date.now() - 1 * 86_400_000,
    executed: false,
    actionType: 0,
  },
]

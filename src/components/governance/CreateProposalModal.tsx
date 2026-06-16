'use client'

import { useState, useEffect } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { buildCreateProposalTx } from '@/lib/staking'

// ─── Types ────────────────────────────────────────────────────────────────────

const ACTION_TYPES = [
  { value: 0, label: 'Text only',        desc: 'Signal vote with no automatic on-chain effect' },
  { value: 1, label: 'Fee change',       desc: 'Propose a new protocol swap fee (in bps)' },
  { value: 2, label: 'Emergency pause',  desc: 'Pause all swaps until an unpause proposal passes' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
  stakePositionId?: string
}

// ─── CreateProposalModal ──────────────────────────────────────────────────────

export function CreateProposalModal({ isOpen, onClose, stakePositionId }: Props) {
  const account                         = useCurrentAccount()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()

  const [title, setTitle]               = useState('')
  const [description, setDescription]  = useState('')
  const [actionType, setActionType]     = useState(0)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState(false)

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const canSubmit =
    !!account &&
    !!stakePositionId &&
    title.trim().length > 5 &&
    description.trim().length > 20 &&
    !loading

  const handleSubmit = async () => {
    if (!canSubmit || !stakePositionId) return
    setLoading(true)
    setError(null)
    try {
      const tx = buildCreateProposalTx(title.trim(), description.trim(), actionType, stakePositionId)
      // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
      await signAndExecute({ transaction: tx })
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Proposal creation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setActionType(0)
    setError(null)
    setSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: 'linear-gradient(135deg, rgba(13,13,31,0.99), rgba(22,22,48,0.99))',
          border: '1px solid rgba(99,102,241,0.3)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Create Proposal</h2>
            <p className="text-xs text-slate-500 mt-0.5">Requires 10,000 OMNI voting power</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              ✓
            </div>
            <p className="text-white font-bold text-lg">Proposal Created!</p>
            <p className="text-sm text-slate-400 text-center">
              Your proposal is now live. The 7-day voting window has opened.
            </p>
            <button
              onClick={handleClose}
              className="rounded-xl px-6 py-2.5 text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', color: '#fff' }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short, descriptive title…"
                maxLength={120}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the rationale, expected impact, and any technical details…"
                rows={5}
                maxLength={2000}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none resize-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
              />
              <p className="text-xs text-slate-600 mt-1 text-right">{description.length}/2000</p>
            </div>

            {/* Action type */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Action Type</label>
              <div className="flex flex-col gap-2">
                {ACTION_TYPES.map((at) => (
                  <button
                    key={at.value}
                    onClick={() => setActionType(at.value)}
                    className="flex items-start gap-3 rounded-xl p-3 text-left transition-all"
                    style={
                      actionType === at.value
                        ? {
                            background: 'rgba(99,102,241,0.15)',
                            border: '1px solid rgba(99,102,241,0.4)',
                          }
                        : {
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                          }
                    }
                  >
                    <div
                      className="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{
                        background: actionType === at.value ? '#6366F1' : 'transparent',
                        border: `2px solid ${actionType === at.value ? '#6366F1' : '#334155'}`,
                      }}
                    >
                      {actionType === at.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{at.label}</p>
                      <p className="text-xs text-slate-500">{at.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* No position warning */}
            {!stakePositionId && (
              <div
                className="rounded-xl p-3 text-xs text-center"
                style={{ background: 'rgba(245,158,11,0.08)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                You need an active staking position with ≥ 10,000 OMNI to create proposals.
              </div>
            )}

            {error && (
              <div
                className="rounded-xl p-3 text-xs text-center"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full rounded-xl py-3.5 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', color: '#fff' }}
            >
              {loading
                ? 'Submitting…'
                : !account
                ? 'Connect Wallet'
                : 'Submit Proposal'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePointsStore } from '@/store/pointsStore'
import { pointsToOmni } from '@/lib/tokenomics'

// Season 1 snapshot date — TGE not yet live
const SEASON_1_SNAPSHOT = 'Q2 2025'
const TGE_LIVE = false

export function AirdropClaimCard() {
  const { totalPoints } = usePointsStore()
  const omniAmount = pointsToOmni(totalPoints)
  const [claimed, setClaimed] = useState(false)
  const [tooltip, setTooltip] = useState(false)

  function handleClaim() {
    if (!TGE_LIVE || claimed) return
    setClaimed(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-6 flex flex-col gap-5"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.95) 0%, rgba(13,13,31,0.98) 100%)',
        border: '1px solid rgba(99,102,241,0.35)',
        boxShadow: '0 0 40px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3
            className="text-base font-bold"
            style={{
              background: 'linear-gradient(135deg, #818CF8 0%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Airdrop Claim
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Season 1 — Snapshot {SEASON_1_SNAPSHOT}</p>
        </div>

        {/* OMNI coin icon */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-black"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(6,182,212,0.15))',
            border: '1px solid rgba(99,102,241,0.4)',
            color: '#818CF8',
          }}
        >
          Ω
        </div>
      </div>

      {/* Points earned */}
      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <p className="text-xs font-medium text-slate-500 mb-1">You earned</p>
        <p className="text-2xl font-black text-white">
          {totalPoints.toLocaleString()}{' '}
          <span className="text-sm font-semibold text-slate-400">pts</span>
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-px flex-1" style={{ background: 'rgba(99,102,241,0.2)' }} />
          <span className="text-xs text-slate-500">converts to</span>
          <div className="h-px flex-1" style={{ background: 'rgba(99,102,241,0.2)' }} />
        </div>
        <p
          className="mt-3 text-3xl font-black"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 50%, #06B6D4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {omniAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
          <span className="text-lg">OMNI</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">at 1,000 pts = 1 OMNI</p>
      </div>

      {/* Claim button */}
      <div className="relative">
        <button
          onClick={handleClaim}
          onMouseEnter={() => !TGE_LIVE && setTooltip(true)}
          onMouseLeave={() => setTooltip(false)}
          disabled={!TGE_LIVE || claimed || totalPoints === 0}
          className="w-full rounded-xl py-3.5 text-sm font-bold transition-all duration-200"
          style={
            TGE_LIVE && !claimed && totalPoints > 0
              ? {
                  background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                  color: '#fff',
                  boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
                }
              : {
                  background: 'rgba(255,255,255,0.05)',
                  color: '#64748b',
                  cursor: 'not-allowed',
                }
          }
        >
          {claimed
            ? 'Claimed!'
            : totalPoints === 0
            ? 'Earn points to claim'
            : TGE_LIVE
            ? `Claim ${omniAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} OMNI`
            : 'Coming at TGE'}
        </button>

        {/* Tooltip */}
        {tooltip && !TGE_LIVE && (
          <div
            className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap z-10"
            style={{
              background: 'rgba(15,15,35,0.95)',
              border: '1px solid rgba(99,102,241,0.3)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            Available at Token Generation Event
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
              style={{
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '5px solid rgba(99,102,241,0.3)',
              }}
            />
          </div>
        )}
      </div>

      {/* Rate info */}
      <p className="text-center text-xs text-slate-600">
        Rate locked at snapshot &middot; No wallet required to check balance
      </p>
    </motion.div>
  )
}

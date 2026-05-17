'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { TraderProfile } from '@/lib/social'
import { getPnlColor, fmtUSD, getTierColor, getTierLabel, timeAgo } from '@/lib/social'
import { useSocialStore } from '@/store/socialStore'
import { CopyConfigModal } from './CopyConfigModal'

// ─── Props ────────────────────────────────────────────────────────────────────

interface TraderCardProps {
  trader: TraderProfile
  index: number
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function TraderAvatar({ trader }: { trader: TraderProfile }) {
  const initials = trader.displayName.slice(0, 2).toUpperCase()
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
      style={{ background: `linear-gradient(135deg, ${trader.avatar}, ${trader.avatar}99)` }}
    >
      {initials}
    </div>
  )
}

// ─── Token badge ──────────────────────────────────────────────────────────────

function TokenBadge({ symbol }: { symbol: string }) {
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-md"
      style={{
        background: 'rgba(6,182,212,0.1)',
        color: '#67E8F9',
        border: '1px solid rgba(6,182,212,0.2)',
      }}
    >
      {symbol}
    </span>
  )
}

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: TraderProfile['tier'] }) {
  const color = getTierColor(tier)
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {getTierLabel(tier)}
    </span>
  )
}

// ─── Stat cell ────────────────────────────────────────────────────────────────

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold font-mono" style={{ color: color ?? '#E2E8F0' }}>
        {value}
      </p>
    </div>
  )
}

// ─── TraderCard ───────────────────────────────────────────────────────────────

export function TraderCard({ trader, index }: TraderCardProps) {
  const [configOpen, setConfigOpen] = useState(false)
  const { isFollowing, followTrader, unfollowTrader, isCopying } = useSocialStore()

  const following = isFollowing(trader.address)
  const copying = isCopying(trader.address)

  function handleFollowToggle() {
    if (following) {
      unfollowTrader(trader.address)
    } else {
      followTrader(trader.address)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
        className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        style={{
          background: 'rgba(13, 13, 31, 0.85)',
          border: '1px solid rgba(99,102,241,0.2)',
          backdropFilter: 'blur(16px)',
          boxShadow: following ? '0 0 0 1px rgba(99,102,241,0.4)' : undefined,
        }}
      >
        {/* Top section */}
        <div className="px-5 pt-5 pb-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <TraderAvatar trader={trader} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>
                    {trader.displayName}
                  </span>
                  {trader.isVerified && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-label="Verified">
                      <circle cx="12" cy="12" r="10" fill="#6366F1" opacity="0.9" />
                      <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-slate-500">
                    {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
                  </span>
                  <TierBadge tier={trader.tier} />
                </div>
              </div>
            </div>

            {/* Followers */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold font-mono" style={{ color: '#E2E8F0' }}>
                {trader.followers.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">followers</p>
            </div>
          </div>

          {/* Stats row */}
          <div
            className="grid grid-cols-4 gap-2 rounded-xl px-3 py-3 mb-4"
            style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}
          >
            <StatCell
              label="30d P&L"
              value={`${trader.pnlPercent >= 0 ? '+' : ''}${trader.pnlPercent.toFixed(1)}%`}
              color={getPnlColor(trader.pnlPercent)}
            />
            <StatCell
              label="Win Rate"
              value={`${trader.winRate}%`}
              color={trader.winRate >= 70 ? '#10B981' : trader.winRate >= 50 ? '#F59E0B' : '#EF4444'}
            />
            <StatCell label="Avg Trade" value={fmtUSD(trader.avgTradeSize)} />
            <StatCell label="Volume" value={fmtUSD(trader.totalVolume)} />
          </div>

          {/* Favorite tokens */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-slate-500">Trades:</span>
            {trader.favoriteTokens.map((t) => (
              <TokenBadge key={t} symbol={t} />
            ))}
          </div>

          {/* Recent trades */}
          <div className="space-y-1.5">
            {trader.recentTrades.slice(0, 3).map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between text-xs rounded-lg px-3 py-2"
                style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.08)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{trade.tokenIn}</span>
                  <span className="text-slate-600">→</span>
                  <span className="text-slate-400">{trade.tokenOut}</span>
                  <span className="text-slate-600">{fmtUSD(trade.amountInUsd)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono font-semibold"
                    style={{ color: getPnlColor(trade.pnlPercent) }}
                  >
                    {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(1)}%
                  </span>
                  <span className="text-slate-600">{timeAgo(trade.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action bar */}
        <div
          className="flex gap-3 px-5 pb-4"
          style={{ borderTop: '1px solid rgba(99,102,241,0.08)', paddingTop: '1rem' }}
        >
          <button
            onClick={handleFollowToggle}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200"
            style={
              following
                ? {
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    color: '#A5B4FC',
                  }
                : {
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#64748B',
                  }
            }
          >
            {following ? 'Following' : 'Follow'}
          </button>

          <button
            onClick={() => setConfigOpen(true)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
            style={
              copying
                ? {
                    background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                  }
                : {
                    background: 'rgba(6,182,212,0.08)',
                    border: '1px solid rgba(6,182,212,0.25)',
                    color: '#67E8F9',
                  }
            }
          >
            {copying ? 'Copying ✓' : 'Copy Trades'}
          </button>
        </div>
      </motion.div>

      <CopyConfigModal trader={trader} isOpen={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  )
}

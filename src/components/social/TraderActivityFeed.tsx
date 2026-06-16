'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TraderProfile, TraderTrade } from '@/lib/social'
import { getPnlColor, fmtUSD, timeAgo } from '@/lib/social'
import { useSocialStore } from '@/store/socialStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeedEntry {
  trade: TraderTrade
  trader: TraderProfile
  copyStatus: 'copied' | 'too_large' | 'not_copying' | 'not_following'
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TraderActivityFeedProps {
  traders: TraderProfile[]
}

// ─── Avatar (mini) ────────────────────────────────────────────────────────────

function MiniAvatar({ trader }: { trader: TraderProfile }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ background: `linear-gradient(135deg, ${trader.avatar}, ${trader.avatar}99)` }}
    >
      {trader.displayName.slice(0, 2).toUpperCase()}
    </div>
  )
}

// ─── Copy status pill ─────────────────────────────────────────────────────────

function CopyStatusPill({ status }: { status: FeedEntry['copyStatus'] }) {
  if (status === 'copied') {
    return (
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
        style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}
      >
        Copied ✓
      </span>
    )
  }
  if (status === 'too_large') {
    return (
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}
      >
        Too large
      </span>
    )
  }
  return null
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(99,102,241,0.1)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-400 mb-1">No activity yet</p>
      <p className="text-xs text-slate-600 text-center max-w-xs">
        Follow traders to see their live activity here
      </p>
    </div>
  )
}

// ─── Feed entry ───────────────────────────────────────────────────────────────

function FeedItem({ entry, index }: { entry: FeedEntry; index: number }) {
  const { trade, trader, copyStatus } = entry

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02]"
      style={{ borderBottom: '1px solid rgba(99,102,241,0.07)' }}
    >
      <MiniAvatar trader={trader} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium" style={{ color: '#E2E8F0' }}>
            {trader.displayName}
          </span>
          {trader.isVerified && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-label="Verified">
              <circle cx="12" cy="12" r="10" fill="#6366F1" opacity="0.9" />
              <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span className="text-xs text-slate-600 ml-auto flex-shrink-0">
            {timeAgo(trade.timestamp)}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Trade pair */}
          <div className="flex items-center gap-1.5 text-sm">
            <span
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#A5B4FC' }}
            >
              {trade.tokenIn}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{ background: 'rgba(6,182,212,0.1)', color: '#67E8F9' }}
            >
              {trade.tokenOut}
            </span>
          </div>

          {/* Amount */}
          <span className="text-xs font-mono text-slate-400">
            {fmtUSD(trade.amountInUsd)}
          </span>

          {/* P&L */}
          <span
            className="text-xs font-mono font-semibold"
            style={{ color: getPnlColor(trade.pnlPercent) }}
          >
            {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(1)}%
          </span>

          <CopyStatusPill status={copyStatus} />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TraderActivityFeed({ traders }: TraderActivityFeedProps) {
  const { followedTraders, copyConfigs } = useSocialStore()

  const feedEntries = useMemo<FeedEntry[]>(() => {
    // If nobody followed, show demo entries from first 3 traders
    const sourceTraders =
      followedTraders.length > 0
        ? traders.filter((t) => followedTraders.includes(t.address))
        : traders.slice(0, 3)

    const entries: FeedEntry[] = []
    for (const trader of sourceTraders) {
      const cfg = copyConfigs[trader.address]
      for (const trade of trader.recentTrades) {
        let copyStatus: FeedEntry['copyStatus'] = 'not_following'
        if (followedTraders.includes(trader.address)) {
          if (!cfg || !cfg.enabled) {
            copyStatus = 'not_copying'
          } else if (trade.amountInUsd * cfg.copyRatio > cfg.maxTradeSize) {
            copyStatus = 'too_large'
          } else {
            copyStatus = 'copied'
          }
        }
        entries.push({ trade, trader, copyStatus })
      }
    }

    // Sort newest first
    return entries.sort(
      (a, b) =>
        new Date(b.trade.timestamp).getTime() - new Date(a.trade.timestamp).getTime()
    )
  }, [traders, followedTraders, copyConfigs])

  const isEmpty = followedTraders.length === 0 && feedEntries.length === 0

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(13, 13, 31, 0.85)',
        border: '1px solid rgba(99,102,241,0.2)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.2)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>
            Activity Feed
          </h3>
        </div>
        {followedTraders.length === 0 && (
          <span
            className="text-xs px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            Demo data
          </span>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div>
            {feedEntries.map((entry, i) => (
              <FeedItem key={`${entry.trader.address}-${entry.trade.id}`} entry={entry} index={i} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

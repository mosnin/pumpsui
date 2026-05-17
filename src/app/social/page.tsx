'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { generateDemoTraders, fmtUSD, getPnlColor } from '@/lib/social'
import type { TraderProfile } from '@/lib/social'
import { useSocialStore } from '@/store/socialStore'
import { TraderCard } from '@/components/social/TraderCard'
import { TraderActivityFeed } from '@/components/social/TraderActivityFeed'
import { LeaderboardTable } from '@/components/social/LeaderboardTable'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'discover' | 'following' | 'copy-trading'
type FilterSort = 'all' | 'top-pnl' | 'high-volume' | 'win-rate'

// ─── Static data ─────────────────────────────────────────────────────────────

const ALL_TRADERS = generateDemoTraders()

// ─── Subcomponents ────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'discover',
      label: 'Discover',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      ),
    },
    {
      id: 'following',
      label: 'Following',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
    {
      id: 'copy-trading',
      label: 'Copy Trading',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 3 21 3 21 8" />
          <line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21 16 21 21 16 21" />
          <line x1="15" y1="15" x2="21" y2="21" />
        </svg>
      ),
    },
  ]

  return (
    <div
      className="flex items-center gap-1 rounded-xl p-1"
      style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          style={
            active === tab.id
              ? {
                  background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
                }
              : { color: '#64748B' }
          }
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function FilterBar({
  active,
  onChange,
}: {
  active: FilterSort
  onChange: (f: FilterSort) => void
}) {
  const filters: { id: FilterSort; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'top-pnl', label: 'Top P&L' },
    { id: 'high-volume', label: 'High Volume' },
    { id: 'win-rate', label: 'Best Win Rate' },
  ]
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
          style={
            active === f.id
              ? {
                  background: 'rgba(99,102,241,0.2)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  color: '#A5B4FC',
                }
              : {
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(99,102,241,0.1)',
                  color: '#64748B',
                }
          }
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar() {
  const { followedTraders, copyConfigs } = useSocialStore()
  const copyingCount = Object.values(copyConfigs).filter((c) => c.enabled).length
  const totalDailyLimit = Object.values(copyConfigs)
    .filter((c) => c.enabled)
    .reduce((sum, c) => sum + c.maxDailyVolume, 0)

  const stats = [
    { label: 'Top Traders', value: ALL_TRADERS.length.toString() },
    { label: 'Following', value: followedTraders.length.toString() },
    { label: 'Copy Trading', value: copyingCount.toString() },
    { label: 'Daily Limit', value: fmtUSD(totalDailyLimit) },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl px-4 py-3 text-center"
          style={{
            background: 'rgba(13, 13, 31, 0.85)',
            border: '1px solid rgba(99,102,241,0.15)',
          }}
        >
          <p className="text-lg font-bold font-mono" style={{ color: '#E2E8F0' }}>{s.value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Copy Trading summary card ────────────────────────────────────────────────

function CopyTradingCard({ trader }: { trader: TraderProfile }) {
  const { copyConfigs, toggleCopyTrading, isCopying } = useSocialStore()
  const cfg = copyConfigs[trader.address]
  const copying = isCopying(trader.address)

  if (!cfg) return null

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'rgba(13, 13, 31, 0.85)',
        border: copying ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(99,102,241,0.15)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${trader.avatar}, ${trader.avatar}99)` }}
          >
            {trader.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>{trader.displayName}</p>
            <p className="text-xs text-slate-500">{trader.address.slice(0, 6)}...{trader.address.slice(-4)}</p>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => toggleCopyTrading(trader.address)}
          className="relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none"
          style={{
            background: copying
              ? 'linear-gradient(135deg, #6366F1, #06B6D4)'
              : 'rgba(99,102,241,0.2)',
          }}
          aria-label={`Toggle copy trading for ${trader.displayName}`}
          aria-pressed={copying}
        >
          <span
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
            style={{ transform: copying ? 'translateX(20px)' : 'translateX(2px)' }}
          />
        </button>
      </div>

      {/* Config summary */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}
        >
          <p className="text-xs text-slate-500 mb-0.5">Copy Ratio</p>
          <p className="text-sm font-bold font-mono" style={{ color: '#A5B4FC' }}>
            {Math.round(cfg.copyRatio * 100)}%
          </p>
        </div>
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}
        >
          <p className="text-xs text-slate-500 mb-0.5">Max Trade</p>
          <p className="text-sm font-bold font-mono" style={{ color: '#06B6D4' }}>
            {fmtUSD(cfg.maxTradeSize)}
          </p>
        </div>
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}
        >
          <p className="text-xs text-slate-500 mb-0.5">Daily Limit</p>
          <p className="text-sm font-bold font-mono" style={{ color: '#E2E8F0' }}>
            {fmtUSD(cfg.maxDailyVolume)}
          </p>
        </div>
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}
        >
          <p className="text-xs text-slate-500 mb-0.5">Slippage</p>
          <p className="text-sm font-bold font-mono" style={{ color: '#E2E8F0' }}>
            {(cfg.slippageBps / 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Trader perf */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">30d P&L</span>
        <span
          className="text-sm font-bold font-mono"
          style={{ color: getPnlColor(trader.pnlPercent) }}
        >
          {trader.pnlPercent >= 0 ? '+' : ''}{trader.pnlPercent.toFixed(1)}%
        </span>
      </div>

      {copying && (
        <div
          className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <span className="text-emerald-400 text-xs">●</span>
          <span className="text-xs text-emerald-300">Active — copying trades automatically</span>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState<Tab>('discover')
  const [filterSort, setFilterSort] = useState<FilterSort>('all')
  const { followedTraders, copyConfigs } = useSocialStore()

  // Filter & sort for Discover tab
  const filteredTraders = useMemo<TraderProfile[]>(() => {
    let list = [...ALL_TRADERS]
    switch (filterSort) {
      case 'top-pnl':
        list.sort((a, b) => b.pnlPercent - a.pnlPercent)
        break
      case 'high-volume':
        list.sort((a, b) => b.totalVolume - a.totalVolume)
        break
      case 'win-rate':
        list.sort((a, b) => b.winRate - a.winRate)
        break
      default:
        break
    }
    return list
  }, [filterSort])

  const followedProfiles = useMemo<TraderProfile[]>(
    () => ALL_TRADERS.filter((t) => followedTraders.includes(t.address)),
    [followedTraders]
  )

  const copyingProfiles = useMemo<TraderProfile[]>(
    () =>
      ALL_TRADERS.filter(
        (t) => followedTraders.includes(t.address) && copyConfigs[t.address]
      ),
    [followedTraders, copyConfigs]
  )

  return (
    <div className="min-h-screen font-sans" style={{ background: '#060611', color: '#E2E8F0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.2)', color: '#6366F1' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#E2E8F0' }}>
                  Social Trading
                </h1>
                <p className="text-slate-400 text-sm">Copy top traders automatically</p>
              </div>
            </div>

            {/* Demo banner */}
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-2"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <span className="text-amber-400 text-xs">⚠</span>
              <span className="text-xs text-amber-300/90">Demo data — live after deployment</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <StatsBar />

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto pb-1">
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>

        {/* ── Discover tab ──────────────────────────────────────────────────── */}
        {activeTab === 'discover' && (
          <motion.div
            key="discover"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-5">
              <FilterBar active={filterSort} onChange={setFilterSort} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trader cards */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredTraders.map((trader, i) => (
                  <TraderCard key={trader.address} trader={trader} index={i} />
                ))}
              </div>

              {/* Activity feed sidebar */}
              <div className="lg:col-span-1">
                <TraderActivityFeed traders={ALL_TRADERS} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Following tab ─────────────────────────────────────────────────── */}
        {activeTab === 'following' && (
          <motion.div
            key="following"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {followedProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(99,102,241,0.1)' }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-slate-300 mb-1">No traders followed yet</p>
                <p className="text-sm text-slate-500 mb-6">Go to Discover to find top traders</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                  }}
                >
                  Discover Traders
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Grid of followed cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {followedProfiles.map((trader, i) => (
                    <TraderCard key={trader.address} trader={trader} index={i} />
                  ))}
                </div>

                {/* Activity feed below */}
                <TraderActivityFeed traders={ALL_TRADERS} />
              </div>
            )}
          </motion.div>
        )}

        {/* ── Copy Trading tab ──────────────────────────────────────────────── */}
        {activeTab === 'copy-trading' && (
          <motion.div
            key="copy-trading"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Warning */}
            <div
              className="mb-6 flex items-start gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <span className="text-amber-400 mt-0.5">⚠</span>
              <p className="text-sm text-amber-300/90">
                Copy trading does not guarantee profits. Past performance is not indicative of future results.
                Always do your own research.
              </p>
            </div>

            {copyingProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(99,102,241,0.1)' }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5">
                    <polyline points="16 3 21 3 21 8" />
                    <line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" />
                    <line x1="15" y1="15" x2="21" y2="21" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-slate-300 mb-1">No copy configs yet</p>
                <p className="text-sm text-slate-500 mb-6">Click &quot;Copy Trades&quot; on any trader card to get started</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                  }}
                >
                  Discover Traders
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {copyingProfiles.map((trader) => (
                  <CopyTradingCard key={trader.address} trader={trader} />
                ))}
              </div>
            )}

            {/* Leaderboard table */}
            {copyingProfiles.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#E2E8F0' }}>
                  All Traders Leaderboard
                </h2>
                <LeaderboardTable traders={ALL_TRADERS} />
              </div>
            )}
          </motion.div>
        )}

        {/* Leaderboard table always visible on discover tab at the bottom */}
        {activeTab === 'discover' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="mt-8"
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#E2E8F0' }}>
              Full Leaderboard
            </h2>
            <LeaderboardTable traders={ALL_TRADERS} />
          </motion.div>
        )}
      </div>
    </div>
  )
}

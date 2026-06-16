'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { TraderProfile } from '@/lib/social'
import { getPnlColor, fmtUSD, getTierColor } from '@/lib/social'
import { useSocialStore } from '@/store/socialStore'
import { CopyConfigModal } from './CopyConfigModal'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'index' | 'pnlPercent' | 'winRate' | 'totalVolume' | 'followers'
type SortDir = 'asc' | 'desc'

interface LeaderboardTableProps {
  traders: TraderProfile[]
  connectedAddress?: string
}

const PAGE_SIZE = 10

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600">
        <path d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
      </svg>
    )
  }
  return dir === 'asc' ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
      <path d="M8 15l4-6 4 6" />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
      <path d="M8 9l4 6 4-6" />
    </svg>
  )
}

// ─── Sortable TH ──────────────────────────────────────────────────────────────

function SortTH({
  label,
  sortKey,
  active,
  dir,
  onSort,
  right,
}: {
  label: string
  sortKey: SortKey
  active: boolean
  dir: SortDir
  onSort: (k: SortKey) => void
  right?: boolean
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-slate-300 ${right ? 'text-right' : 'text-left'}`}
      style={{ color: active ? '#A5B4FC' : '#475569' }}
      onClick={() => onSort(sortKey)}
    >
      <span className={`inline-flex items-center gap-1.5 ${right ? 'flex-row-reverse' : ''}`}>
        {label}
        <SortIcon active={active} dir={dir} />
      </span>
    </th>
  )
}

// ─── Rank badge ───────────────────────────────────────────────────────────────

function RankCell({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base" aria-label="1st">🥇</span>
  if (rank === 2) return <span className="text-base" aria-label="2nd">🥈</span>
  if (rank === 3) return <span className="text-base" aria-label="3rd">🥉</span>
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-slate-400"
      style={{ background: 'rgba(99,102,241,0.1)' }}
    >
      {rank}
    </span>
  )
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function MobileCard({
  trader,
  rank,
  isCurrentUser,
  onCopy,
  following,
  copying,
  onFollow,
  onUnfollow,
}: {
  trader: TraderProfile
  rank: number
  isCurrentUser: boolean
  onCopy: () => void
  following: boolean
  copying: boolean
  onFollow: () => void
  onUnfollow: () => void
}) {
  const tierColor = getTierColor(trader.tier)
  return (
    <div
      className="rounded-xl px-4 py-3.5 space-y-2"
      style={{
        background: isCurrentUser ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.03)',
        border: isCurrentUser ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(99,102,241,0.1)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <RankCell rank={rank} />
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${trader.avatar}, ${trader.avatar}99)` }}
          >
            {trader.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium" style={{ color: '#E2E8F0' }}>{trader.displayName}</span>
              {trader.isVerified && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#6366F1" opacity="0.9" />
                  <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-xs font-mono text-slate-500">
              {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
            </span>
          </div>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ color: getPnlColor(trader.pnlPercent), background: `${getPnlColor(trader.pnlPercent)}15` }}
        >
          {trader.pnlPercent >= 0 ? '+' : ''}{trader.pnlPercent.toFixed(1)}%
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        <div>
          <p className="text-xs text-slate-500">Win Rate</p>
          <p className="text-xs font-semibold font-mono" style={{ color: '#E2E8F0' }}>{trader.winRate}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Volume</p>
          <p className="text-xs font-semibold font-mono" style={{ color: '#E2E8F0' }}>{fmtUSD(trader.totalVolume)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Tier</p>
          <p className="text-xs font-semibold" style={{ color: tierColor }}>{trader.tier.charAt(0).toUpperCase() + trader.tier.slice(1)}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={following ? onUnfollow : onFollow}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={
            following
              ? { background: 'rgba(99,102,241,0.15)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.3)' }
              : { background: 'rgba(99,102,241,0.07)', color: '#64748B', border: '1px solid rgba(99,102,241,0.15)' }
          }
        >
          {following ? 'Following' : 'Follow'}
        </button>
        <button
          onClick={onCopy}
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={
            copying
              ? { background: 'linear-gradient(135deg,#6366F1,#06B6D4)', color: '#fff' }
              : { background: 'rgba(6,182,212,0.08)', color: '#67E8F9', border: '1px solid rgba(6,182,212,0.2)' }
          }
        >
          {copying ? 'Copying ✓' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-4" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 rounded-lg text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ← Prev
      </button>
      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
            style={
              p === page
                ? { background: 'linear-gradient(135deg,#6366F1,#06B6D4)', color: '#fff' }
                : { color: '#64748B' }
            }
          >
            {p}
          </button>
        ))}
      </div>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 rounded-lg text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  )
}

// ─── Main Table ───────────────────────────────────────────────────────────────

export function LeaderboardTable({ traders, connectedAddress }: LeaderboardTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('index')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [copyModalTrader, setCopyModalTrader] = useState<TraderProfile | null>(null)

  const { isFollowing, followTrader, unfollowTrader, isCopying } = useSocialStore()

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  const sorted = useMemo<TraderProfile[]>(() => {
    if (sortKey === 'index') {
      // Default order from the input array
      const base = [...traders]
      return sortDir === 'asc' ? base.reverse() : base
    }
    const key = sortKey satisfies Exclude<SortKey, 'index'>
    return [...traders].sort((a, b) => {
      const aVal = a[key] as number
      const bVal = b[key] as number
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })
  }, [traders, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const sortedWithRank = sorted.map((t, i) => ({ ...t, computedRank: i + 1 }))
  const pagedWithRank = sortedWithRank.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(13, 13, 31, 0.85)',
          border: '1px solid rgba(99,102,241,0.2)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                <SortTH label="Rank"     sortKey="index"       active={sortKey === 'index'}       dir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-left text-slate-500">Trader</th>
                <SortTH label="30d P&L"  sortKey="pnlPercent"  active={sortKey === 'pnlPercent'}  dir={sortDir} onSort={handleSort} right />
                <SortTH label="Win Rate" sortKey="winRate"     active={sortKey === 'winRate'}     dir={sortDir} onSort={handleSort} right />
                <SortTH label="Volume"   sortKey="totalVolume" active={sortKey === 'totalVolume'} dir={sortDir} onSort={handleSort} right />
                <SortTH label="Followers" sortKey="followers"  active={sortKey === 'followers'}   dir={sortDir} onSort={handleSort} right />
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-right text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedWithRank.map((trader, i) => {
                const isCurrentUser = !!connectedAddress && trader.address === connectedAddress
                const following = isFollowing(trader.address)
                const copying = isCopying(trader.address)
                return (
                  <motion.tr
                    key={trader.address}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className="transition-colors hover:bg-white/[0.025]"
                    style={{
                      borderBottom: i < paged.length - 1 ? '1px solid rgba(99,102,241,0.07)' : 'none',
                      background: isCurrentUser ? 'rgba(99,102,241,0.05)' : undefined,
                    }}
                  >
                    <td className="px-4 py-3.5">
                      <RankCell rank={trader.computedRank} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${trader.avatar}, ${trader.avatar}99)` }}
                        >
                          {trader.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium" style={{ color: '#E2E8F0' }}>{trader.displayName}</span>
                            {trader.isVerified && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" fill="#6366F1" opacity="0.9" />
                                <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className="text-xs font-mono text-slate-500">
                            {trader.address.slice(0, 6)}...{trader.address.slice(-4)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold">
                      <span style={{ color: getPnlColor(trader.pnlPercent) }}>
                        {trader.pnlPercent >= 0 ? '+' : ''}{trader.pnlPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono" style={{ color: '#E2E8F0' }}>
                      {trader.winRate}%
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono" style={{ color: '#E2E8F0' }}>
                      {fmtUSD(trader.totalVolume)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-400">
                      {trader.followers.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => following ? unfollowTrader(trader.address) : followTrader(trader.address)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={
                            following
                              ? { background: 'rgba(99,102,241,0.15)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.3)' }
                              : { background: 'rgba(99,102,241,0.07)', color: '#64748B', border: '1px solid rgba(99,102,241,0.15)' }
                          }
                        >
                          {following ? 'Following' : 'Follow'}
                        </button>
                        <button
                          onClick={() => setCopyModalTrader(trader)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={
                            copying
                              ? { background: 'linear-gradient(135deg,#6366F1,#06B6D4)', color: '#fff' }
                              : { background: 'rgba(6,182,212,0.08)', color: '#67E8F9', border: '1px solid rgba(6,182,212,0.2)' }
                          }
                        >
                          {copying ? 'Copying ✓' : 'Copy'}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden space-y-2 p-3">
          {pagedWithRank.map((trader) => {
            const isCurrentUser = !!connectedAddress && trader.address === connectedAddress
            const following = isFollowing(trader.address)
            const copying = isCopying(trader.address)
            return (
              <MobileCard
                key={trader.address}
                trader={trader}
                rank={trader.computedRank}
                isCurrentUser={isCurrentUser}
                following={following}
                copying={copying}
                onCopy={() => setCopyModalTrader(trader)}
                onFollow={() => followTrader(trader.address)}
                onUnfollow={() => unfollowTrader(trader.address)}
              />
            )
          })}
        </div>

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      {copyModalTrader && (
        <CopyConfigModal
          trader={copyModalTrader}
          isOpen={!!copyModalTrader}
          onClose={() => setCopyModalTrader(null)}
        />
      )}
    </>
  )
}

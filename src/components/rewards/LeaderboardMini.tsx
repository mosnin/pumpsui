'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { getTierForPoints } from '@/store/pointsStore'

interface LeaderEntry {
  rank: number
  address: string
  points: number
  isYou?: boolean
}

// Static demo leaderboard — in production this would come from an indexer
const MOCK_LEADERS: LeaderEntry[] = [
  { rank: 1, address: '0x1a2b…dead', points: 48_320 },
  { rank: 2, address: '0xc0ff…ee42', points: 35_100 },
  { rank: 3, address: '0xface…b00c', points: 27_840 },
  { rank: 4, address: '0xdead…beef', points: 19_200 },
  { rank: 5, address: '0x0000…1337', points: 14_750 },
]

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function AddressDisplay({ addr }: { addr: string }) {
  return (
    <span className="font-mono text-sm text-slate-300">
      {addr.length > 14 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr}
    </span>
  )
}

interface LeaderboardMiniProps {
  userPoints?: number
  userAddress?: string
}

export function LeaderboardMini({ userPoints, userAddress }: LeaderboardMiniProps) {
  // Inject the current user if they're not in the mock top-5
  const entries: LeaderEntry[] = MOCK_LEADERS.map((e) => ({
    ...e,
    isYou: userAddress
      ? e.address.toLowerCase() === userAddress.toLowerCase()
      : false,
  }))

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
        border: '1px solid rgba(42,42,90,0.6)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(42,42,90,0.4)' }}
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
            <path d="M8 6H5a1 1 0 00-1 1v10a1 1 0 001 1h3M16 6h3a1 1 0 011 1v10a1 1 0 01-1 1h-3" />
            <rect x="8" y="2" width="8" height="20" rx="1" />
          </svg>
          <span className="font-bold text-white text-sm">Season 1 Leaderboard</span>
        </div>
        <Link
          href="/leaderboard"
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
        >
          View all
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#2A2A5A]/30">
        {entries.map((entry, i) => {
          const tier = getTierForPoints(entry.points)
          return (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="flex items-center gap-3 px-5 py-3"
              style={
                entry.isYou
                  ? { background: 'rgba(99,102,241,0.08)', borderLeft: '2px solid #6366F1' }
                  : {}
              }
            >
              {/* Rank */}
              <div className="w-8 flex-shrink-0 flex items-center justify-center">
                {RANK_MEDALS[entry.rank] ? (
                  <span className="text-base">{RANK_MEDALS[entry.rank]}</span>
                ) : (
                  <span className="text-sm font-bold text-slate-500">#{entry.rank}</span>
                )}
              </div>

              {/* Address + tier dot */}
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <AddressDisplay addr={entry.address} />
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: tier.color }}
                  title={tier.name}
                />
                {entry.isYou && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{ background: '#6366F120', color: '#818CF8' }}
                  >
                    You
                  </span>
                )}
              </div>

              {/* Points */}
              <span className="text-sm font-bold text-amber-400 flex-shrink-0 tabular-nums">
                {entry.points.toLocaleString()}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* User's own rank if not in top 5 */}
      {userPoints !== undefined && !entries.some((e) => e.isYou) && (
        <div
          className="flex items-center gap-3 px-5 py-3"
          style={{
            borderTop: '1px solid rgba(42,42,90,0.4)',
            background: 'rgba(99,102,241,0.06)',
          }}
        >
          <div className="w-8 text-center">
            <span className="text-sm font-bold text-slate-500">#—</span>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <span className="font-mono text-sm text-slate-300">
              {userAddress ? `${userAddress.slice(0, 6)}…${userAddress.slice(-4)}` : 'You'}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ background: '#6366F120', color: '#818CF8' }}
            >
              You
            </span>
          </div>
          <span className="text-sm font-bold text-amber-400 tabular-nums">
            {userPoints.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  )
}

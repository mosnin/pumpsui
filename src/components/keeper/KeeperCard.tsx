'use client'

import Link from 'next/link'
import { KeeperBot } from '@/lib/keeper'

interface KeeperCardProps {
  keeper: KeeperBot
}

function StatusDot({ status }: { status: KeeperBot['status'] }) {
  const config = {
    online: { color: '#22C55E', label: 'Online', pulse: true },
    offline: { color: '#EF4444', label: 'Offline', pulse: false },
    syncing: { color: '#F59E0B', label: 'Syncing', pulse: true },
  }[status]

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
            style={{ backgroundColor: config.color }}
          />
        )}
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: config.color }}
        />
      </span>
      <span className="text-xs font-medium" style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  )
}

function ReputationBar({ score }: { score: number }) {
  const color = score >= 90 ? '#22C55E' : score >= 70 ? '#F59E0B' : '#EF4444'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: '#64748B' }}>Reputation</span>
        <span className="text-xs font-semibold" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-1.5 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function shortenAddress(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function KeeperCard({ keeper }: KeeperCardProps) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-4 transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(99,102,241,0.12)',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            🤖
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#E2E8F0' }}>
              {keeper.name}
            </p>
            <p className="text-xs font-mono truncate" style={{ color: '#475569' }}>
              {shortenAddress(keeper.address)}
            </p>
          </div>
        </div>
        <StatusDot status={keeper.status} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-3 flex flex-col gap-0.5"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}
        >
          <p className="text-xs" style={{ color: '#64748B' }}>Executions</p>
          <p className="text-sm font-bold" style={{ color: '#E2E8F0' }}>
            {keeper.totalExecutions.toLocaleString()}
          </p>
        </div>
        <div
          className="rounded-xl p-3 flex flex-col gap-0.5"
          style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.1)' }}
        >
          <p className="text-xs" style={{ color: '#64748B' }}>Earned</p>
          <p className="text-sm font-bold" style={{ color: '#06B6D4' }}>
            {keeper.totalEarnedSui.toFixed(1)} SUI
          </p>
        </div>
        <div
          className="rounded-xl p-3 flex flex-col gap-0.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs" style={{ color: '#64748B' }}>Uptime</p>
          <p className="text-sm font-bold" style={{ color: '#E2E8F0' }}>
            {keeper.uptimePercent.toFixed(1)}%
          </p>
        </div>
        <div
          className="rounded-xl p-3 flex flex-col gap-0.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs" style={{ color: '#64748B' }}>In Queue</p>
          <p className="text-sm font-bold" style={{ color: '#E2E8F0' }}>
            {keeper.ordersInQueue} orders
          </p>
        </div>
      </div>

      {/* Reputation bar */}
      <ReputationBar score={keeper.reputationScore} />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: '#334155' }}>
          Joined {new Date(keeper.joinedAt).toLocaleDateString()}
        </p>
        <Link
          href={`/keepers/${keeper.id}`}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105"
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            color: '#818CF8',
          }}
        >
          View Details
        </Link>
      </div>
    </div>
  )
}

'use client'

import { TrendingUp, TrendingDown, BarChart2, Trophy, Target, Zap } from 'lucide-react'
import type { PortfolioStats } from '@/lib/portfolio'

function fmtUsd(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

function fmtPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

interface StatCardProps {
  label: string
  value: string
  sub?: string
  positive?: boolean
  negative?: boolean
  neutral?: boolean
  icon: React.ReactNode
}

function StatCard({ label, value, sub, positive, negative, neutral, icon }: StatCardProps) {
  const valueColor = positive
    ? '#10B981'
    : negative
      ? '#EF4444'
      : neutral
        ? '#E2E8F0'
        : '#E2E8F0'

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{
        background: 'rgba(13, 13, 31, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}
        >
          {icon}
        </span>
      </div>

      <p className="text-xl font-bold leading-none" style={{ color: valueColor }}>
        {value}
      </p>

      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

interface PnLStatsProps {
  stats: PortfolioStats
}

export function PnLStats({ stats }: PnLStatsProps) {
  const cards: StatCardProps[] = [
    {
      label: 'Total P&L',
      value:
        (stats.totalPnlUsd >= 0 ? '+' : '') +
        fmtUsd(stats.totalPnlUsd),
      sub: fmtPct(stats.totalPnlPercent) + ' all time',
      positive: stats.totalPnlUsd >= 0,
      negative: stats.totalPnlUsd < 0,
      icon: <TrendingUp size={14} />,
    },
    {
      label: '24h P&L',
      value: (stats.dayPnlUsd >= 0 ? '+' : '') + fmtUsd(stats.dayPnlUsd),
      sub: 'vs yesterday',
      positive: stats.dayPnlUsd >= 0,
      negative: stats.dayPnlUsd < 0,
      icon: <Zap size={14} />,
    },
    {
      label: '7d P&L',
      value: (stats.weekPnlUsd >= 0 ? '+' : '') + fmtUsd(stats.weekPnlUsd),
      sub: 'last 7 days',
      positive: stats.weekPnlUsd >= 0,
      negative: stats.weekPnlUsd < 0,
      icon: <BarChart2 size={14} />,
    },
    {
      label: '30d P&L',
      value: (stats.monthPnlUsd >= 0 ? '+' : '') + fmtUsd(stats.monthPnlUsd),
      sub: 'last 30 days',
      positive: stats.monthPnlUsd >= 0,
      negative: stats.monthPnlUsd < 0,
      icon: stats.monthPnlUsd >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />,
    },
    {
      label: 'Win Rate',
      value: `${stats.winRate.toFixed(1)}%`,
      sub: `${stats.totalTrades} total trades`,
      positive: stats.winRate >= 50,
      negative: stats.winRate < 50,
      icon: <Trophy size={14} />,
    },
    {
      label: 'Avg Trade',
      value: fmtUsd(stats.avgTradeSize),
      sub: 'average trade size',
      neutral: true,
      icon: <Target size={14} />,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}

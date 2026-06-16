'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'
import type { PortfolioSnapshot } from '@/lib/portfolio'

type Period = '7D' | '30D' | '90D'

const PERIOD_DAYS: Record<Period, number> = {
  '7D': 7,
  '30D': 30,
  '90D': 90,
}

interface ChartDataPoint {
  date: string
  value: number
  rawTimestamp: number
}

function fmtUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  if (value >= 1) return `$${value.toFixed(2)}`
  return `$${value.toFixed(4)}`
}

function fmtDate(isoStr: string): string {
  const d = new Date(isoStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function CustomTooltip({
  active,
  payload,
  label,
  periodStart,
}: TooltipProps<ValueType, NameType> & { periodStart: number }) {
  if (!active || !payload?.length) return null
  const value = Number(payload[0]?.value ?? 0)
  const pnl = value - periodStart
  const pnlPct = periodStart > 0 ? (pnl / periodStart) * 100 : 0
  const isPositive = pnl >= 0

  return (
    <div
      className="rounded-xl p-4 text-sm shadow-xl"
      style={{
        background: 'rgba(13, 13, 31, 0.95)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p className="font-semibold mb-2" style={{ color: '#E2E8F0' }}>
        {label}
      </p>
      <p className="text-slate-400 mb-1">
        Value:{' '}
        <span className="font-medium" style={{ color: '#E2E8F0' }}>
          {fmtUsd(value)}
        </span>
      </p>
      <p style={{ color: isPositive ? '#10B981' : '#EF4444' }}>
        {isPositive ? '+' : ''}
        {fmtUsd(pnl)} ({isPositive ? '+' : ''}
        {pnlPct.toFixed(2)}%)
      </p>
    </div>
  )
}

interface PortfolioChartProps {
  history: PortfolioSnapshot[]
}

export function PortfolioChart({ history }: PortfolioChartProps) {
  const [period, setPeriod] = useState<Period>('30D')

  const chartData = useMemo((): ChartDataPoint[] => {
    const days = PERIOD_DAYS[period]
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    return history
      .filter((s) => new Date(s.timestamp).getTime() >= cutoff)
      .map((s) => ({
        date: fmtDate(s.timestamp),
        value: s.totalValueUsd,
        rawTimestamp: new Date(s.timestamp).getTime(),
      }))
  }, [history, period])

  const periodStart = chartData[0]?.value ?? 0
  const periodEnd = chartData[chartData.length - 1]?.value ?? 0
  const pnl = periodEnd - periodStart
  const pnlPct = periodStart > 0 ? (pnl / periodStart) * 100 : 0
  const isPositive = pnl >= 0

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(13, 13, 31, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ borderColor: 'rgba(99,102,241,0.15)' }}
      >
        <div>
          <h2 className="font-semibold mb-1" style={{ color: '#E2E8F0' }}>
            Portfolio Value
          </h2>
          <p
            className="text-lg font-bold"
            style={{ color: isPositive ? '#10B981' : '#EF4444' }}
          >
            {isPositive ? '+' : ''}
            {fmtUsd(pnl)}{' '}
            <span className="text-sm font-medium">
              ({isPositive ? '+' : ''}
              {pnlPct.toFixed(2)}%)
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{period} period</p>
        </div>

        {/* Period selector */}
        <div
          className="flex items-center gap-1 p-1 rounded-lg"
          style={{ background: 'rgba(99,102,241,0.08)' }}
        >
          {(['7D', '30D', '90D'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={
                period === p
                  ? {
                      background: '#6366F1',
                      color: '#fff',
                    }
                  : { color: '#64748b' }
              }
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 py-4">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(99,102,241,0.1)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(99,102,241,0.2)' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v: number) => fmtUsd(v)}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={72}
            />

            <Tooltip
              content={(props) => (
                <CustomTooltip {...props} periodStart={periodStart} />
              )}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366F1"
              strokeWidth={2.5}
              fill="url(#portfolioGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

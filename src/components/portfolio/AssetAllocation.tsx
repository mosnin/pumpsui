'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { TooltipProps } from 'recharts'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'
import type { PortfolioSnapshot } from '@/lib/portfolio'

const TOKEN_COLORS: Record<string, string> = {
  SUI: '#6366F1',
  USDC: '#10B981',
  USDT: '#26A17B',
  WETH: '#8B5CF6',
  WBTC: '#F59E0B',
  CETUS: '#06B6D4',
  TURBOS: '#EF4444',
  DEEP: '#3B82F6',
  AFT: '#F97316',
  NAVX: '#EC4899',
}

function tokenColor(symbol: string): string {
  return TOKEN_COLORS[symbol] ?? '#6366F1'
}

function fmtUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  if (value >= 1) return `$${value.toFixed(2)}`
  return `$${value.toFixed(4)}`
}

interface PieEntry {
  name: string
  value: number
  amount: number
  pct: number
}

function CustomTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null
  const entry = (payload[0] as { payload: PieEntry }).payload

  return (
    <div
      className="rounded-xl p-3 text-sm shadow-xl"
      style={{
        background: 'rgba(13, 13, 31, 0.95)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: tokenColor(entry.name) }}
        />
        <span className="font-semibold" style={{ color: '#E2E8F0' }}>
          {entry.name}
        </span>
      </div>
      <p className="text-slate-400 text-xs">
        Value:{' '}
        <span className="text-slate-200 font-medium">{fmtUsd(entry.value)}</span>
      </p>
      <p className="text-slate-400 text-xs">
        Allocation:{' '}
        <span className="text-slate-200 font-medium">{entry.pct.toFixed(1)}%</span>
      </p>
    </div>
  )
}

interface AssetAllocationProps {
  latestSnapshot: PortfolioSnapshot | null
}

export function AssetAllocation({ latestSnapshot }: AssetAllocationProps) {
  const holdings = latestSnapshot?.holdings ?? {}
  const total = Object.values(holdings).reduce((s, h) => s + h.valueUsd, 0)

  const pieData: PieEntry[] = Object.entries(holdings)
    .map(([symbol, h]) => ({
      name: symbol,
      value: h.valueUsd,
      amount: h.amount,
      pct: total > 0 ? (h.valueUsd / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)

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
        className="px-5 py-4 border-b"
        style={{ borderColor: 'rgba(99,102,241,0.15)' }}
      >
        <h2 className="font-semibold text-sm" style={{ color: '#E2E8F0' }}>
          Asset Allocation
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Total: {fmtUsd(total)}
        </p>
      </div>

      {/* Donut chart */}
      {pieData.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
          No holdings data
        </div>
      ) : (
        <>
          <div className="py-2">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius="52%"
                  outerRadius="72%"
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={tokenColor(entry.name)}
                      opacity={0.85}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Holdings table */}
          <div
            className="border-t"
            style={{ borderColor: 'rgba(99,102,241,0.12)' }}
          >
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                  {['Token', 'Amount', 'Value', 'Alloc'].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 font-medium uppercase tracking-wider text-slate-500 ${
                        h === 'Token' ? 'text-left' : 'text-right'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pieData.map((entry, i) => (
                  <tr
                    key={entry.name}
                    className="hover:bg-white/[0.025] transition-colors"
                    style={{
                      borderBottom:
                        i < pieData.length - 1
                          ? '1px solid rgba(99,102,241,0.07)'
                          : 'none',
                    }}
                  >
                    {/* Token */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: tokenColor(entry.name) }}
                        />
                        <span className="font-semibold" style={{ color: '#E2E8F0' }}>
                          {entry.name}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-2.5 text-right font-mono text-slate-400">
                      {entry.amount >= 1_000
                        ? `${(entry.amount / 1_000).toFixed(1)}K`
                        : entry.amount.toFixed(2)}
                    </td>

                    {/* Value */}
                    <td className="px-4 py-2.5 text-right font-mono" style={{ color: '#E2E8F0' }}>
                      {fmtUsd(entry.value)}
                    </td>

                    {/* Allocation */}
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 h-1 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${entry.pct}%`,
                              background: tokenColor(entry.name),
                            }}
                          />
                        </div>
                        <span className="text-slate-400">{entry.pct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

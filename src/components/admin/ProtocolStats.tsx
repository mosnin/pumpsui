'use client'

import React from 'react'
import {
  DollarSign,
  Activity,
  Layers,
  Zap,
  TrendingUp,
  Clock,
  Shield,
  Wallet,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatUSD } from '@/lib/formatters'
import { formatTokenAmount } from '@/lib/formatters'
import type { TreasuryBalance, ProtocolConfig } from '@/lib/admin'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProtocolStatsProps {
  config: ProtocolConfig
  treasuryBalances: TreasuryBalance[]
  /** USD price map for treasury tokens, keyed by symbol */
  tokenPrices?: Record<string, number>
}

// ─── Mock revenue data ────────────────────────────────────────────────────────

const MOCK_REVENUE = {
  allTimeUsd: 1_482_310.45,
  h24Usd: 12_840.72,
  h7dUsd: 87_920.15,
  h30dUsd: 341_500.0,
  totalSwaps: 2_847_193,
  activePools: 312,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatTileProps {
  label: string
  value: string
  subValue?: string
  icon: React.ReactNode
  accentColor?: string
  trend?: 'up' | 'down' | 'neutral'
}

function StatTile({ label, value, subValue, icon, accentColor = '#6366F1' }: StatTileProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: 'rgba(13,13,31,0.85)',
        border: `1px solid ${accentColor}33`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Background glow */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-10"
        style={{ background: accentColor }}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          {label}
        </span>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
          style={{
            background: `${accentColor}1A`,
            border: `1px solid ${accentColor}4D`,
            color: accentColor,
          }}
        >
          {icon}
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold text-[#E2E8F0] tracking-tight">{value}</p>
        {subValue && <p className="text-xs text-slate-500 mt-0.5">{subValue}</p>}
      </div>
    </div>
  )
}

// ─── Treasury row ─────────────────────────────────────────────────────────────

interface TreasuryRowProps {
  balance: TreasuryBalance
  usdPrice?: number
}

function TreasuryRow({ balance, usdPrice }: TreasuryRowProps) {
  const humanAmount = formatTokenAmount(balance.rawBalance, balance.decimals, 4)
  const usdValue =
    usdPrice !== undefined
      ? formatUSD(Number(balance.rawBalance) / 10 ** balance.decimals * usdPrice)
      : null

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#2A2A5A]/40 last:border-0">
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}
        >
          {balance.symbol.charAt(0)}
        </div>
        <span className="text-sm font-semibold text-[#E2E8F0]">{balance.symbol}</span>
      </div>

      <div className="text-right">
        <p className="text-sm font-mono text-[#E2E8F0]">{humanAmount}</p>
        {usdValue && <p className="text-xs text-slate-500">{usdValue}</p>}
      </div>
    </div>
  )
}

// ─── Revenue breakdown ────────────────────────────────────────────────────────

interface RevenueBarProps {
  label: string
  value: string
  fraction: number
  color: string
}

function RevenueBar({ label, value, fraction, color }: RevenueBarProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="text-[#E2E8F0] font-semibold font-mono">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[#1E1E45]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.round(fraction * 100)}%`, background: color }}
        />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProtocolStats({ config, treasuryBalances, tokenPrices = {} }: ProtocolStatsProps) {
  const feePct = (config.feeBps / 100).toFixed(2)

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top stat tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatTile
          label="All-Time Revenue"
          value={formatUSD(MOCK_REVENUE.allTimeUsd)}
          subValue="Since launch"
          icon={<DollarSign size={16} />}
          accentColor="#6366F1"
        />
        <StatTile
          label="Revenue 24h"
          value={formatUSD(MOCK_REVENUE.h24Usd)}
          subValue={`7d: ${formatUSD(MOCK_REVENUE.h7dUsd)}`}
          icon={<TrendingUp size={16} />}
          accentColor="#06B6D4"
        />
        <StatTile
          label="Revenue 30d"
          value={formatUSD(MOCK_REVENUE.h30dUsd)}
          subValue="Rolling window"
          icon={<Clock size={16} />}
          accentColor="#818CF8"
        />
        <StatTile
          label="Total Swaps"
          value={MOCK_REVENUE.totalSwaps.toLocaleString()}
          subValue="All-time processed"
          icon={<Activity size={16} />}
          accentColor="#10B981"
        />
        <StatTile
          label="Active Pools"
          value={MOCK_REVENUE.activePools.toLocaleString()}
          subValue="Integrated sources"
          icon={<Layers size={16} />}
          accentColor="#F59E0B"
        />
        <StatTile
          label="Protocol Fee"
          value={`${feePct}%`}
          subValue={`${config.feeBps} basis points`}
          icon={<Zap size={16} />}
          accentColor={config.paused ? '#EF4444' : '#6366F1'}
        />
      </div>

      {/* ── Bottom section: Revenue breakdown + Treasury ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue breakdown */}
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-[#6366F1]" />
            <h3 className="text-sm font-semibold text-[#E2E8F0] uppercase tracking-widest">
              Revenue Breakdown
            </h3>
          </div>

          <div className="flex flex-col gap-4">
            <RevenueBar
              label="24h"
              value={formatUSD(MOCK_REVENUE.h24Usd)}
              fraction={MOCK_REVENUE.h24Usd / MOCK_REVENUE.h30dUsd}
              color="#6366F1"
            />
            <RevenueBar
              label="7d"
              value={formatUSD(MOCK_REVENUE.h7dUsd)}
              fraction={MOCK_REVENUE.h7dUsd / MOCK_REVENUE.h30dUsd}
              color="#06B6D4"
            />
            <RevenueBar
              label="30d"
              value={formatUSD(MOCK_REVENUE.h30dUsd)}
              fraction={1}
              color="#818CF8"
            />
          </div>

          {/* Per-token fee breakdown (mock) */}
          <div className="mt-5 pt-4 border-t border-[#2A2A5A]/60">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-medium">
              Fee by token (30d)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { sym: 'SUI', pct: '41%', usd: '$140.0K', color: '#6366F1' },
                { sym: 'USDC', pct: '28%', usd: '$95.6K', color: '#06B6D4' },
                { sym: 'USDT', pct: '18%', usd: '$61.5K', color: '#10B981' },
                { sym: 'WETH', pct: '13%', usd: '$44.4K', color: '#F59E0B' },
              ].map(({ sym, pct, usd, color }) => (
                <div key={sym} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-slate-400 font-medium">{sym}</span>
                  <span className="text-slate-500">{pct}</span>
                  <span className="text-[#E2E8F0] font-semibold ml-auto">{usd}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Treasury balances */}
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={16} className="text-[#06B6D4]" />
            <h3 className="text-sm font-semibold text-[#E2E8F0] uppercase tracking-widest">
              Treasury Balances
            </h3>
          </div>

          {treasuryBalances.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No balances found</p>
          ) : (
            <div>
              {treasuryBalances.map((bal) => (
                <TreasuryRow
                  key={bal.coinType}
                  balance={bal}
                  usdPrice={tokenPrices[bal.symbol]}
                />
              ))}
            </div>
          )}

          {/* Fee recipient */}
          <div className="mt-4 pt-4 border-t border-[#2A2A5A]/60">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={12} className="text-slate-500" />
              <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
                Fee Recipient
              </p>
            </div>
            <p className="text-xs font-mono text-[#06B6D4] break-all">{config.feeRecipient}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

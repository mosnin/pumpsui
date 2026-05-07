'use client'

import { useState } from 'react'
import { Activity, BarChart2, DollarSign, Users, Zap, ArrowUpRight } from 'lucide-react'
import { StatsCard } from '@/components/analytics/StatsCard'
import { VolumeChart, type VolumeDataPoint } from '@/components/analytics/VolumeChart'
import { DexPieChart, type DexVolumeEntry } from '@/components/analytics/DexPieChart'
import { DEXBadge } from '@/components/common/DEXBadge'
import { PriceChange } from '@/components/common/PriceChange'

// ─── Mock Data ───────────────────────────────────────────────────────────────

const volumeData: VolumeDataPoint[] = [
  { date: 'Apr 30', volume: 4_820_000, fees: 14_460 },
  { date: 'May 1',  volume: 6_140_000, fees: 18_420 },
  { date: 'May 2',  volume: 5_390_000, fees: 16_170 },
  { date: 'May 3',  volume: 7_850_000, fees: 23_550 },
  { date: 'May 4',  volume: 9_210_000, fees: 27_630 },
  { date: 'May 5',  volume: 8_430_000, fees: 25_290 },
  { date: 'May 6',  volume: 11_670_000, fees: 35_010 },
]

const dexDistribution: DexVolumeEntry[] = [
  { name: 'Cetus',    volume: 4_200_000, percentage: 36 },
  { name: 'Turbos',   volume: 2_800_000, percentage: 24 },
  { name: 'DeepBook', volume: 1_900_000, percentage: 16.3 },
  { name: 'Aftermath',volume: 1_400_000, percentage: 12 },
  { name: 'FlowX',    volume: 870_000,   percentage: 7.5 },
  { name: 'Kriya',    volume: 500_000,   percentage: 4.2 },
]

const topPairs = [
  { pair: 'SUI / USDC',  dex: 'Cetus',     volume24h: 4_120_000, fees24h: 12_360,  change: 18.4  },
  { pair: 'SUI / USDT',  dex: 'Turbos',    volume24h: 2_830_000, fees24h: 8_490,   change: -5.2  },
  { pair: 'WBTC / USDC', dex: 'DeepBook',  volume24h: 1_940_000, fees24h: 5_820,   change: 32.1  },
  { pair: 'ETH / SUI',   dex: 'Aftermath', volume24h: 1_220_000, fees24h: 3_660,   change: -11.7 },
  { pair: 'USDC / USDT', dex: 'FlowX',     volume24h: 980_000,   fees24h: 980,     change: 2.9   },
  { pair: 'SUI / DEEP',  dex: 'DeepBook',  volume24h: 760_000,   fees24h: 2_280,   change: 55.6  },
  { pair: 'BUCK / USDC', dex: 'Kriya',     volume24h: 490_000,   fees24h: 1_470,   change: -3.4  },
]

interface RecentSwap {
  id: string
  time: string
  from: string
  to: string
  amountIn: string
  amountOut: string
  dex: string
  wallet: string
}

const recentSwaps: RecentSwap[] = [
  { id: '0x1a2b', time: '2s ago',   from: 'SUI',  to: 'USDC', amountIn: '1,200 SUI',  amountOut: '3,456.78 USDC', dex: 'Cetus',     wallet: '0x3f4a…9e2d' },
  { id: '0x3c4d', time: '8s ago',   from: 'USDC', to: 'SUI',  amountIn: '5,000 USDC', amountOut: '1,734.1 SUI',   dex: 'Turbos',    wallet: '0x7b2c…1f0e' },
  { id: '0x5e6f', time: '15s ago',  from: 'SUI',  to: 'WBTC', amountIn: '8,000 SUI',  amountOut: '0.2341 WBTC',   dex: 'DeepBook',  wallet: '0xa1d3…4c8b' },
  { id: '0x7a8b', time: '23s ago',  from: 'ETH',  to: 'SUI',  amountIn: '0.5 ETH',    amountOut: '891.2 SUI',     dex: 'Aftermath', wallet: '0x2e9f…7a1c' },
  { id: '0x9c0d', time: '41s ago',  from: 'SUI',  to: 'BUCK', amountIn: '3,500 SUI',  amountOut: '3,472.5 BUCK',  dex: 'Kriya',     wallet: '0xd4b7…3e5a' },
  { id: '0xb2e3', time: '1m ago',   from: 'USDT', to: 'USDC', amountIn: '10,000 USDT',amountOut: '9,997.1 USDC',  dex: 'FlowX',     wallet: '0x8f1e…2b6d' },
  { id: '0xd4f5', time: '1m ago',   from: 'SUI',  to: 'USDC', amountIn: '450 SUI',    amountOut: '1,296.9 USDC',  dex: 'Cetus',     wallet: '0x5c3a…9d4f' },
]

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmt(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'volume' | 'fees'>('volume')

  const chartData = volumeData.map((d) => ({
    ...d,
    // When showing fees only, zero out volume for clarity
    ...(activeTab === 'fees' ? { volume: d.fees ?? 0, fees: undefined } : {}),
  }))

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: '#060611', color: '#E2E8F0' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.2)', color: '#6366F1' }}
            >
              <BarChart2 size={18} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#E2E8F0' }}>
              OmniWeave Analytics
            </h1>
          </div>
          <p className="text-slate-400 text-sm ml-11">
            Aggregated on-chain statistics across all integrated DEXes on Sui
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Volume (24h)"
            value="$11.67M"
            change24h={38.4}
            icon={<DollarSign size={18} />}
            subtitle="Across 6 DEXes"
          />
          <StatsCard
            title="Total Swaps (24h)"
            value="24,831"
            change24h={12.7}
            icon={<Activity size={18} />}
            subtitle="~17.3 swaps / min"
          />
          <StatsCard
            title="Unique Users (24h)"
            value="8,492"
            change24h={-4.1}
            icon={<Users size={18} />}
            subtitle="Active wallets"
          />
          <StatsCard
            title="Total Fees Collected"
            value="$35,010"
            change24h={38.4}
            icon={<Zap size={18} />}
            subtitle="Distributed to LPs"
          />
        </div>

        {/* Volume Chart + DEX Pie */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
          {/* Volume Chart */}
          <div
            className="xl:col-span-2 rounded-xl p-6"
            style={{
              background: 'rgba(13, 13, 31, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-base" style={{ color: '#E2E8F0' }}>
                7-Day Volume
              </h2>
              <div className="flex gap-1">
                {(['volume', 'fees'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all"
                    style={
                      activeTab === tab
                        ? { background: '#6366F1', color: '#fff' }
                        : { background: 'rgba(99,102,241,0.1)', color: '#94a3b8' }
                    }
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <VolumeChart data={chartData} height={280} />
          </div>

          {/* DEX Distribution */}
          <div
            className="rounded-xl p-6"
            style={{
              background: 'rgba(13, 13, 31, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <h2 className="font-semibold text-base mb-4" style={{ color: '#E2E8F0' }}>
              DEX Distribution
            </h2>
            <DexPieChart data={dexDistribution} height={280} />
          </div>
        </div>

        {/* Top Pairs + Recent Swaps */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Top Pairs */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: 'rgba(13, 13, 31, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(99,102,241,0.15)' }}>
              <h2 className="font-semibold text-base" style={{ color: '#E2E8F0' }}>
                Top Trading Pairs
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                  {['Pair', 'DEX', 'Volume 24h', 'Fees 24h', '24h'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topPairs.map((row, i) => (
                  <tr
                    key={i}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: '1px solid rgba(99,102,241,0.07)' }}
                  >
                    <td className="px-4 py-3 font-semibold" style={{ color: '#E2E8F0' }}>
                      {row.pair}
                    </td>
                    <td className="px-4 py-3">
                      <DEXBadge dex={row.dex} size="sm" />
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: '#E2E8F0' }}>
                      {fmt(row.volume24h)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {fmt(row.fees24h)}
                    </td>
                    <td className="px-4 py-3">
                      <PriceChange value={row.change} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Swaps */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: 'rgba(13, 13, 31, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <div
              className="px-6 py-4 flex items-center justify-between border-b"
              style={{ borderColor: 'rgba(99,102,241,0.15)' }}
            >
              <h2 className="font-semibold text-base" style={{ color: '#E2E8F0' }}>
                Recent Swaps
              </h2>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(99,102,241,0.07)' }}>
              {recentSwaps.map((swap) => (
                <div
                  key={swap.id}
                  className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors flex items-center gap-3"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}
                  >
                    <ArrowUpRight size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: '#E2E8F0' }}>
                        {swap.from} → {swap.to}
                      </span>
                      <DEXBadge dex={swap.dex} size="sm" />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {swap.amountIn} → {swap.amountOut} · {swap.wallet}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">{swap.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

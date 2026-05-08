'use client'

import { useState } from 'react'
import { Trophy, Zap, Activity, TrendingUp, TrendingDown, Crown } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeFilter = '24H' | '7D' | '30D' | 'All'

interface Trader {
  rank: number
  address: string
  displayAddress: string
  volume: number
  trades: number
  pnl: number // percent
}

interface BigSwap {
  rank: number
  txHash: string
  from: string
  to: string
  amountUsd: number
  wallet: string
  time: string
  dex: string
}

interface ActiveTrader {
  rank: number
  address: string
  displayAddress: string
  trades: number
  volume: number
  avgSwapSize: number
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TRADERS: Trader[] = [
  { rank: 1, address: '0x3f4a9e2d1b7c8f5e6a0d3c2b1a9e8f7d6c5b4a3e', displayAddress: '0x3f4a…2d9e', volume: 4_250_000, trades: 847, pnl: 34.7 },
  { rank: 2, address: '0x7b2c1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4', displayAddress: '0x7b2c…5b4a', volume: 3_180_000, trades: 612, pnl: 12.4 },
  { rank: 3, address: '0xa1d34c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2', displayAddress: '0xa1d3…f3e2', volume: 2_940_000, trades: 1_024, pnl: -5.8 },
  { rank: 4, address: '0x2e9f7a1c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1', displayAddress: '0x2e9f…a2f1', volume: 2_410_000, trades: 389, pnl: 28.1 },
  { rank: 5, address: '0xd4b73e5a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7', displayAddress: '0xd4b7…8d7c', volume: 1_870_000, trades: 521, pnl: 9.3 },
  { rank: 6, address: '0x8f1e2b6d5c4a3f2e1d0c9b8a7f6e5d4c3b2a1f0', displayAddress: '0x8f1e…1f0e', volume: 1_640_000, trades: 276, pnl: -12.6 },
  { rank: 7, address: '0x5c3a9d4f2e1b0a9f8e7d6c5b4a3f2e1d0c9b8a7', displayAddress: '0x5c3a…b8a7', volume: 1_320_000, trades: 433, pnl: 51.2 },
  { rank: 8, address: '0x1b4d7a2f9e8c3b0a5f6e7d8c9b0a1f2e3d4c5b6', displayAddress: '0x1b4d…5b6a', volume: 1_080_000, trades: 198, pnl: 6.7 },
  { rank: 9, address: '0x9c2e5a8f1b4d7e0c3f6a9b2e5c8f1b4d7e0c3f6', displayAddress: '0x9c2e…3f6a', volume: 890_000,   trades: 312, pnl: -3.1 },
  { rank: 10, address: '0x4f7a0d3e6b9c2f5a8e1b4d7a0c3f6a9b2e5c8f1', displayAddress: '0x4f7a…8f1b', volume: 720_000,   trades: 157, pnl: 18.9 },
]

const MOCK_BIGGEST_SWAPS: BigSwap[] = [
  { rank: 1, txHash: '0x1a2b',  from: 'WBTC',  to: 'USDC',  amountUsd: 2_840_000, wallet: '0x3f4a…2d9e', time: '4h ago',  dex: 'DeepBook' },
  { rank: 2, txHash: '0x3c4d',  from: 'ETH',   to: 'SUI',   amountUsd: 1_920_000, wallet: '0x7b2c…5b4a', time: '7h ago',  dex: 'Cetus'    },
  { rank: 3, txHash: '0x5e6f',  from: 'SUI',   to: 'USDC',  amountUsd: 1_580_000, wallet: '0xa1d3…f3e2', time: '9h ago',  dex: 'Turbos'   },
  { rank: 4, txHash: '0x7a8b',  from: 'USDC',  to: 'WBTC',  amountUsd: 980_000,   wallet: '0x2e9f…a2f1', time: '12h ago', dex: 'DeepBook' },
  { rank: 5, txHash: '0x9c0d',  from: 'SUI',   to: 'ETH',   amountUsd: 760_000,   wallet: '0xd4b7…8d7c', time: '14h ago', dex: 'Aftermath'},
  { rank: 6, txHash: '0xb2e3',  from: 'USDT',  to: 'SUI',   amountUsd: 620_000,   wallet: '0x8f1e…1f0e', time: '16h ago', dex: 'FlowX'    },
  { rank: 7, txHash: '0xd4f5',  from: 'CETUS', to: 'USDC',  amountUsd: 480_000,   wallet: '0x5c3a…b8a7', time: '19h ago', dex: 'Cetus'    },
]

const MOCK_ACTIVE: ActiveTrader[] = [
  { rank: 1, address: '0xa1d34c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2', displayAddress: '0xa1d3…f3e2', trades: 1_024, volume: 2_940_000, avgSwapSize: 2_871 },
  { rank: 2, address: '0x3f4a9e2d1b7c8f5e6a0d3c2b1a9e8f7d6c5b4a3e', displayAddress: '0x3f4a…2d9e', trades: 847,   volume: 4_250_000, avgSwapSize: 5_018 },
  { rank: 3, address: '0x7b2c1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4', displayAddress: '0x7b2c…5b4a', trades: 612,   volume: 3_180_000, avgSwapSize: 5_196 },
  { rank: 4, address: '0xd4b73e5a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7', displayAddress: '0xd4b7…8d7c', trades: 521,   volume: 1_870_000, avgSwapSize: 3_589 },
  { rank: 5, address: '0x8f1e2b6d5c4a3f2e1d0c9b8a7f6e5d4c3b2a1f0', displayAddress: '0x8f1e…1f0e', trades: 433,   volume: 1_640_000, avgSwapSize: 3_787 },
  { rank: 6, address: '0x5c3a9d4f2e1b0a9f8e7d6c5b4a3f2e1d0c9b8a7', displayAddress: '0x5c3a…b8a7', trades: 389,   volume: 2_410_000, avgSwapSize: 6_195 },
  { rank: 7, address: '0x9c2e5a8f1b4d7e0c3f6a9b2e5c8f1b4d7e0c3f6', displayAddress: '0x9c2e…3f6a', trades: 312,   volume: 890_000,   avgSwapSize: 2_853 },
]

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtUSD(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toFixed(2)}`
}

function fmtNum(v: number): string {
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toString()
}

// ─── Rank Medal ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="text-lg" title="1st place" aria-label="Gold medal">
        🥇
      </span>
    )
  if (rank === 2)
    return (
      <span className="text-lg" title="2nd place" aria-label="Silver medal">
        🥈
      </span>
    )
  if (rank === 3)
    return (
      <span className="text-lg" title="3rd place" aria-label="Bronze medal">
        🥉
      </span>
    )
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-slate-400"
      style={{ background: 'rgba(99,102,241,0.1)' }}
    >
      {rank}
    </span>
  )
}

// ─── Top 3 highlight cards ────────────────────────────────────────────────────

const TOP3_GRADIENTS = [
  'linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(234,179,8,0.04) 100%)',
  'linear-gradient(135deg, rgba(148,163,184,0.12) 0%, rgba(148,163,184,0.03) 100%)',
  'linear-gradient(135deg, rgba(180,83,9,0.12) 0%, rgba(180,83,9,0.03) 100%)',
]
const TOP3_BORDER = [
  'rgba(234,179,8,0.3)',
  'rgba(148,163,184,0.25)',
  'rgba(180,83,9,0.25)',
]
const TOP3_ICON_COLOR = ['#EAB308', '#94A3B8', '#B45309']

function Top3Cards({ traders }: { traders: Trader[] }) {
  const top3 = traders.slice(0, 3)
  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {podiumOrder.map((trader) => {
        const i = trader.rank - 1
        return (
          <div
            key={trader.address}
            className={[
              'rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1',
              trader.rank === 1 ? 'sm:order-2 sm:-mt-2' : trader.rank === 2 ? 'sm:order-1' : 'sm:order-3',
            ].join(' ')}
            style={{
              background: TOP3_GRADIENTS[i],
              border: `1px solid ${TOP3_BORDER[i]}`,
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Crown for #1 */}
            {trader.rank === 1 && (
              <Crown
                size={20}
                className="absolute top-3 right-3 opacity-60"
                style={{ color: TOP3_ICON_COLOR[0] }}
              />
            )}

            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{ background: `rgba(99,102,241,0.15)`, color: TOP3_ICON_COLOR[i] }}
              >
                {trader.rank === 1 ? '🥇' : trader.rank === 2 ? '🥈' : '🥉'}
              </div>
              <div>
                <div className="font-mono text-sm font-semibold" style={{ color: '#E2E8F0' }}>
                  {trader.displayAddress}
                </div>
                <div className="text-xs text-slate-500">#{trader.rank} Trader</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Volume</span>
                <span className="font-semibold font-mono" style={{ color: '#E2E8F0' }}>
                  {fmtUSD(trader.volume)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Trades</span>
                <span className="font-semibold font-mono" style={{ color: '#E2E8F0' }}>
                  {fmtNum(trader.trades)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">PnL</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    trader.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {trader.pnl >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {trader.pnl >= 0 ? '+' : ''}{trader.pnl.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Table panel ──────────────────────────────────────────────────────────────

function Panel({ children, title, icon }: { children: React.ReactNode; title: string; icon: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(13, 13, 31, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      }}
    >
      <div
        className="px-6 py-4 flex items-center gap-2.5 border-b"
        style={{ borderColor: 'rgba(99,102,241,0.15)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.2)', color: '#6366F1' }}
        >
          {icon}
        </div>
        <h2 className="font-semibold text-base" style={{ color: '#E2E8F0' }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

const TH = ({ children, right = false }: { children: React.ReactNode; right?: boolean }) => (
  <th
    className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 ${right ? 'text-right' : 'text-left'}`}
  >
    {children}
  </th>
)

// ─── Time filter tabs ─────────────────────────────────────────────────────────

function TimeTabs({
  active,
  onChange,
}: {
  active: TimeFilter
  onChange: (v: TimeFilter) => void
}) {
  const tabs: TimeFilter[] = ['24H', '7D', '30D', 'All']
  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl p-1"
      style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className="px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200"
          style={
            active === tab
              ? {
                  background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
                }
              : { color: '#64748B' }
          }
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7D')
  const [activeSection, setActiveSection] = useState<'top' | 'swaps' | 'active'>('top')

  const sections = [
    { id: 'top' as const,    label: 'Top Traders',   icon: <Trophy size={15} /> },
    { id: 'swaps' as const,  label: 'Biggest Swaps', icon: <Zap size={15} /> },
    { id: 'active' as const, label: 'Most Active',   icon: <Activity size={15} /> },
  ]

  return (
    <div className="min-h-screen font-sans" style={{ background: '#060611', color: '#E2E8F0' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.2)', color: '#6366F1' }}
              >
                <Trophy size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#E2E8F0' }}>
                  Leaderboard
                </h1>
                <p className="text-slate-400 text-sm">Top performers on OmniWeave</p>
              </div>
            </div>
            <TimeTabs active={timeFilter} onChange={setTimeFilter} />
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {sections.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex-shrink-0"
              style={
                activeSection === id
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
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* ── Top Traders ─────────────────────────────────────────────────── */}
        {activeSection === 'top' && (
          <>
            <Top3Cards traders={MOCK_TRADERS} />

            <Panel title="Top Traders" icon={<Trophy size={15} />}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                      <TH>Rank</TH>
                      <TH>Trader</TH>
                      <TH right>Volume</TH>
                      <TH right>Trades</TH>
                      <TH right>PnL</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_TRADERS.map((trader, i) => (
                      <tr
                        key={trader.address}
                        className="transition-colors hover:bg-white/[0.025]"
                        style={{
                          borderBottom: i < MOCK_TRADERS.length - 1
                            ? '1px solid rgba(99,102,241,0.07)'
                            : 'none',
                        }}
                      >
                        <td className="px-4 py-3.5">
                          <RankBadge rank={trader.rank} />
                        </td>
                        <td className="px-4 py-3.5 font-mono font-medium" style={{ color: '#A5B4FC' }}>
                          {trader.displayAddress}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold" style={{ color: '#E2E8F0' }}>
                          {fmtUSD(trader.volume)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-slate-300">
                          {fmtNum(trader.trades)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold text-sm ${
                              trader.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {trader.pnl >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                            {trader.pnl >= 0 ? '+' : ''}{trader.pnl.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            {/* "Your Rank" card */}
            <div
              className="mt-4 rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              style={{
                background: 'rgba(99,102,241,0.06)',
                border: '1px dashed rgba(99,102,241,0.3)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}
                >
                  <span className="text-xs font-bold">?</span>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#E2E8F0' }}>
                    Your Rank
                  </p>
                  <p className="text-xs text-slate-500">Connect wallet to see your position</p>
                </div>
              </div>
              <button
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                  color: '#fff',
                }}
              >
                Connect Wallet
              </button>
            </div>
          </>
        )}

        {/* ── Biggest Swaps ────────────────────────────────────────────────── */}
        {activeSection === 'swaps' && (
          <Panel title="Biggest Swaps (24H)" icon={<Zap size={15} />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                    <TH>Rank</TH>
                    <TH>Swap</TH>
                    <TH>DEX</TH>
                    <TH right>Size (USD)</TH>
                    <TH>Wallet</TH>
                    <TH right>Time</TH>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_BIGGEST_SWAPS.map((swap, i) => (
                    <tr
                      key={swap.txHash}
                      className="transition-colors hover:bg-white/[0.025]"
                      style={{
                        borderBottom: i < MOCK_BIGGEST_SWAPS.length - 1
                          ? '1px solid rgba(99,102,241,0.07)'
                          : 'none',
                      }}
                    >
                      <td className="px-4 py-3.5">
                        <RankBadge rank={swap.rank} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold" style={{ color: '#E2E8F0' }}>
                          {swap.from}
                        </span>
                        <span className="mx-2 text-slate-600">→</span>
                        <span className="font-semibold" style={{ color: '#E2E8F0' }}>
                          {swap.to}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-md"
                          style={{
                            background: 'rgba(99,102,241,0.12)',
                            color: '#818CF8',
                            border: '1px solid rgba(99,102,241,0.2)',
                          }}
                        >
                          {swap.dex}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold" style={{ color: '#06B6D4' }}>
                        {fmtUSD(swap.amountUsd)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-sm" style={{ color: '#A5B4FC' }}>
                        {swap.wallet}
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs text-slate-500">
                        {swap.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {/* ── Most Active ──────────────────────────────────────────────────── */}
        {activeSection === 'active' && (
          <Panel title="Most Active Traders" icon={<Activity size={15} />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                    <TH>Rank</TH>
                    <TH>Trader</TH>
                    <TH right>Trades</TH>
                    <TH right>Volume</TH>
                    <TH right>Avg Swap</TH>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ACTIVE.map((trader, i) => (
                    <tr
                      key={trader.address}
                      className="transition-colors hover:bg-white/[0.025]"
                      style={{
                        borderBottom: i < MOCK_ACTIVE.length - 1
                          ? '1px solid rgba(99,102,241,0.07)'
                          : 'none',
                      }}
                    >
                      <td className="px-4 py-3.5">
                        <RankBadge rank={trader.rank} />
                      </td>
                      <td className="px-4 py-3.5 font-mono font-medium" style={{ color: '#A5B4FC' }}>
                        {trader.displayAddress}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className="font-bold font-mono text-sm"
                          style={{ color: '#06B6D4' }}
                        >
                          {fmtNum(trader.trades)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold" style={{ color: '#E2E8F0' }}>
                        {fmtUSD(trader.volume)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-400">
                        {fmtUSD(trader.avgSwapSize)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

      </div>
    </div>
  )
}

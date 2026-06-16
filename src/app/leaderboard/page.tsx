'use client'

import { useState, useMemo } from 'react'
import { Trophy, Zap, Activity, TrendingUp, TrendingDown, Crown, ExternalLink } from 'lucide-react'
import { useRecentSwaps } from '@/hooks/useSuiEvents'

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeFilter = '24H' | '7D' | '30D' | 'All'

interface Trader {
  rank: number
  address: string
  displayAddress: string
  volume: number
  trades: number
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

// ─── Mock fallback for Biggest Swaps (no real source yet) ─────────────────────

const MOCK_BIGGEST_SWAPS: BigSwap[] = [
  { rank: 1, txHash: '0x1a2b',  from: 'WBTC',  to: 'USDC',  amountUsd: 2_840_000, wallet: '0x3f4a…2d9e', time: '4h ago',  dex: 'DeepBook' },
  { rank: 2, txHash: '0x3c4d',  from: 'ETH',   to: 'SUI',   amountUsd: 1_920_000, wallet: '0x7b2c…5b4a', time: '7h ago',  dex: 'Cetus'    },
  { rank: 3, txHash: '0x5e6f',  from: 'SUI',   to: 'USDC',  amountUsd: 1_580_000, wallet: '0xa1d3…f3e2', time: '9h ago',  dex: 'Turbos'   },
  { rank: 4, txHash: '0x7a8b',  from: 'USDC',  to: 'WBTC',  amountUsd: 980_000,   wallet: '0x2e9f…a2f1', time: '12h ago', dex: 'DeepBook' },
  { rank: 5, txHash: '0x9c0d',  from: 'SUI',   to: 'ETH',   amountUsd: 760_000,   wallet: '0xd4b7…8d7c', time: '14h ago', dex: 'Aftermath'},
  { rank: 6, txHash: '0xb2e3',  from: 'USDT',  to: 'SUI',   amountUsd: 620_000,   wallet: '0x8f1e…1f0e', time: '16h ago', dex: 'FlowX'    },
  { rank: 7, txHash: '0xd4f5',  from: 'CETUS', to: 'USDC',  amountUsd: 480_000,   wallet: '0x5c3a…b8a7', time: '19h ago', dex: 'Cetus'    },
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

function shortenAddress(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
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

// ─── Demo data banner ─────────────────────────────────────────────────────────

function MockDataBanner() {
  return (
    <div
      className="mb-6 flex items-start gap-3 rounded-xl border px-4 py-3"
      style={{
        background: 'rgba(245,158,11,0.07)',
        borderColor: 'rgba(245,158,11,0.25)',
      }}
    >
      <span className="text-amber-400 text-base leading-none mt-0.5">⚠</span>
      <p className="text-sm text-amber-300/90">
        Showing demo data — real data loads after contract deployment
      </p>
    </div>
  )
}

// ─── Suiscan link ─────────────────────────────────────────────────────────────

function SuiscanLink({ address }: { address: string }) {
  return (
    <a
      href={`https://suiscan.xyz/mainnet/account/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
      title="View on Suiscan"
    >
      <span className="font-mono font-medium" style={{ color: '#A5B4FC' }}>
        {shortenAddress(address)}
      </span>
      <ExternalLink size={11} style={{ color: '#A5B4FC' }} />
    </a>
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
                  <SuiscanLink address={trader.address} />
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

  // ── Real swap data ─────────────────────────────────────────────────────────
  const { swaps, isMockData } = useRecentSwaps(50)

  // Aggregate by user address to derive volume and trade count leaderboard
  const traders = useMemo<Trader[]>(() => {
    const map = new Map<string, { volume: number; trades: number; address: string }>()
    swaps.forEach((s) => {
      const existing = map.get(s.user) ?? { volume: 0, trades: 0, address: s.user }
      map.set(s.user, {
        ...existing,
        volume: existing.volume + s.amountIn,
        trades: existing.trades + 1,
      })
    })
    return Array.from(map.values())
      .sort((a, b) => b.volume - a.volume)
      .map((t, i) => ({
        rank: i + 1,
        address: t.address,
        displayAddress: shortenAddress(t.address),
        volume: t.volume,
        trades: t.trades,
      }))
  }, [swaps])

  // Most-active: sort by trade count instead
  const activeTraders = useMemo<ActiveTrader[]>(() => {
    return [...traders]
      .sort((a, b) => b.trades - a.trades)
      .map((t, i) => ({
        rank: i + 1,
        address: t.address,
        displayAddress: t.displayAddress,
        trades: t.trades,
        volume: t.volume,
        avgSwapSize: t.trades > 0 ? t.volume / t.trades : 0,
      }))
  }, [traders])

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

        {/* Demo data banner */}
        {isMockData && <MockDataBanner />}

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
            {traders.length >= 3 && <Top3Cards traders={traders} />}

            <Panel
              title={`Top Traders${isMockData ? ' (Estimated)' : ''}`}
              icon={<Trophy size={15} />}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                      <TH>Rank</TH>
                      <TH>Trader</TH>
                      <TH right>Volume</TH>
                      <TH right>Trades</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {traders.map((trader, i) => (
                      <tr
                        key={trader.address}
                        className="transition-colors hover:bg-white/[0.025]"
                        style={{
                          borderBottom: i < traders.length - 1
                            ? '1px solid rgba(99,102,241,0.07)'
                            : 'none',
                        }}
                      >
                        <td className="px-4 py-3.5">
                          <RankBadge rank={trader.rank} />
                        </td>
                        <td className="px-4 py-3.5">
                          <SuiscanLink address={trader.address} />
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold" style={{ color: '#E2E8F0' }}>
                          {fmtUSD(trader.volume)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-slate-300">
                          {fmtNum(trader.trades)}
                        </td>
                      </tr>
                    ))}
                    {traders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">
                          No swap data available yet.
                        </td>
                      </tr>
                    )}
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
          <Panel title="Biggest Swaps (24H) — Estimated" icon={<Zap size={15} />}>
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
          <Panel
            title={`Most Active Traders${isMockData ? ' (Estimated)' : ''}`}
            icon={<Activity size={15} />}
          >
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
                  {activeTraders.map((trader, i) => (
                    <tr
                      key={trader.address}
                      className="transition-colors hover:bg-white/[0.025]"
                      style={{
                        borderBottom: i < activeTraders.length - 1
                          ? '1px solid rgba(99,102,241,0.07)'
                          : 'none',
                      }}
                    >
                      <td className="px-4 py-3.5">
                        <RankBadge rank={trader.rank} />
                      </td>
                      <td className="px-4 py-3.5">
                        <SuiscanLink address={trader.address} />
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
                  {activeTraders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                        No swap data available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

      </div>
    </div>
  )
}

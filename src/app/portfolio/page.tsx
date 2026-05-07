'use client'

import { useState } from 'react'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Fuel,
  RefreshCw,
  ArrowRightLeft,
  ChevronRight,
  BarChart2,
} from 'lucide-react'
import { DEXBadge } from '@/components/common/DEXBadge'
import { PriceChange } from '@/components/common/PriceChange'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TokenBalance {
  symbol: string
  name: string
  amount: number
  price: number
  change24h: number
  iconColor: string
}

interface SwapHistory {
  txHash: string
  time: string
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  dex: string
  status: 'success' | 'failed'
  usdValue: number
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_BALANCES: TokenBalance[] = [
  { symbol: 'SUI',   name: 'Sui',          amount: 4_821.34,  price: 2.88,    change24h: 5.2,   iconColor: '#3B82F6' },
  { symbol: 'USDC',  name: 'USD Coin',     amount: 3_200.00,  price: 1.00,    change24h: 0.01,  iconColor: '#2563EB' },
  { symbol: 'WBTC',  name: 'Wrapped BTC',  amount: 0.1812,    price: 61_400,  change24h: -2.1,  iconColor: '#F59E0B' },
  { symbol: 'ETH',   name: 'Ethereum',     amount: 1.4400,    price: 3_180,   change24h: 1.7,   iconColor: '#8B5CF6' },
  { symbol: 'CETUS', name: 'Cetus Protocol',amount: 12_450,   price: 0.082,   change24h: 11.4,  iconColor: '#00D4AA' },
  { symbol: 'BUCK',  name: 'Buck Stablecoin',amount: 800,     price: 0.998,   change24h: -0.05, iconColor: '#10B981' },
]

const MOCK_SWAPS: SwapHistory[] = [
  { txHash: '0x1a2b3c',   time: '2h ago',   fromToken: 'SUI',  toToken: 'USDC',  fromAmount: '500 SUI',   toAmount: '1,438.5 USDC',  dex: 'Cetus',     status: 'success', usdValue: 1438.50 },
  { txHash: '0x4d5e6f',   time: '5h ago',   fromToken: 'USDC', toToken: 'WBTC',  fromAmount: '5,000 USDC',toAmount: '0.0814 WBTC',   dex: 'DeepBook',  status: 'success', usdValue: 5000.00 },
  { txHash: '0x7a8b9c',   time: '1d ago',   fromToken: 'ETH',  toToken: 'SUI',   fromAmount: '0.5 ETH',   toAmount: '554.2 SUI',     dex: 'Aftermath', status: 'success', usdValue: 1590.00 },
  { txHash: '0xd0e1f2',   time: '1d ago',   fromToken: 'SUI',  toToken: 'CETUS', fromAmount: '1,000 SUI', toAmount: '34,890 CETUS',  dex: 'Cetus',     status: 'failed',  usdValue: 2880.00 },
  { txHash: '0x3f4a5b',   time: '2d ago',   fromToken: 'USDC', toToken: 'ETH',   fromAmount: '3,000 USDC',toAmount: '0.942 ETH',     dex: 'Turbos',    status: 'success', usdValue: 3000.00 },
  { txHash: '0x6c7d8e',   time: '3d ago',   fromToken: 'SUI',  toToken: 'BUCK',  fromAmount: '280 SUI',   toAmount: '805.0 BUCK',    dex: 'Kriya',     status: 'success', usdValue: 806.40 },
  { txHash: '0x9f0a1b',   time: '5d ago',   fromToken: 'WBTC', toToken: 'USDC',  fromAmount: '0.1 WBTC',  toAmount: '6,130.5 USDC',  dex: 'DeepBook',  status: 'success', usdValue: 6130.50 },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  if (value >= 1) return `$${value.toFixed(2)}`
  return `$${value.toFixed(4)}`
}

function fmtNum(n: number, decimals = 2): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(decimals)}K`
  return n.toFixed(Math.min(decimals, 6))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConnectWalletCTA() {
  return (
    <div className="flex flex-col items-center justify-center py-28 px-8 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          color: '#6366F1',
        }}
      >
        <Wallet size={36} />
      </div>
      <h2 className="text-2xl font-bold mb-3" style={{ color: '#E2E8F0' }}>
        Connect Your Wallet
      </h2>
      <p className="text-slate-400 max-w-sm mb-8">
        Connect your Sui wallet to view your token balances, swap history, and portfolio analytics.
      </p>
      <button
        className="px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
          color: '#fff',
        }}
      >
        Connect Wallet
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const totalValue = MOCK_BALANCES.reduce((sum, b) => sum + b.amount * b.price, 0)
  const totalChange = MOCK_BALANCES.reduce(
    (sum, b) => sum + b.amount * b.price * (b.change24h / 100),
    0,
  )
  const totalChangePercent = (totalChange / (totalValue - totalChange)) * 100

  const gasSpent = 0.412 // SUI
  const gasUsd = gasSpent * 2.88

  const successSwaps = MOCK_SWAPS.filter((s) => s.status === 'success')
  const totalSwapVolume = successSwaps.reduce((s, sw) => s + sw.usdValue, 0)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1200)
  }

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: '#060611', color: '#E2E8F0' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}
              >
                <BarChart2 size={18} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#E2E8F0' }}>
                Portfolio
              </h1>
            </div>
            <p className="text-slate-400 text-sm ml-11">
              {isConnected ? 'Your on-chain balance and activity' : 'Connect wallet to get started'}
            </p>
          </div>

          {/* Connect / Disconnect toggle (demo) */}
          <div className="flex items-center gap-3">
            {isConnected && (
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg transition-all hover:opacity-80"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}
                title="Refresh"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            )}
            <button
              onClick={() => setIsConnected((v) => !v)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
              style={
                isConnected
                  ? { background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }
                  : { background: '#6366F1', color: '#fff' }
              }
            >
              {isConnected ? 'Disconnect' : 'Connect Wallet'}
            </button>
          </div>
        </div>

        {!isConnected ? (
          <div
            className="rounded-2xl"
            style={{
              background: 'rgba(13, 13, 31, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <ConnectWalletCTA />
          </div>
        ) : (
          <div className="flex flex-col gap-6">

            {/* Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Portfolio Value */}
              <div
                className="rounded-xl p-5 sm:col-span-1"
                style={{
                  background: 'rgba(13, 13, 31, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                  Total Portfolio Value
                </p>
                <p className="text-3xl font-bold mb-2" style={{ color: '#E2E8F0' }}>
                  {fmt(totalValue)}
                </p>
                <div className="flex items-center gap-2">
                  <PriceChange value={totalChangePercent} size="sm" />
                  <span className="text-xs text-slate-500">
                    ({totalChange >= 0 ? '+' : ''}{fmt(Math.abs(totalChange))}) today
                  </span>
                </div>
              </div>

              {/* Swap Volume */}
              <div
                className="rounded-xl p-5"
                style={{
                  background: 'rgba(13, 13, 31, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                  Total Swap Volume
                </p>
                <p className="text-3xl font-bold mb-2" style={{ color: '#E2E8F0' }}>
                  {fmt(totalSwapVolume)}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ArrowRightLeft size={13} />
                  {successSwaps.length} successful swaps
                </div>
              </div>

              {/* Gas Spent */}
              <div
                className="rounded-xl p-5"
                style={{
                  background: 'rgba(13, 13, 31, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                  Gas Spent (All-time)
                </p>
                <p className="text-3xl font-bold mb-2" style={{ color: '#E2E8F0' }}>
                  {gasSpent.toFixed(3)} SUI
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Fuel size={13} />
                  ≈ {fmt(gasUsd)} at current price
                </div>
              </div>
            </div>

            {/* Token Balances */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'rgba(13, 13, 31, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <div
                className="px-6 py-4 border-b flex items-center justify-between"
                style={{ borderColor: 'rgba(99,102,241,0.15)' }}
              >
                <h2 className="font-semibold" style={{ color: '#E2E8F0' }}>
                  Token Balances
                </h2>
                <span className="text-xs text-slate-500">{MOCK_BALANCES.length} assets</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                      {['Token', 'Balance', 'Price', '24h', 'Value'].map((h) => (
                        <th
                          key={h}
                          className={`px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 ${
                            h === 'Token' ? 'text-left' : 'text-right'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_BALANCES.map((token, i) => {
                      const value = token.amount * token.price
                      const pct = (value / totalValue) * 100
                      return (
                        <tr
                          key={token.symbol}
                          className="hover:bg-white/[0.025] transition-colors"
                          style={{
                            borderBottom:
                              i < MOCK_BALANCES.length - 1
                                ? '1px solid rgba(99,102,241,0.07)'
                                : 'none',
                          }}
                        >
                          {/* Token */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: token.iconColor }}
                              >
                                {token.symbol[0]}
                              </div>
                              <div>
                                <div className="font-semibold" style={{ color: '#E2E8F0' }}>
                                  {token.symbol}
                                </div>
                                <div className="text-xs text-slate-500">{token.name}</div>
                              </div>
                              {/* Allocation bar */}
                              <div className="hidden sm:block ml-3 w-16">
                                <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${pct}%`,
                                      background: token.iconColor,
                                      opacity: 0.7,
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-600">{pct.toFixed(1)}%</span>
                              </div>
                            </div>
                          </td>

                          {/* Balance */}
                          <td className="px-5 py-4 text-right font-mono" style={{ color: '#E2E8F0' }}>
                            {fmtNum(token.amount, token.amount < 10 ? 4 : 2)}
                          </td>

                          {/* Price */}
                          <td className="px-5 py-4 text-right font-mono text-slate-400">
                            {fmt(token.price)}
                          </td>

                          {/* 24h */}
                          <td className="px-5 py-4 text-right">
                            <PriceChange value={token.change24h} size="sm" />
                          </td>

                          {/* Value */}
                          <td className="px-5 py-4 text-right font-semibold font-mono" style={{ color: '#E2E8F0' }}>
                            {fmt(value)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Swap History */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'rgba(13, 13, 31, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <div
                className="px-6 py-4 border-b flex items-center justify-between"
                style={{ borderColor: 'rgba(99,102,241,0.15)' }}
              >
                <h2 className="font-semibold" style={{ color: '#E2E8F0' }}>
                  Recent Swap History
                </h2>
                <span className="text-xs text-slate-500">Last 7 days</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                      {['Swap', 'DEX', 'Amount In', 'Amount Out', 'USD Value', 'Time', 'Status', ''].map(
                        (h, i) => (
                          <th
                            key={i}
                            className={`px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 ${
                              ['Swap', 'DEX'].includes(h) ? 'text-left' : 'text-right'
                            }`}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_SWAPS.map((swap, i) => (
                      <tr
                        key={swap.txHash}
                        className="hover:bg-white/[0.025] transition-colors"
                        style={{
                          borderBottom:
                            i < MOCK_SWAPS.length - 1
                              ? '1px solid rgba(99,102,241,0.07)'
                              : 'none',
                        }}
                      >
                        {/* Swap pair */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold" style={{ color: '#E2E8F0' }}>
                                {swap.fromToken}
                              </span>
                              <ArrowRightLeft size={12} className="text-slate-600" />
                              <span className="font-semibold" style={{ color: '#E2E8F0' }}>
                                {swap.toToken}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* DEX */}
                        <td className="px-5 py-4">
                          <DEXBadge dex={swap.dex} size="sm" />
                        </td>

                        {/* From amount */}
                        <td className="px-5 py-4 text-right font-mono text-slate-400 text-xs">
                          {swap.fromAmount}
                        </td>

                        {/* To amount */}
                        <td className="px-5 py-4 text-right font-mono text-slate-400 text-xs">
                          {swap.toAmount}
                        </td>

                        {/* USD value */}
                        <td className="px-5 py-4 text-right font-mono font-medium" style={{ color: '#E2E8F0' }}>
                          {fmt(swap.usdValue)}
                        </td>

                        {/* Time */}
                        <td className="px-5 py-4 text-right text-xs text-slate-500">
                          {swap.time}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 text-right">
                          {swap.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                              <TrendingUp size={12} />
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400">
                              <TrendingDown size={12} />
                              Failed
                            </span>
                          )}
                        </td>

                        {/* Explorer link */}
                        <td className="px-5 py-4 text-right">
                          <a
                            href={`https://suiexplorer.com/txblock/${swap.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-600 hover:text-slate-400 transition-colors"
                          >
                            <ChevronRight size={16} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

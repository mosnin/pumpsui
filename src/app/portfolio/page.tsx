'use client'

import { useMemo, useCallback, useState } from 'react'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Fuel,
  RefreshCw,
  ArrowRightLeft,
  ChevronRight,
  BarChart2,
  CheckCircle2,
} from 'lucide-react'
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit'
import { DEXBadge } from '@/components/common/DEXBadge'
import { PriceChange } from '@/components/common/PriceChange'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SUI_TOKENS } from '@/lib/tokens'
import { useRecentSwaps } from '@/hooks/useSuiEvents'
import { useTokenPrices } from '@/hooks/useTokenPrices'
import {
  generatePortfolioHistory,
  generateTradeHistory,
  computeStats,
} from '@/lib/portfolio'
import { PnLStats } from '@/components/portfolio/PnLStats'
import { PortfolioChart } from '@/components/portfolio/PortfolioChart'
import { AssetAllocation } from '@/components/portfolio/AssetAllocation'
import { TradeHistory } from '@/components/portfolio/TradeHistory'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TokenBalance {
  symbol: string
  name: string
  address: string
  logoURI: string
  amount: number
  price: number
  change24h: number
}

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

function timeAgo(timestampMs: number): string {
  const diff = Date.now() - timestampMs
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function tokenSymbol(coinType: string): string {
  const token = SUI_TOKENS.find((t) => t.address === coinType)
  if (token) return token.symbol
  // Fallback: extract last segment after '::'
  const parts = coinType.split('::')
  return parts[parts.length - 1] ?? coinType.slice(0, 6)
}

function tokenDecimals(coinType: string): number {
  return SUI_TOKENS.find((t) => t.address === coinType)?.decimals ?? 9
}

function tokenIconColor(symbol: string): string {
  const colors: Record<string, string> = {
    SUI: '#3B82F6',
    USDC: '#2563EB',
    USDT: '#26A17B',
    WETH: '#8B5CF6',
    WBTC: '#F59E0B',
    CETUS: '#00D4AA',
    TURBOS: '#EF4444',
    DEEP: '#06B6D4',
    AFT: '#6366F1',
    NAVX: '#F97316',
  }
  return colors[symbol] ?? '#6366F1'
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
    </div>
  )
}

function LiveBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{
        background: 'rgba(16,185,129,0.1)',
        border: '1px solid rgba(16,185,129,0.25)',
        color: '#10B981',
      }}
    >
      <CheckCircle2 size={11} />
      Live · Sui mainnet
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const account = useCurrentAccount()
  const isConnected = !!account
  const [isRefreshing, setIsRefreshing] = useState(false)

  // ── Balances ──────────────────────────────────────────────────────────────

  const {
    data: allBalances,
    isLoading: balancesLoading,
    refetch: refetchBalances,
  } = useSuiClientQuery(
    'getAllBalances',
    { owner: account?.address ?? '' },
    { enabled: isConnected, refetchInterval: 30_000 },
  )

  // ── Derive coingecko IDs from owned tokens ────────────────────────────────

  const ownedCoingeckoIds = useMemo(() => {
    if (!allBalances) return []
    return allBalances
      .map((b) => SUI_TOKENS.find((t) => t.address === b.coinType)?.coingeckoId)
      .filter((id): id is string => Boolean(id))
  }, [allBalances])

  const { prices, refetch: refetchPrices } = useTokenPrices(
    isConnected ? ownedCoingeckoIds : [],
  )

  // ── Map balances to display format ────────────────────────────────────────

  const tokenBalances = useMemo((): TokenBalance[] => {
    if (!allBalances) return []
    return allBalances
      .map((b) => {
        const token = SUI_TOKENS.find((t) => t.address === b.coinType)
        if (!token) return null
        const amount = Number(b.totalBalance) / 10 ** token.decimals
        if (amount === 0) return null
        const price = token.coingeckoId ? (prices[token.coingeckoId] ?? 0) : 0
        return {
          symbol: token.symbol,
          name: token.name,
          address: b.coinType,
          logoURI: token.logoURI,
          amount,
          price,
          change24h: 0,
        } satisfies TokenBalance
      })
      .filter((b): b is TokenBalance => b !== null)
      .sort((a, b) => b.amount * b.price - a.amount * a.price)
  }, [allBalances, prices])

  // ── Swap history ──────────────────────────────────────────────────────────

  const { swaps, isMockData, refresh: refreshSwaps } = useRecentSwaps(20)

  const userSwaps = useMemo(() => {
    if (isMockData) return swaps
    return swaps.filter((s) => s.user === account?.address)
  }, [swaps, isMockData, account?.address])

  // ── Summary stats ─────────────────────────────────────────────────────────

  const totalValue = useMemo(
    () => tokenBalances.reduce((sum, b) => sum + b.amount * b.price, 0),
    [tokenBalances],
  )

  const successSwapCount = useMemo(
    () => (isMockData ? 0 : userSwaps.length),
    [isMockData, userSwaps],
  )

  // ── Analytics / P&L data ──────────────────────────────────────────────────

  const demoValue = totalValue > 0 ? totalValue : 5000

  const portfolioHistory = useMemo(
    () => generatePortfolioHistory(demoValue),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [demoValue],
  )

  const tradeHistory = useMemo(() => generateTradeHistory(), [])

  const portfolioStats = useMemo(
    () => computeStats(tradeHistory, demoValue, portfolioHistory),
    [tradeHistory, demoValue, portfolioHistory],
  )

  const latestSnapshot = portfolioHistory[portfolioHistory.length - 1] ?? null

  // ── Refresh handler ───────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refetchBalances(), refetchPrices(), refreshSwaps()])
    } finally {
      setIsRefreshing(false)
    }
  }, [refetchBalances, refetchPrices, refreshSwaps])

  // ─────────────────────────────────────────────────────────────────────────

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

          {isConnected && (
            <div className="flex items-center gap-3">
              <LiveBadge />
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || balancesLoading}
                className="p-2 rounded-lg transition-all hover:opacity-80 disabled:opacity-50"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}
                title="Refresh"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          )}
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
                {balancesLoading ? (
                  <div className="flex items-center gap-2 h-9">
                    <LoadingSpinner size="sm" />
                    <span className="text-slate-500 text-sm">Loading…</span>
                  </div>
                ) : (
                  <p className="text-3xl font-bold mb-2" style={{ color: '#E2E8F0' }}>
                    {totalValue > 0 ? fmt(totalValue) : '—'}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  {tokenBalances.length} asset{tokenBalances.length !== 1 ? 's' : ''} tracked
                </p>
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
                  Recent Swaps
                </p>
                <p className="text-3xl font-bold mb-2" style={{ color: '#E2E8F0' }}>
                  {isMockData ? '—' : userSwaps.length}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ArrowRightLeft size={13} />
                  {isMockData
                    ? 'History pending contract deployment'
                    : `${successSwapCount} swap${successSwapCount !== 1 ? 's' : ''} found`}
                </div>
              </div>

              {/* Wallet address */}
              <div
                className="rounded-xl p-5"
                style={{
                  background: 'rgba(13, 13, 31, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-2">
                  Wallet
                </p>
                <p
                  className="text-sm font-mono font-semibold mb-2 truncate"
                  style={{ color: '#E2E8F0' }}
                  title={account.address}
                >
                  {account.address.slice(0, 6)}…{account.address.slice(-6)}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Fuel size={13} />
                  <a
                    href={`https://suiscan.xyz/mainnet/account/${account.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-300 transition-colors"
                  >
                    View on Suiscan ↗
                  </a>
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
                <span className="text-xs text-slate-500">
                  {balancesLoading ? 'Loading…' : `${tokenBalances.length} assets`}
                </span>
              </div>

              {balancesLoading ? (
                <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
                  <LoadingSpinner size="md" />
                  <span className="text-sm">Fetching balances from Sui…</span>
                </div>
              ) : tokenBalances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
                  <Wallet size={32} className="opacity-40" />
                  <p className="text-sm">No recognised token balances found</p>
                  <p className="text-xs text-slate-600">
                    Only tokens in the SUI_TOKENS list are shown
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                        {['Token', 'Balance', 'Price', 'Value'].map((h) => (
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
                      {tokenBalances.map((token, i) => {
                        const value = token.amount * token.price
                        const pct = totalValue > 0 ? (value / totalValue) * 100 : 0
                        const color = tokenIconColor(token.symbol)
                        return (
                          <tr
                            key={token.address}
                            className="hover:bg-white/[0.025] transition-colors"
                            style={{
                              borderBottom:
                                i < tokenBalances.length - 1
                                  ? '1px solid rgba(99,102,241,0.07)'
                                  : 'none',
                            }}
                          >
                            {/* Token */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {token.logoURI ? (
                                  <img
                                    src={token.logoURI}
                                    alt={token.symbol}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                                    onError={(e) => {
                                      const el = e.currentTarget as HTMLImageElement
                                      el.style.display = 'none'
                                      const next = el.nextElementSibling as HTMLElement | null
                                      if (next) next.style.display = 'flex'
                                    }}
                                  />
                                ) : null}
                                <div
                                  className="w-8 h-8 rounded-full items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                  style={{
                                    background: color,
                                    display: token.logoURI ? 'none' : 'flex',
                                  }}
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
                                        background: color,
                                        opacity: 0.7,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-slate-600">
                                    {pct.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Balance */}
                            <td className="px-5 py-4 text-right font-mono" style={{ color: '#E2E8F0' }}>
                              {fmtNum(token.amount, token.amount < 10 ? 4 : 2)}
                            </td>

                            {/* Price */}
                            <td className="px-5 py-4 text-right font-mono text-slate-400">
                              {token.price > 0 ? fmt(token.price) : <span className="text-slate-600">—</span>}
                            </td>

                            {/* Value */}
                            <td className="px-5 py-4 text-right font-semibold font-mono" style={{ color: '#E2E8F0' }}>
                              {value > 0 ? fmt(value) : <span className="text-slate-600">—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold" style={{ color: '#E2E8F0' }}>
                    Recent Swap History
                  </h2>
                  {isMockData && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        color: '#F59E0B',
                      }}
                    >
                      Demo data
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  {isMockData ? 'Contract not yet deployed' : `${userSwaps.length} swaps`}
                </span>
              </div>

              {userSwaps.length === 0 && !isMockData ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
                  <ArrowRightLeft size={32} className="opacity-40" />
                  <p className="text-sm">No swaps found for this wallet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                        {['Swap', 'Amount In', 'Amount Out', 'Time', 'Status', ''].map((h, i) => (
                          <th
                            key={i}
                            className={`px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 ${
                              h === 'Swap' ? 'text-left' : 'text-right'
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {userSwaps.map((swap, i) => {
                        const inSymbol = tokenSymbol(swap.coinInType)
                        const outSymbol = tokenSymbol(swap.coinOutType)
                        const inDec = tokenDecimals(swap.coinInType)
                        const outDec = tokenDecimals(swap.coinOutType)
                        const inAmt = swap.amountIn / 10 ** inDec
                        const outAmt = swap.amountOut / 10 ** outDec
                        return (
                          <tr
                            key={swap.digest}
                            className="hover:bg-white/[0.025] transition-colors"
                            style={{
                              borderBottom:
                                i < userSwaps.length - 1
                                  ? '1px solid rgba(99,102,241,0.07)'
                                  : 'none',
                            }}
                          >
                            {/* Swap pair */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold" style={{ color: '#E2E8F0' }}>
                                  {inSymbol}
                                </span>
                                <ArrowRightLeft size={12} className="text-slate-600" />
                                <span className="font-semibold" style={{ color: '#E2E8F0' }}>
                                  {outSymbol}
                                </span>
                              </div>
                            </td>

                            {/* Amount in */}
                            <td className="px-5 py-4 text-right font-mono text-slate-400 text-xs">
                              {fmtNum(inAmt, inAmt < 10 ? 4 : 2)} {inSymbol}
                            </td>

                            {/* Amount out */}
                            <td className="px-5 py-4 text-right font-mono text-slate-400 text-xs">
                              {fmtNum(outAmt, outAmt < 10 ? 4 : 2)} {outSymbol}
                            </td>

                            {/* Time */}
                            <td className="px-5 py-4 text-right text-xs text-slate-500">
                              {timeAgo(swap.timestamp)}
                            </td>

                            {/* Status — swaps from chain are all confirmed */}
                            <td className="px-5 py-4 text-right">
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                                <TrendingUp size={12} />
                                Success
                              </span>
                            </td>

                            {/* Explorer link */}
                            <td className="px-5 py-4 text-right">
                              {swap.digest && !isMockData ? (
                                <a
                                  href={`https://suiscan.xyz/mainnet/tx/${swap.digest}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-slate-600 hover:text-slate-400 transition-colors"
                                >
                                  <ChevronRight size={16} />
                                </a>
                              ) : (
                                <span className="text-slate-700">
                                  <ChevronRight size={16} />
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Analytics sections ───────────────────────────────────── */}

            {/* P&L Stats row */}
            <PnLStats stats={portfolioStats} />

            {/* Portfolio value chart */}
            <PortfolioChart history={portfolioHistory} />

            {/* Two-column: Asset Allocation + Trade History */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AssetAllocation latestSnapshot={latestSnapshot} />
              <TradeHistory trades={tradeHistory} />
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

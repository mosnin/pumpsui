'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, Star, ExternalLink, BarChart2 } from 'lucide-react'
import { findToken, SUI_TOKENS } from '@/lib/tokens'
import {
  generateOHLCV,
  computeStats,
  formatPrice,
  formatLargeNumber,
  type Candle,
} from '@/lib/chartData'
import SwapWidget from '@/components/swap/SwapWidget'
import { PriceHeader } from '@/components/charts/PriceHeader'
import { PageTransition } from '@/components/layout/PageTransition'

const CandlestickChart = dynamic(
  () => import('@/components/charts/CandlestickChart').then(m => ({ default: m.CandlestickChart })),
  { ssr: false }
)

interface TokenDetailParams {
  symbol: string
}

interface RecentTx {
  time: string
  from: string
  fromAmount: string
  to: string
  toAmount: string
  value: string
  account: string
  txId: string
}

function generateRecentTxs(symbol: string, price: number): RecentTx[] {
  const others = ['USDC', 'USDT', 'SUI'].filter(s => s !== symbol.toUpperCase())
  const now = Date.now()
  return Array.from({ length: 10 }, (_, i) => {
    const isBuy = i % 2 === 0
    const other = others[i % others.length]
    const amount = 0.5 + Math.random() * 99.5
    const value = amount * price
    const ms = now - i * (35_000 + Math.floor(Math.random() * 60_000))
    const d = new Date(ms)
    const t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const acc = '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6)
    const txId = '0x' + Math.random().toString(16).slice(2, 12)
    return {
      time: t,
      from: isBuy ? other : symbol.toUpperCase(),
      fromAmount: isBuy ? value.toFixed(2) : amount.toFixed(4),
      to: isBuy ? symbol.toUpperCase() : other,
      toAmount: isBuy ? amount.toFixed(4) : value.toFixed(2),
      value: `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      account: acc,
      txId,
    }
  })
}

export default function TokenDetailPage({ params }: { params: Promise<TokenDetailParams> }) {
  const { symbol } = use(params)
  const symbolUpper = symbol.toUpperCase()

  const token = findToken(symbolUpper) ?? SUI_TOKENS[0]

  const [candles, setCandles] = useState<Candle[]>([])
  const [isStarred, setIsStarred] = useState(false)

  useEffect(() => {
    setCandles(generateOHLCV(symbolUpper, '1h'))
    fetch(`/api/chart?token=${symbolUpper}&timeframe=1h&limit=200`)
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.candles?.length) setCandles(json.candles) })
      .catch(() => null)
  }, [symbolUpper])

  const stats = computeStats(candles, symbolUpper)
  const recentTxs = generateRecentTxs(symbolUpper, stats.price)

  return (
    <PageTransition>
    <div className="min-h-screen" style={{ background: '#060611', color: '#E2E8F0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Back + starred */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link
              href="/explore"
              className="flex items-center gap-1.5 text-sm"
              style={{ color: '#64748B' }}
            >
              <ArrowLeft size={14} />
              Explore
            </Link>
            <span style={{ color: '#334155' }}>/</span>
            <span className="text-sm font-medium" style={{ color: '#94A3B8' }}>
              {token.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStarred(s => !s)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: isStarred ? 'rgba(234,179,8,0.15)' : 'rgba(99,102,241,0.08)',
                border: isStarred ? '1px solid rgba(234,179,8,0.3)' : '1px solid rgba(99,102,241,0.2)',
                color: isStarred ? '#EAB308' : '#64748B',
              }}
            >
              <Star size={13} fill={isStarred ? 'currentColor' : 'none'} />
            </button>
            <a
              href={`https://suiscan.xyz/mainnet/coin/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: '#64748B',
              }}
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT: chart + stats + history */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Chart card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(13,13,31,0.85)',
                border: '1px solid rgba(99,102,241,0.2)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <PriceHeader
                token={symbolUpper}
                price={stats.price}
                change24h={stats.changePct24h}
                high24h={stats.high24h}
                low24h={stats.low24h}
                volume24h={stats.volume24h}
              />
              <CandlestickChart
                token={symbolUpper}
                height={320}
                showVolume={true}
              />
            </div>

            {/* Key statistics */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(13,13,31,0.85)',
                border: '1px solid rgba(99,102,241,0.2)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={15} style={{ color: '#6366F1' }} />
                <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>
                  Key Statistics
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
                {[
                  { label: 'High today',     value: `$${formatPrice(stats.high24h)}` },
                  { label: 'Low today',      value: `$${formatPrice(stats.low24h)}` },
                  { label: 'Open price',     value: `$${formatPrice(stats.openPrice)}` },
                  { label: 'Volume',         value: formatLargeNumber(stats.volume24h) },
                  { label: 'Market cap',     value: formatLargeNumber(stats.marketCap) },
                  { label: 'Avg volume',     value: formatLargeNumber(stats.avgVolume) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs mb-1" style={{ color: '#64748B' }}>{label}</p>
                    <p className="text-sm font-bold font-mono" style={{ color: '#E2E8F0' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction history */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(13,13,31,0.85)',
                border: '1px solid rgba(99,102,241,0.2)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(99,102,241,0.15)' }}>
                <h2 className="text-sm font-semibold" style={{ color: '#94A3B8' }}>
                  Recent Transactions
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                      {['Time', 'From', 'To', 'Value', 'Account'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-medium uppercase tracking-wider" style={{ color: '#475569' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentTxs.map((tx, i) => (
                      <tr
                        key={tx.txId}
                        className="hover:bg-white/[0.02] transition-colors"
                        style={{ borderBottom: i < recentTxs.length - 1 ? '1px solid rgba(99,102,241,0.07)' : 'none' }}
                      >
                        <td className="px-4 py-3" style={{ color: '#64748B' }}>{tx.time}</td>
                        <td className="px-4 py-3 font-mono" style={{ color: '#EF4444' }}>
                          {tx.fromAmount} {tx.from}
                        </td>
                        <td className="px-4 py-3 font-mono" style={{ color: '#10B981' }}>
                          {tx.toAmount} {tx.to}
                        </td>
                        <td className="px-4 py-3 font-mono" style={{ color: '#E2E8F0' }}>{tx.value}</td>
                        <td className="px-4 py-3">
                          <a
                            href={`https://suiscan.xyz/mainnet/tx/${tx.txId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono hover:opacity-80"
                            style={{ color: '#06B6D4' }}
                          >
                            {tx.account}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT: sticky swap widget */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <SwapWidget defaultTokenIn="USDC" defaultTokenOut={symbolUpper} />
            </div>
          </div>

        </div>
      </div>
    </div>
    </PageTransition>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown, Download, ExternalLink } from 'lucide-react'
import type { Trade } from '@/lib/portfolio'

type SortKey = 'timestamp' | 'pnlUsd' | 'amountInUsd'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 10

function fmtUsd(value: number): string {
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

function fmtDate(isoStr: string): string {
  const d = new Date(isoStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

function fmtTime(isoStr: string): string {
  const d = new Date(isoStr)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function exportCsv(trades: Trade[]): void {
  const header = 'Time,Pair,Amount In (USD),Amount Out (USD),P&L (USD),P&L (%),DEX,Tx Hash'
  const rows = trades.map((t) =>
    [
      new Date(t.timestamp).toISOString(),
      `${t.tokenIn}/${t.tokenOut}`,
      t.amountInUsd.toFixed(2),
      t.amountOutUsd.toFixed(2),
      t.pnlUsd.toFixed(2),
      t.pnlPercent.toFixed(2),
      t.dex,
      t.txHash,
    ].join(','),
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'omniweave-trades.csv'
  a.click()
  URL.revokeObjectURL(url)
}

interface TradeHistoryProps {
  trades: Trade[]
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  const [sortKey, setSortKey] = useState<SortKey>('timestamp')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(0)
  }

  const sorted = useMemo(() => {
    return [...trades].sort((a, b) => {
      let diff = 0
      if (sortKey === 'timestamp') {
        diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      } else if (sortKey === 'pnlUsd') {
        diff = a.pnlUsd - b.pnlUsd
      } else {
        diff = a.amountInUsd - b.amountInUsd
      }
      return sortDir === 'asc' ? diff : -diff
    })
  }, [trades, sortKey, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageSlice = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function SortIcon({ col }: { col: SortKey }) {
    return (
      <ArrowUpDown
        size={12}
        className="inline-block ml-1"
        style={{ opacity: sortKey === col ? 1 : 0.35 }}
      />
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{
        background: 'rgba(13, 13, 31, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(99,102,241,0.15)' }}
      >
        <h2 className="font-semibold text-sm" style={{ color: '#E2E8F0' }}>
          Trade History
        </h2>
        <button
          onClick={() => exportCsv(trades)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
          style={{
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: '#6366F1',
          }}
        >
          <Download size={12} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        {trades.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
            No trades found
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                <th
                  className="px-4 py-3 text-left text-slate-500 font-medium uppercase tracking-wider cursor-pointer select-none hover:text-slate-300 transition-colors"
                  onClick={() => handleSort('timestamp')}
                >
                  Time
                  <SortIcon col="timestamp" />
                </th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium uppercase tracking-wider">
                  Pair
                </th>
                <th
                  className="px-4 py-3 text-right text-slate-500 font-medium uppercase tracking-wider cursor-pointer select-none hover:text-slate-300 transition-colors"
                  onClick={() => handleSort('amountInUsd')}
                >
                  Amount In
                  <SortIcon col="amountInUsd" />
                </th>
                <th className="px-4 py-3 text-right text-slate-500 font-medium uppercase tracking-wider">
                  Amount Out
                </th>
                <th
                  className="px-4 py-3 text-right text-slate-500 font-medium uppercase tracking-wider cursor-pointer select-none hover:text-slate-300 transition-colors"
                  onClick={() => handleSort('pnlUsd')}
                >
                  P&amp;L $
                  <SortIcon col="pnlUsd" />
                </th>
                <th className="px-4 py-3 text-right text-slate-500 font-medium uppercase tracking-wider">
                  P&amp;L %
                </th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium uppercase tracking-wider">
                  DEX
                </th>
                <th className="px-4 py-3 text-center text-slate-500 font-medium uppercase tracking-wider">
                  Tx
                </th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((trade, i) => {
                const isProfit = trade.pnlUsd >= 0
                const pnlColor = isProfit ? '#10B981' : '#EF4444'
                return (
                  <tr
                    key={trade.id}
                    className="hover:bg-white/[0.025] transition-colors"
                    style={{
                      borderBottom:
                        i < pageSlice.length - 1
                          ? '1px solid rgba(99,102,241,0.07)'
                          : 'none',
                    }}
                  >
                    {/* Time */}
                    <td className="px-4 py-3 text-slate-400">
                      <div>{fmtDate(trade.timestamp)}</div>
                      <div className="text-slate-600">{fmtTime(trade.timestamp)}</div>
                    </td>

                    {/* Pair */}
                    <td className="px-4 py-3 font-semibold" style={{ color: '#E2E8F0' }}>
                      {trade.tokenIn}/{trade.tokenOut}
                    </td>

                    {/* Amount In */}
                    <td className="px-4 py-3 text-right font-mono text-slate-400">
                      {fmtUsd(trade.amountInUsd)}
                    </td>

                    {/* Amount Out */}
                    <td className="px-4 py-3 text-right font-mono text-slate-400">
                      {fmtUsd(trade.amountOutUsd)}
                    </td>

                    {/* P&L USD */}
                    <td
                      className="px-4 py-3 text-right font-mono font-semibold"
                      style={{ color: pnlColor }}
                    >
                      {isProfit ? '+' : ''}
                      {fmtUsd(trade.pnlUsd)}
                    </td>

                    {/* P&L % */}
                    <td
                      className="px-4 py-3 text-right font-mono"
                      style={{ color: pnlColor }}
                    >
                      {isProfit ? '+' : ''}
                      {trade.pnlPercent.toFixed(2)}%
                    </td>

                    {/* DEX */}
                    <td className="px-4 py-3 text-slate-400">{trade.dex}</td>

                    {/* Tx link */}
                    <td className="px-4 py-3 text-center">
                      <a
                        href={`https://suiscan.xyz/mainnet/tx/${trade.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-600 hover:text-indigo-400 transition-colors"
                        title="View on Suiscan"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="px-5 py-3 border-t flex items-center justify-between"
          style={{ borderColor: 'rgba(99,102,241,0.12)' }}
        >
          <span className="text-xs text-slate-500">
            Page {page + 1} of {totalPages} · {sorted.length} trades
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-30"
              style={{
                background: 'rgba(99,102,241,0.1)',
                color: '#6366F1',
              }}
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-30"
              style={{
                background: 'rgba(99,102,241,0.1)',
                color: '#6366F1',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

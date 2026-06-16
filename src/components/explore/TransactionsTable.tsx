'use client'

import { useState, useEffect, useCallback } from 'react'
import { generateTransactions, type Transaction } from '@/lib/explore'

// ─── Formatting helpers ────────────────────────────────────────────────────────

function fmtUsd(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toFixed(2)}`
}

// ─── Type icons ───────────────────────────────────────────────────────────────

function TypeIcon({ type }: { type: Transaction['type'] }) {
  if (type === 'swap') {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8' }}
        aria-label="Swap"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M7 16V4m0 0L3 8m4-4l4 4" />
          <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </div>
    )
  }
  if (type === 'add_liquidity') {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
        aria-label="Add liquidity"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </div>
    )
  }
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
      aria-label="Remove liquidity"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    </div>
  )
}

function typeLabel(type: Transaction['type']): string {
  if (type === 'swap') return 'Swap'
  if (type === 'add_liquidity') return 'Add'
  return 'Remove'
}

// ─── Generate synthetic transactions for refresh ──────────────────────────────

let _refreshSeed = 200

function nextTx(): Transaction {
  _refreshSeed += 13
  const txs = generateTransactions()
  return txs[_refreshSeed % txs.length]
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialRows: Transaction[]
}

export function TransactionsTable({ initialRows }: Props) {
  const [rows, setRows] = useState<Transaction[]>(initialRows)

  const addNewTx = useCallback(() => {
    const tx = nextTx()
    // Give it a fresh "just now" timestamp
    const fresh: Transaction = { ...tx, timestamp: 'just now', hash: tx.hash + _refreshSeed.toString(16) }
    setRows((prev) => [fresh, ...prev.slice(0, 49)])
  }, [])

  useEffect(() => {
    const id = setInterval(addNewTx, 10_000)
    return () => clearInterval(id)
  }, [addNewTx])

  return (
    <div>
      {/* Live indicator */}
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
        <span className="text-xs text-slate-400">Showing {rows.length} transactions</span>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Auto-refreshing every 10s
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
              <th className="text-left px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Type</span>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Tokens</span>
              </th>
              <th className="text-right px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">USD Value</span>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Account</span>
              </th>
              <th className="text-right px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Time</span>
              </th>
              <th className="px-4 py-3 w-32" />
            </tr>
          </thead>
          <tbody>
            {rows.map((tx, idx) => (
              <tr
                key={`${tx.hash}-${idx}`}
                className="transition-colors hover:bg-white/[0.02]"
                style={{ borderBottom: '1px solid rgba(99,102,241,0.07)' }}
              >
                {/* Type */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <TypeIcon type={tx.type} />
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color:
                          tx.type === 'swap'
                            ? '#818CF8'
                            : tx.type === 'add_liquidity'
                            ? '#10B981'
                            : '#EF4444',
                      }}
                    >
                      {typeLabel(tx.type)}
                    </span>
                  </div>
                </td>

                {/* Tokens */}
                <td className="px-4 py-3">
                  <div className="font-semibold text-sm" style={{ color: '#E2E8F0' }}>
                    {tx.token0} {tx.type === 'swap' ? '→' : '+'} {tx.token1}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{tx.dex}</div>
                </td>

                {/* USD Value */}
                <td className="px-4 py-3 text-right font-mono text-sm" style={{ color: '#E2E8F0' }}>
                  {fmtUsd(tx.amountUsd)}
                </td>

                {/* Account */}
                <td className="px-4 py-3">
                  <a
                    href={`https://suiscan.xyz/mainnet/account/${tx.account}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {tx.account}
                  </a>
                </td>

                {/* Time */}
                <td className="px-4 py-3 text-right text-xs text-slate-500">
                  {tx.timestamp}
                </td>

                {/* View on Suiscan */}
                <td className="px-4 py-3 text-right">
                  <a
                    href={`https://suiscan.xyz/mainnet/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                    aria-label={`View transaction ${tx.hash} on Suiscan`}
                  >
                    <span className="hidden sm:inline">Suiscan</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

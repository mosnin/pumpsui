'use client'

/**
 * Bridge transaction history page.
 *
 * Features:
 *  - Lists all past bridge transactions stored in localStorage
 *  - Real-time status tracking with live Wormhole Scan polling
 *  - Links to source-chain explorer + Suiscan for each tx
 *  - "Claim" button for unclaimed Wormhole transfers (status = 'claiming')
 *  - Filterable by status / bridge
 *  - Pagination (10 per page)
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ExternalLink,
  Trash2,
  RefreshCw,
  ArrowLeftRight,
  Filter,
} from 'lucide-react'
import {
  loadBridgeTxs,
  saveBridgeTxs,
  updateBridgeTx,
  useWormholeStatusPoll,
} from '@/components/bridge/BridgeTransactionTracker'
import type { BridgeTxRecord, BridgeTxLocalStatus } from '@/components/bridge/BridgeTransactionTracker'
import { SUPPORTED_CHAINS } from '@/lib/bridges/types'
import { formatEstimatedTime } from '@/lib/bridges'

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<BridgeTxLocalStatus, { label: string; color: string; bg: string }> = {
  submitted:  { label: 'Submitted',  color: '#93C5FD', bg: 'rgba(59,130,246,0.12)'  },
  confirming: { label: 'Confirming', color: '#FCD34D', bg: 'rgba(245,158,11,0.12)'  },
  bridging:   { label: 'Bridging',   color: '#A78BFA', bg: 'rgba(139,92,246,0.12)'  },
  claiming:   { label: 'Claiming',   color: '#F97316', bg: 'rgba(249,115,22,0.12)'  },
  complete:   { label: 'Complete',   color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
  failed:     { label: 'Failed',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
}

function StatusBadge({ status }: { status: BridgeTxLocalStatus }) {
  const { label, color, bg } = STATUS_LABELS[status]
  const Icon = status === 'complete'   ? CheckCircle2 :
               status === 'failed'     ? XCircle :
               status === 'submitted'  ||
               status === 'confirming' ||
               status === 'bridging'   ||
               status === 'claiming'   ? Loader2 : Clock

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full"
      style={{ color, background: bg }}
    >
      <Icon
        className={`w-3 h-3 ${['submitted','confirming','bridging','claiming'].includes(status) ? 'animate-spin' : ''}`}
      />
      {label}
    </span>
  )
}

// ─── Time display ─────────────────────────────────────────────────────────────

function RelativeTime({ ts }: { ts: number }) {
  const elapsed = Math.floor((Date.now() - ts) / 1000)
  let text: string
  if (elapsed < 60)       text = `${elapsed}s ago`
  else if (elapsed < 3600) text = `${Math.floor(elapsed / 60)}m ago`
  else if (elapsed < 86400) text = `${Math.floor(elapsed / 3600)}h ago`
  else                    text = new Date(ts).toLocaleDateString()

  return <span className="text-xs text-slate-500">{text}</span>
}

// ─── Single history row ───────────────────────────────────────────────────────

function TxHistoryRow({
  tx,
  onDelete,
}: {
  tx: BridgeTxRecord
  onDelete: (id: string) => void
}) {
  const fromChain = SUPPORTED_CHAINS.find((c) => c.id === tx.fromChainId)
  const toChain   = SUPPORTED_CHAINS.find((c) => c.id === tx.toChainId)

  const srcExplorer = fromChain?.explorerUrl ?? 'https://etherscan.io'
  const srcTxUrl    = tx.txHash    ? `${srcExplorer}/tx/${tx.txHash}` : null
  const destTxUrl   = tx.destTxHash ? `https://suiscan.xyz/tx/${tx.destTxHash}` : null

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-200"
      style={{
        background: 'rgba(13,13,31,0.7)',
        border: tx.status === 'complete'
          ? '1px solid rgba(16,185,129,0.2)'
          : tx.status === 'failed'
          ? '1px solid rgba(239,68,68,0.2)'
          : `1px solid ${tx.bridgeColor}20`,
      }}
    >
      {/* Row header */}
      <div className="flex items-start gap-3">
        {/* Bridge icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
          style={{
            background: `${tx.bridgeColor}18`,
            border: `1px solid ${tx.bridgeColor}35`,
            color: tx.bridgeColor,
          }}
        >
          {tx.bridgeName.slice(0, 2).toUpperCase()}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-100">
              {tx.fromAmount} {tx.tokenSymbol}
            </span>
            <ArrowLeftRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-slate-100">
              {tx.toAmount} {tx.tokenSymbol}
            </span>
            <StatusBadge status={tx.status} />
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="text-xs text-slate-500">
              {fromChain?.name ?? `Chain ${tx.fromChainId}`}
              {' → '}
              {toChain?.name ?? `Chain ${tx.toChainId}`}
            </span>
            <span className="text-slate-700">·</span>
            <span className="text-xs text-slate-500">via {tx.bridgeName}</span>
            <span className="text-slate-700">·</span>
            <RelativeTime ts={tx.timestamp} />
          </div>

          {/* Explorer links */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {srcTxUrl && (
              <a
                href={srcTxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs transition-colors"
                style={{ color: '#6366F1' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#818CF8' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#6366F1' }}
              >
                Source tx
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {destTxUrl && (
              <a
                href={destTxUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs transition-colors"
                style={{ color: '#06B6D4' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#38BDF8' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#06B6D4' }}
              >
                View on Suiscan
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {tx.vaaId && (
              <a
                href={`https://wormholescan.io/#/tx/${tx.vaaId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs transition-colors"
                style={{ color: '#7C3AED' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#A78BFA' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#7C3AED' }}
              >
                Wormhole scan
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Error message */}
          {tx.status === 'failed' && tx.errorMessage && (
            <div
              className="mt-2 px-3 py-2 rounded-lg text-xs"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#FCA5A5',
              }}
            >
              {tx.errorMessage}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Claim button for stuck transfers */}
          {tx.status === 'claiming' && (
            <a
              href="https://portalbridge.com/sui?recover=true"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: `${tx.bridgeColor}20`,
                border: `1px solid ${tx.bridgeColor}40`,
                color: tx.bridgeColor,
              }}
            >
              Claim
            </a>
          )}

          {/* Delete button */}
          <button
            onClick={() => onDelete(tx.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-slate-600 hover:text-red-400"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            title="Remove from history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyHistory({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
      style={{ border: '1px dashed rgba(99,102,241,0.2)' }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        <ArrowLeftRight className="w-6 h-6" style={{ color: '#6366F1' }} />
      </div>
      <p className="text-sm font-medium text-slate-300 mb-1">
        {hasFilter ? 'No matching transactions' : 'No bridge history yet'}
      </p>
      <p className="text-xs text-slate-500 max-w-xs">
        {hasFilter
          ? 'Try clearing the filter to see all transactions.'
          : 'When you bridge assets through OmniWeave, your transaction history will appear here.'}
      </p>
      {!hasFilter && (
        <Link
          href="/bridge"
          className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
            color: '#fff',
          }}
        >
          Bridge now
        </Link>
      )}
    </div>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

const FILTER_OPTIONS: Array<{ value: BridgeTxLocalStatus | 'all'; label: string }> = [
  { value: 'all',        label: 'All' },
  { value: 'submitted',  label: 'Submitted' },
  { value: 'confirming', label: 'Confirming' },
  { value: 'bridging',   label: 'Bridging' },
  { value: 'claiming',   label: 'Claiming' },
  { value: 'complete',   label: 'Complete' },
  { value: 'failed',     label: 'Failed' },
]

// ─── Main page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export default function BridgeHistoryPage() {
  const [txs, setTxs] = useState<BridgeTxRecord[]>([])
  const [filterStatus, setFilterStatus] = useState<BridgeTxLocalStatus | 'all'>('all')
  const [filterBridge, setFilterBridge] = useState<string>('all')
  const [page, setPage] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage after mount (avoid SSR mismatch)
  useEffect(() => {
    setIsHydrated(true)
    setTxs(loadBridgeTxs().slice().reverse()) // newest first
  }, [refreshKey])

  // Update a transaction in state + localStorage
  const handleUpdate = useCallback((id: string, patch: Partial<BridgeTxRecord>) => {
    updateBridgeTx(id, patch)
    setTxs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    )
  }, [])

  // Poll Wormhole Scan for status on active Wormhole transactions
  useWormholeStatusPoll(txs, handleUpdate)

  // Delete a transaction from history
  const handleDelete = useCallback((id: string) => {
    const updated = txs.filter((t) => t.id !== id)
    saveBridgeTxs([...updated].reverse()) // restore chronological order for storage
    setTxs(updated)
  }, [txs])

  // Clear all history
  const handleClearAll = () => {
    saveBridgeTxs([])
    setTxs([])
  }

  // Get unique bridge IDs present in history
  const bridgeIds = Array.from(new Set(txs.map((t) => t.bridgeId)))

  // Filtered + paginated
  const filtered = txs.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterBridge !== 'all' && t.bridgeId !== filterBridge) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const hasFilter = filterStatus !== 'all' || filterBridge !== 'all'

  const activeTxCount = txs.filter(
    (t) => t.status !== 'complete' && t.status !== 'failed'
  ).length

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen py-16 px-4 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 right-1/4 w-72 h-72 bg-cyan-500/6 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Back nav */}
        <div className="mb-8">
          <Link
            href="/bridge"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to bridge
          </Link>
        </div>

        {/* Page header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Bridge History</h1>
            <p className="text-sm text-slate-400 mt-1">
              {txs.length} total transaction{txs.length !== 1 ? 's' : ''}
              {activeTxCount > 0 && (
                <span className="ml-2 text-indigo-400">
                  · {activeTxCount} in progress
                </span>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-slate-400 hover:text-slate-200"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            {txs.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-slate-500 hover:text-red-400"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {txs.length > 0 && (
          <div
            className="flex items-center gap-2 p-3 rounded-2xl mb-5 flex-wrap"
            style={{ background: 'rgba(13,13,31,0.6)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <Filter className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />

            {/* Status filter */}
            <div className="flex items-center gap-1 flex-wrap">
              {FILTER_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { setFilterStatus(value as BridgeTxLocalStatus | 'all'); setPage(0) }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: filterStatus === value
                      ? 'rgba(99,102,241,0.2)'
                      : 'transparent',
                    color: filterStatus === value ? '#818CF8' : '#64748B',
                    border: filterStatus === value
                      ? '1px solid rgba(99,102,241,0.4)'
                      : '1px solid transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Bridge filter */}
            {bridgeIds.length > 1 && (
              <>
                <div className="w-px h-4 bg-slate-700 mx-1" />
                <select
                  value={filterBridge}
                  onChange={(e) => { setFilterBridge(e.target.value); setPage(0) }}
                  className="text-xs text-slate-300 bg-transparent outline-none cursor-pointer"
                  style={{ background: 'rgba(13,13,31,0)' }}
                >
                  <option value="all" style={{ background: '#0D0D1F' }}>All bridges</option>
                  {bridgeIds.map((id) => (
                    <option key={id} value={id} style={{ background: '#0D0D1F' }}>
                      {txs.find((t) => t.bridgeId === id)?.bridgeName ?? id}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        )}

        {/* Transaction list */}
        {filtered.length === 0 ? (
          <EmptyHistory hasFilter={hasFilter} />
        ) : (
          <>
            <div className="space-y-3">
              {paginated.map((tx) => (
                <TxHistoryRow key={tx.id} tx={tx} onDelete={handleDelete} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 px-1">
                <span className="text-xs text-slate-500">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: page === 0 ? '#334155' : '#94A3B8',
                      border: '1px solid rgba(99,102,241,0.15)',
                      cursor: page === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: page >= totalPages - 1 ? '#334155' : '#94A3B8',
                      border: '1px solid rgba(99,102,241,0.15)',
                      cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Summary stats */}
        {txs.length > 0 && (
          <div
            className="grid grid-cols-3 gap-3 mt-8 p-4 rounded-2xl"
            style={{ background: 'rgba(13,13,31,0.5)', border: '1px solid rgba(99,102,241,0.12)' }}
          >
            <div className="text-center">
              <div className="text-xl font-bold text-slate-100">{txs.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Total bridges</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: '#10B981' }}>
                {txs.filter((t) => t.status === 'complete').length}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: activeTxCount > 0 ? '#A78BFA' : '#475569' }}>
                {activeTxCount}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">In progress</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

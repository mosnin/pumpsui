'use client'

/**
 * BridgeTransactionTracker — real-time step-by-step tracker for in-progress bridge transfers.
 *
 * Displays:
 *   Source chain: [✓] Transaction submitted → [✓] Confirmed (X blocks)
 *   Bridge layer: [⟳] Generating proof / VAA...
 *   Destination:  [⟳] Waiting to claim on Sui
 *
 * Persists the transaction list to localStorage under the key "omniweave:bridge-txs".
 * Polls Wormhole Scan for VAA status on Wormhole transactions.
 */

import { useEffect, useRef, useCallback } from 'react'
import { CheckCircle2, XCircle, Loader2, Clock, ExternalLink, AlertCircle } from 'lucide-react'
import { SUPPORTED_CHAINS } from '@/lib/bridges/types'

// ─── Public types ─────────────────────────────────────────────────────────────

export type BridgeTxLocalStatus =
  | 'submitted'   // tx signed & broadcast on source chain
  | 'confirming'  // source-chain block confirmations in progress
  | 'bridging'    // cross-chain relay / VAA generation / proof building
  | 'claiming'    // waiting for destination-chain claim / auto-redeem
  | 'complete'    // funds arrived on Sui
  | 'failed'      // error at any step

export interface BridgeTxRecord {
  /** Unique local ID (uuid-style, generated at creation) */
  id: string
  /** Which bridge was used */
  bridgeId: string
  bridgeName: string
  bridgeColor: string
  /** Chain IDs */
  fromChainId: number
  toChainId: number
  /** Source-chain transaction hash */
  txHash: string
  /** Destination-chain claim tx (filled in when complete) */
  destTxHash?: string
  /** Current step */
  status: BridgeTxLocalStatus
  /** Human-readable token info */
  fromAmount: string   // e.g. "100.00"
  toAmount: string     // e.g. "99.70"
  tokenSymbol: string  // e.g. "USDC"
  /** Unix ms timestamp when the source tx was submitted */
  timestamp: number
  /** Error message if failed */
  errorMessage?: string
  /** Wormhole VAA id if available */
  vaaId?: string
}

export const BRIDGE_TX_STORAGE_KEY = 'omniweave:bridge-txs'

// ─── localStorage helpers ─────────────────────────────────────────────────────

export function loadBridgeTxs(): BridgeTxRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(BRIDGE_TX_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BridgeTxRecord[]
  } catch {
    return []
  }
}

export function saveBridgeTxs(txs: BridgeTxRecord[]): void {
  if (typeof window === 'undefined') return
  try {
    // Keep only the most recent 50
    const trimmed = txs.slice(-50)
    localStorage.setItem(BRIDGE_TX_STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage quota exceeded — ignore
  }
}

export function addBridgeTx(tx: BridgeTxRecord): void {
  const existing = loadBridgeTxs()
  saveBridgeTxs([...existing, tx])
}

export function updateBridgeTx(id: string, patch: Partial<BridgeTxRecord>): void {
  const existing = loadBridgeTxs()
  saveBridgeTxs(existing.map((t) => (t.id === id ? { ...t, ...patch } : t)))
}

/** Generate a simple unique ID */
export function generateTxId(): string {
  return `btx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ─── Step definitions ─────────────────────────────────────────────────────────

interface Step {
  id: BridgeTxLocalStatus
  label: string
  sublabel?: string
}

function getSteps(bridgeId: string): Step[] {
  const bridgeLabel = bridgeId === 'wormhole' ? 'Wormhole VAA' :
                      bridgeId === 'mayan'     ? 'Mayan Auction' :
                      bridgeId === 'layerzero' ? 'LayerZero DVN' :
                      bridgeId === 'celer'     ? 'cBridge Relay' :
                      bridgeId === 'axelar'    ? 'Axelar Gateway' :
                      bridgeId === 'allbridge' ? 'AllBridge Relay' :
                      'Bridge Relay'

  return [
    { id: 'submitted',  label: 'Transaction submitted',       sublabel: 'Broadcast to source chain' },
    { id: 'confirming', label: 'Awaiting confirmations',      sublabel: 'Source-chain block confirmations' },
    { id: 'bridging',   label: `${bridgeLabel} in progress`,  sublabel: 'Cross-chain message / proof generation' },
    { id: 'claiming',   label: 'Claiming on Sui',             sublabel: 'Funds arriving in your Sui wallet' },
    { id: 'complete',   label: 'Transfer complete',           sublabel: 'Funds delivered on Sui' },
  ]
}

const STATUS_ORDER: BridgeTxLocalStatus[] = [
  'submitted', 'confirming', 'bridging', 'claiming', 'complete',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIcon({
  isDone,
  isActive,
  isFailed,
}: {
  isDone: boolean
  isActive: boolean
  isFailed: boolean
}) {
  if (isDone) {
    return <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#10B981' }} />
  }
  if (isFailed && isActive) {
    return <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#EF4444' }} />
  }
  if (isActive) {
    return <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" style={{ color: '#6366F1' }} />
  }
  return (
    <div
      className="w-5 h-5 rounded-full flex-shrink-0"
      style={{ border: '2px solid rgba(255,255,255,0.1)' }}
    />
  )
}

function ExplorerLink({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
      style={{ color: '#6366F1' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = '#818CF8' }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#6366F1' }}
    >
      {label}
      <ExternalLink className="w-3 h-3" />
    </a>
  )
}

function TimeAgo({ ts }: { ts: number }) {
  const elapsed = Math.floor((Date.now() - ts) / 1000)
  const text = elapsed < 60
    ? `${elapsed}s ago`
    : elapsed < 3600
    ? `${Math.floor(elapsed / 60)}m ago`
    : `${Math.floor(elapsed / 3600)}h ago`
  return <span className="text-xs text-slate-500">{text}</span>
}

// ─── Single transaction row ───────────────────────────────────────────────────

function TxRow({
  tx,
  onDismiss,
}: {
  tx: BridgeTxRecord
  onDismiss: (id: string) => void
}) {
  const steps = getSteps(tx.bridgeId)
  const currentIdx = STATUS_ORDER.indexOf(tx.status)
  const isFailed = tx.status === 'failed'

  const fromChain = SUPPORTED_CHAINS.find((c) => c.id === tx.fromChainId)
  const toChain   = SUPPORTED_CHAINS.find((c) => c.id === tx.toChainId)

  // Build explorer URLs
  const srcExplorerBase = fromChain?.explorerUrl ?? 'https://etherscan.io'
  const srcTxUrl = tx.txHash ? `${srcExplorerBase}/tx/${tx.txHash}` : null
  const destTxUrl = tx.destTxHash ? `https://suiscan.xyz/tx/${tx.destTxHash}` : null

  const isDismissable = tx.status === 'complete' || tx.status === 'failed'

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(13,13,31,0.8)',
        border: isFailed
          ? '1px solid rgba(239,68,68,0.3)'
          : tx.status === 'complete'
          ? '1px solid rgba(16,185,129,0.3)'
          : `1px solid ${tx.bridgeColor}30`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between px-4 py-3"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: `${tx.bridgeColor}08`,
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Bridge badge */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: `${tx.bridgeColor}20`,
              border: `1px solid ${tx.bridgeColor}40`,
              color: tx.bridgeColor,
            }}
          >
            {tx.bridgeName.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-100">
                {tx.fromAmount} {tx.tokenSymbol}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="#64748b" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span className="text-sm font-semibold text-slate-100">
                {tx.toAmount} {tx.tokenSymbol} on Sui
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500">{fromChain?.name ?? 'Source'} → {toChain?.name ?? 'Sui'}</span>
              <span className="text-slate-700">·</span>
              <TimeAgo ts={tx.timestamp} />
            </div>
          </div>
        </div>

        {isDismissable && (
          <button
            onClick={() => onDismiss(tx.id)}
            className="ml-2 flex-shrink-0 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Steps */}
      <div className="px-4 py-3 space-y-2.5">
        {steps.map((step, idx) => {
          const isDone    = !isFailed && (currentIdx > idx || tx.status === 'complete')
          const isActive  = STATUS_ORDER[currentIdx] === step.id
          const stepFailed = isFailed && isActive

          return (
            <div key={step.id} className="flex items-start gap-3">
              <StepIcon isDone={isDone} isActive={isActive} isFailed={stepFailed} />

              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-medium"
                  style={{
                    color: isDone        ? '#10B981'
                         : stepFailed   ? '#EF4444'
                         : isActive     ? '#E2E8F0'
                         : '#475569',
                  }}
                >
                  {step.label}
                </div>
                {(isActive || isDone) && step.sublabel && (
                  <div className="text-xs text-slate-500 mt-0.5">{step.sublabel}</div>
                )}

                {/* Contextual links */}
                {isActive && idx === 0 && srcTxUrl && (
                  <div className="mt-1">
                    <ExplorerLink href={srcTxUrl} label="View on explorer" />
                  </div>
                )}
                {isDone && idx === 0 && srcTxUrl && (
                  <div className="mt-1">
                    <ExplorerLink href={srcTxUrl} label="Source tx" />
                  </div>
                )}
                {isDone && idx === 3 && destTxUrl && (
                  <div className="mt-1">
                    <ExplorerLink href={destTxUrl} label="View on Suiscan" />
                  </div>
                )}
                {tx.vaaId && idx === 2 && (isDone || isActive) && (
                  <div className="mt-1">
                    <ExplorerLink
                      href={`https://wormholescan.io/#/tx/${tx.vaaId}`}
                      label="Wormhole scan"
                    />
                  </div>
                )}
              </div>

              {/* Connector line to next step */}
              {idx < steps.length - 1 && (
                <div
                  className="absolute mt-5 ml-[9px] w-px h-5"
                  style={{
                    background: isDone
                      ? 'rgba(16,185,129,0.3)'
                      : 'rgba(255,255,255,0.05)',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Error message */}
      {isFailed && tx.errorMessage && (
        <div
          className="mx-4 mb-3 flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#FCA5A5',
          }}
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{tx.errorMessage}</span>
        </div>
      )}

      {/* Claim button for manual-claim bridges */}
      {tx.status === 'claiming' && (
        <div className="px-4 pb-3">
          <a
            href={`https://portalbridge.com/sui?recover=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: `${tx.bridgeColor}20`,
              border: `1px solid ${tx.bridgeColor}50`,
              color: tx.bridgeColor,
            }}
          >
            Claim on Sui
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Main tracker component ───────────────────────────────────────────────────

interface BridgeTransactionTrackerProps {
  /** Transactions to display (caller manages the list) */
  transactions: BridgeTxRecord[]
  /** Called when the user dismisses a completed/failed tx */
  onDismiss: (id: string) => void
  /** If true, only show in-progress transactions */
  activeOnly?: boolean
  className?: string
}

export default function BridgeTransactionTracker({
  transactions,
  onDismiss,
  activeOnly = false,
  className = '',
}: BridgeTransactionTrackerProps) {
  const shown = activeOnly
    ? transactions.filter((t) => t.status !== 'complete' && t.status !== 'failed')
    : transactions

  if (shown.length === 0) return null

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: '#64748B' }}>
          {activeOnly ? 'Active Transfers' : 'Bridge Transfers'}
        </h3>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
          <Clock className="w-3 h-3" />
          {shown.filter((t) => t.status !== 'complete' && t.status !== 'failed').length > 0
            ? 'In progress'
            : 'All done'}
        </div>
      </div>

      {shown.map((tx) => (
        <TxRow key={tx.id} tx={tx} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// ─── Hook: poll for status updates on active transactions ─────────────────────

/**
 * useWormholeStatusPoll — polls wormholescan for VAA status on active Wormhole txs.
 *
 * @param txs        The full tx list from localStorage
 * @param onUpdate   Callback invoked with (id, patch) when status changes
 */
export function useWormholeStatusPoll(
  txs: BridgeTxRecord[],
  onUpdate: (id: string, patch: Partial<BridgeTxRecord>) => void
) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  const pollOnce = useCallback(async () => {
    const active = txs.filter(
      (t) => t.bridgeId === 'wormhole' &&
             (t.status === 'confirming' || t.status === 'bridging') &&
             t.txHash
    )
    if (active.length === 0) return

    for (const tx of active) {
      try {
        const resp = await fetch(
          `https://api.wormholescan.io/api/v1/transactions/${tx.txHash}`,
          { signal: AbortSignal.timeout(5000) }
        )
        if (!resp.ok) continue
        const data = await resp.json()

        // If global tx found and has a VAA, it's at least 'bridging'
        if (data?.id && tx.status === 'confirming') {
          onUpdateRef.current(tx.id, { status: 'bridging', vaaId: data.id })
        }

        // If redeemed / completed
        if (data?.globalTx?.destinationTx?.txHash) {
          onUpdateRef.current(tx.id, {
            status: 'complete',
            destTxHash: data.globalTx.destinationTx.txHash,
          })
        }
      } catch {
        // Network error — ignore, will retry next interval
      }
    }
  }, [txs])

  useEffect(() => {
    // Initial poll
    pollOnce()
    // Poll every 15 seconds
    const interval = setInterval(pollOnce, 15_000)
    return () => clearInterval(interval)
  }, [pollOnce])
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import {
  TWAPOrder,
  TWAP_STATUS,
  formatTWAPProgress,
  formatCountdown,
  msToNextExecution,
  buildCancelTWAPTx,
  formatTokenAmount,
} from '@/lib/twap'
import { findToken } from '@/lib/tokens'

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ executed, total }: { executed: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (executed / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)', minWidth: 60 }}
        role="progressbar"
        aria-valuenow={executed}
        aria-valuemax={total}
        aria-label={`${executed} of ${total} chunks executed`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct >= 100
              ? '#10B981'
              : 'linear-gradient(90deg, #6366F1, #06B6D4)',
          }}
        />
      </div>
      <span className="text-xs font-mono flex-shrink-0" style={{ color: '#64748B' }}>
        {formatTWAPProgress(executed, total)}
      </span>
    </div>
  )
}

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(lastExecutionMs: number, intervalMs: number) {
  const [ms, setMs] = useState(() => msToNextExecution(lastExecutionMs, intervalMs))

  useEffect(() => {
    const id = setInterval(() => {
      setMs(msToNextExecution(lastExecutionMs, intervalMs))
    }, 10_000)
    return () => clearInterval(id)
  }, [lastExecutionMs, intervalMs])

  return ms
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: number }) {
  const configs = {
    [TWAP_STATUS.ACTIVE]: {
      label: 'Active',
      bg: 'rgba(16,185,129,0.12)',
      border: 'rgba(16,185,129,0.3)',
      color: '#10B981',
    },
    [TWAP_STATUS.COMPLETED]: {
      label: 'Completed',
      bg: 'rgba(99,102,241,0.12)',
      border: 'rgba(99,102,241,0.3)',
      color: '#818CF8',
    },
    [TWAP_STATUS.CANCELLED]: {
      label: 'Cancelled',
      bg: 'rgba(239,68,68,0.1)',
      border: 'rgba(239,68,68,0.25)',
      color: '#EF4444',
    },
  } as const

  const c = configs[status as keyof typeof configs] ?? configs[TWAP_STATUS.ACTIVE]

  return (
    <span
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: c.color,
          boxShadow: status === TWAP_STATUS.ACTIVE ? `0 0 6px ${c.color}` : 'none',
        }}
      />
      {c.label}
    </span>
  )
}

// ─── Token pair display ───────────────────────────────────────────────────────

function TokenPairDisplay({
  symbolIn,
  symbolOut,
  logoIn,
  logoOut,
}: {
  symbolIn: string
  symbolOut: string
  logoIn?: string
  logoOut?: string
}) {
  const fallbackSvg = (symbol: string) =>
    `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><rect width='24' height='24' rx='12' fill='%23312e81'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='10' font-weight='bold'>${symbol[0]}</text></svg>`

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex-shrink-0" style={{ width: 38, height: 24 }}>
        <img
          src={logoIn ?? fallbackSvg(symbolIn)}
          alt={symbolIn}
          width={24}
          height={24}
          className="rounded-full absolute left-0 top-0"
          style={{ border: '2px solid #0d0d1f' }}
          onError={(e) => { e.currentTarget.src = fallbackSvg(symbolIn) }}
        />
        <img
          src={logoOut ?? fallbackSvg(symbolOut)}
          alt={symbolOut}
          width={24}
          height={24}
          className="rounded-full absolute left-3.5 top-0"
          style={{ border: '2px solid #0d0d1f' }}
          onError={(e) => { e.currentTarget.src = fallbackSvg(symbolOut) }}
        />
      </div>
      <div>
        <span className="text-sm font-bold" style={{ color: '#E2E8F0' }}>{symbolIn}</span>
        <span className="text-sm mx-1" style={{ color: '#475569' }}>→</span>
        <span className="text-sm font-bold" style={{ color: '#06B6D4' }}>{symbolOut}</span>
      </div>
    </div>
  )
}

// ─── Stat cell ────────────────────────────────────────────────────────────────

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: '#475569' }}>{label}</p>
      <p className="text-xs font-semibold" style={{ color: highlight ? '#818CF8' : '#94A3B8' }}>{value}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface TWAPOrderCardProps {
  order: TWAPOrder
  onCancelled?: (orderId: string) => void
}

export function TWAPOrderCard({ order, onCancelled }: TWAPOrderCardProps) {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()
  const [cancelling, setCancelling] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const tokenInMeta = findToken(order.tokenIn)
  const tokenOutMeta = findToken(order.tokenOut)

  const countdownMs = useCountdown(order.lastExecutionMs, order.intervalMs)
  const isActive = order.status === TWAP_STATUS.ACTIVE
  const isCompleted = order.status === TWAP_STATUS.COMPLETED

  const inputDecimals = tokenInMeta?.decimals ?? 6

  const totalSpentAmount = order.chunkAmount * BigInt(order.chunksExecuted)
  const remainingAmount = order.totalAmount - totalSpentAmount

  const totalSpent = formatTokenAmount(totalSpentAmount, inputDecimals, 2)
  const remaining = formatTokenAmount(remainingAmount > 0n ? remainingAmount : 0n, inputDecimals, 2)
  const chunkDisplay = formatTokenAmount(order.chunkAmount, inputDecimals, 2)

  const handleCancel = useCallback(async () => {
    setCancelling(true)
    setFeedback(null)
    try {
      const tx = buildCancelTWAPTx(order.id)
      // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
      await signAndExecute({ transaction: tx })
      onCancelled?.(order.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transaction failed'
      setFeedback({ type: 'error', msg })
    } finally {
      setCancelling(false)
    }
  }, [order.id, signAndExecute, onCancelled])

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(99,102,241,0.12)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <TokenPairDisplay
          symbolIn={order.tokenInSymbol}
          symbolOut={order.tokenOutSymbol}
          logoIn={tokenInMeta?.logoURI}
          logoOut={tokenOutMeta?.logoURI}
        />
        <StatusBadge status={order.status} />
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs" style={{ color: '#64748B' }}>Progress</span>
        </div>
        <ProgressBar executed={order.chunksExecuted} total={order.numChunks} />
      </div>

      {/* Stats grid */}
      <div
        className="grid grid-cols-2 gap-x-4 gap-y-2.5 p-3 rounded-xl mb-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.08)' }}
      >
        <Stat
          label="Per chunk"
          value={`${chunkDisplay} ${order.tokenInSymbol}`}
        />
        <Stat
          label="Total amount"
          value={`${formatTokenAmount(order.totalAmount, inputDecimals, 2)} ${order.tokenInSymbol}`}
        />
        <Stat
          label="Spent"
          value={`${totalSpent} ${order.tokenInSymbol}`}
        />
        <Stat
          label="Remaining"
          value={`${remaining} ${order.tokenInSymbol}`}
          highlight
        />
      </div>

      {/* Next execution countdown */}
      {isActive && (
        <div
          className="flex items-center justify-between px-3 py-2 rounded-xl mb-3"
          style={{
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.15)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4l3 3" />
            </svg>
            <span className="text-xs" style={{ color: '#64748B' }}>Next chunk in</span>
          </div>
          <span className="text-xs font-semibold" style={{ color: '#10B981' }}>
            {countdownMs === 0 ? 'Ready now' : formatCountdown(countdownMs)}
          </span>
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div
          className="px-3 py-2 rounded-xl text-xs mb-3"
          style={{
            background: feedback.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: feedback.type === 'success' ? '#10B981' : '#FCA5A5',
          }}
        >
          {feedback.msg}
        </div>
      )}

      {/* Cancel button — only for active orders */}
      {isActive && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#EF4444',
            cursor: cancelling ? 'not-allowed' : 'pointer',
            opacity: cancelling ? 0.6 : 1,
          }}
          onMouseEnter={(e) => { if (!cancelling) e.currentTarget.style.background = 'rgba(239,68,68,0.18)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
          aria-label="Cancel and withdraw remaining funds"
        >
          {cancelling ? (
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          )}
          Cancel &amp; Withdraw
        </button>
      )}

      {/* Completed banner */}
      {isCompleted && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#10B981',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          TWAP complete — all {order.numChunks} chunks executed
        </div>
      )}
    </div>
  )
}

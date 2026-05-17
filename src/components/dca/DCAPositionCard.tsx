'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import {
  DCAPosition,
  DCA_STATUS,
  msToNextExecution,
  formatCountdown,
  intervalLabel,
  formatTokenAmount,
  buildPauseDCATx,
  buildResumeDCATx,
  buildCancelDCATx,
} from '@/lib/dca'
import { findToken } from '@/lib/tokens'

// ─── Progress Bar ─────────────────────────────────────────────────────────────

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
        aria-label={`${executed} of ${total} cycles completed`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background:
              pct >= 100
                ? '#10B981'
                : 'linear-gradient(90deg, #6366F1, #06B6D4)',
          }}
        />
      </div>
      <span className="text-xs font-mono flex-shrink-0" style={{ color: '#64748B' }}>
        {executed}/{total}
      </span>
    </div>
  )
}

// ─── Countdown clock hook ─────────────────────────────────────────────────────

function useCountdown(lastExecutedMs: number, intervalMs: number) {
  const [ms, setMs] = useState(() => msToNextExecution(lastExecutedMs, intervalMs))

  useEffect(() => {
    const id = setInterval(() => {
      setMs(msToNextExecution(lastExecutedMs, intervalMs))
    }, 10_000)
    return () => clearInterval(id)
  }, [lastExecutedMs, intervalMs])

  return ms
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: number }) {
  const configs = {
    [DCA_STATUS.ACTIVE]: {
      label: 'Active',
      bg: 'rgba(16,185,129,0.12)',
      border: 'rgba(16,185,129,0.3)',
      color: '#10B981',
    },
    [DCA_STATUS.PAUSED]: {
      label: 'Paused',
      bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.3)',
      color: '#F59E0B',
    },
    [DCA_STATUS.COMPLETED]: {
      label: 'Completed',
      bg: 'rgba(99,102,241,0.12)',
      border: 'rgba(99,102,241,0.3)',
      color: '#818CF8',
    },
  } as const

  const c = configs[status as keyof typeof configs] ?? configs[DCA_STATUS.ACTIVE]

  return (
    <span
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: c.color,
          boxShadow: status === DCA_STATUS.ACTIVE ? `0 0 6px ${c.color}` : 'none',
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
      {/* Overlapping token logos */}
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
        <span className="text-sm font-bold" style={{ color: '#E2E8F0' }}>
          {symbolIn}
        </span>
        <span className="text-sm mx-1" style={{ color: '#475569' }}>→</span>
        <span className="text-sm font-bold" style={{ color: '#06B6D4' }}>
          {symbolOut}
        </span>
      </div>
    </div>
  )
}

// ─── Stat cell ────────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: '#475569' }}>{label}</p>
      <p
        className="text-xs font-semibold"
        style={{ color: highlight ? '#818CF8' : '#94A3B8' }}
      >
        {value}
      </p>
    </div>
  )
}

// ─── Action button ────────────────────────────────────────────────────────────

interface ActionButtonProps {
  label: string
  icon: React.ReactNode
  loading: boolean
  onClick: () => void
  variant: 'warning' | 'success' | 'danger'
}

const VARIANT_STYLES = {
  warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', color: '#F59E0B', hoverBg: 'rgba(245,158,11,0.2)' },
  success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', color: '#10B981', hoverBg: 'rgba(16,185,129,0.2)' },
  danger:  { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)',   color: '#EF4444', hoverBg: 'rgba(239,68,68,0.18)' },
} as const

function ActionButton({ label, icon, loading, onClick, variant }: ActionButtonProps) {
  const s = VARIANT_STYLES[variant]
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
      onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = s.hoverBg }}
      onMouseLeave={(e) => { e.currentTarget.style.background = s.bg }}
      aria-label={label}
    >
      {loading ? (
        <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      ) : icon}
      {label}
    </button>
  )
}

function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}
function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface DCAPositionCardProps {
  position: DCAPosition
  onUpdated?: (positionId: string, newStatus: number) => void
  onCancelled?: (positionId: string) => void
}

export function DCAPositionCard({
  position,
  onUpdated,
  onCancelled,
}: DCAPositionCardProps) {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()
  const [actionLoading, setActionLoading] = useState<'pause' | 'resume' | 'cancel' | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const tokenInMeta  = findToken(position.tokenIn)
  const tokenOutMeta = findToken(position.tokenOut)

  const lastExecMs = Number(position.lastExecutedMs)
  const intervalMs = Number(position.intervalMs)
  const countdownMs = useCountdown(lastExecMs, intervalMs)

  const executed = Number(position.executedCycles)
  const total    = Number(position.totalCycles)
  const isCompleted = position.status === DCA_STATUS.COMPLETED
  const isActive    = position.status === DCA_STATUS.ACTIVE
  const isPaused    = position.status === DCA_STATUS.PAUSED

  const inputDecimals  = tokenInMeta?.decimals  ?? 6
  const outputDecimals = tokenOutMeta?.decimals ?? 9

  const totalSpentBase = position.amountPerCycle * position.executedCycles

  const totalSpent    = formatTokenAmount(totalSpentBase, inputDecimals, 2)
  const totalReceived = formatTokenAmount(position.outputBalance, outputDecimals, 4)
  const remaining     = formatTokenAmount(position.inputBalance, inputDecimals, 2)

  const avgPrice = useMemo<number | null>(() => {
    if (position.outputBalance === 0n || totalSpentBase === 0n) return null
    const spentNorm = Number(totalSpentBase) / 10 ** inputDecimals
    const rcvNorm   = Number(position.outputBalance) / 10 ** outputDecimals
    if (rcvNorm === 0) return null
    return spentNorm / rcvNorm
  }, [position.outputBalance, totalSpentBase, inputDecimals, outputDecimals])

  const handleAction = useCallback(
    async (action: 'pause' | 'resume' | 'cancel') => {
      setActionLoading(action)
      setFeedback(null)

      try {
        let tx
        if (action === 'pause') {
          tx = buildPauseDCATx(position.id, position.tokenIn, position.tokenOut)
        } else if (action === 'resume') {
          tx = buildResumeDCATx(position.id, position.tokenIn, position.tokenOut)
        } else {
          tx = buildCancelDCATx(position.id, position.tokenIn, position.tokenOut)
        }

        // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
        await signAndExecute({ transaction: tx })

        if (action === 'cancel') {
          onCancelled?.(position.id)
        } else {
          const newStatus = action === 'pause' ? DCA_STATUS.PAUSED : DCA_STATUS.ACTIVE
          onUpdated?.(position.id, newStatus)
          setFeedback({
            type: 'success',
            msg: action === 'pause' ? 'Position paused.' : 'Position resumed.',
          })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Transaction failed'
        setFeedback({ type: 'error', msg })
      } finally {
        setActionLoading(null)
      }
    },
    [position, signAndExecute, onUpdated, onCancelled],
  )

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
          symbolIn={position.tokenInSymbol}
          symbolOut={position.tokenOutSymbol}
          logoIn={tokenInMeta?.logoURI}
          logoOut={tokenOutMeta?.logoURI}
        />
        <StatusBadge status={position.status} />
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs" style={{ color: '#64748B' }}>Progress</span>
          <span className="text-xs" style={{ color: '#64748B' }}>{executed} of {total} cycles</span>
        </div>
        <ProgressBar executed={executed} total={total} />
      </div>

      {/* Stats grid */}
      <div
        className="grid grid-cols-2 gap-x-4 gap-y-2.5 p-3 rounded-xl mb-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.08)' }}
      >
        <Stat label="Per cycle" value={`${formatTokenAmount(position.amountPerCycle, inputDecimals, 2)} ${position.tokenInSymbol}`} />
        <Stat label="Frequency"  value={intervalLabel(intervalMs)} />
        <Stat label="Total spent" value={`${totalSpent} ${position.tokenInSymbol}`} />
        <Stat label="Remaining"  value={`${remaining} ${position.tokenInSymbol}`} />
        <Stat label="Received"   value={`${totalReceived} ${position.tokenOutSymbol}`} />
        {avgPrice !== null ? (
          <Stat
            label={`Avg ${position.tokenOutSymbol} price`}
            value={`$${avgPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}`}
            highlight
          />
        ) : (
          <Stat label="Avg price" value="—" />
        )}
      </div>

      {/* Next execution countdown */}
      {!isCompleted && (
        <div
          className="flex items-center justify-between px-3 py-2 rounded-xl mb-3"
          style={{
            background: isActive ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
            border: isActive ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(245,158,11,0.15)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke={isActive ? '#10B981' : '#F59E0B'} strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4l3 3" />
            </svg>
            <span className="text-xs" style={{ color: '#64748B' }}>
              {isActive ? 'Next execution' : 'Paused — was due'}
            </span>
          </div>
          <span className="text-xs font-semibold" style={{ color: isActive ? '#10B981' : '#F59E0B' }}>
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

      {/* Action buttons */}
      {!isCompleted && (
        <div className="flex items-center gap-2 flex-wrap">
          {isActive && (
            <ActionButton
              label="Pause"
              icon={<PauseIcon />}
              loading={actionLoading === 'pause'}
              onClick={() => handleAction('pause')}
              variant="warning"
            />
          )}
          {isPaused && (
            <ActionButton
              label="Resume"
              icon={<PlayIcon />}
              loading={actionLoading === 'resume'}
              onClick={() => handleAction('resume')}
              variant="success"
            />
          )}
          <ActionButton
            label="Cancel & Withdraw"
            icon={<XIcon />}
            loading={actionLoading === 'cancel'}
            onClick={() => handleAction('cancel')}
            variant="danger"
          />
        </div>
      )}

      {/* Completed — output collection hint */}
      {isCompleted && Number(position.outputBalance) > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#10B981',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" />
          </svg>
          DCA complete — {totalReceived} {position.tokenOutSymbol} ready to collect
        </div>
      )}
    </div>
  )
}

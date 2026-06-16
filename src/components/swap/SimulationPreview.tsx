'use client'

import type { SimulationResult, BalanceChange } from '@/lib/simulate'
import { formatTokenAmount } from '@/lib/formatters'

interface SimulationPreviewProps {
  result: SimulationResult | null
  loading: boolean
  error: string | null
  userAddress: string
  onSimulate: () => void
}

// Shimmer row shown while simulation is running
function ShimmerRow() {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div
        className="h-3 w-24 rounded animate-pulse"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      />
      <div
        className="h-3 w-20 rounded animate-pulse"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      />
    </div>
  )
}

function formatChangeAmount(change: BalanceChange): string {
  const absAmount = change.amount < 0n ? -change.amount : change.amount
  const formatted = formatTokenAmount(absAmount, change.decimals, 6)
  const prefix = change.amount >= 0n ? '+' : '-'
  return `${prefix}${formatted} ${change.symbol}`
}

function isUserChange(change: BalanceChange, userAddress: string): boolean {
  return change.owner.toLowerCase() === userAddress.toLowerCase()
}

export function SimulationPreview({
  result,
  loading,
  error,
  userAddress,
  onSimulate,
}: SimulationPreviewProps) {
  const hasResult = result !== null
  const showEmpty = !loading && !hasResult && !error

  return (
    <div
      className="rounded-xl px-4 py-3 mb-4"
      style={{
        background: result && !result.success
          ? 'rgba(239,68,68,0.06)'
          : 'rgba(255,255,255,0.025)',
        border: result && !result.success
          ? '1px solid rgba(239,68,68,0.3)'
          : '1px solid rgba(99,102,241,0.1)',
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {/* Status icon */}
          {loading && (
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          )}
          {!loading && hasResult && result.success && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {!loading && hasResult && !result.success && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
          {!loading && !hasResult && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}

          <span
            className="text-xs font-semibold"
            style={{
              color: loading
                ? '#6366F1'
                : hasResult && result.success
                ? '#10B981'
                : hasResult && !result.success
                ? '#EF4444'
                : '#94A3B8',
            }}
          >
            {loading
              ? 'Simulating…'
              : hasResult && result.success
              ? 'Simulation successful'
              : hasResult && !result.success
              ? 'Transaction would fail'
              : 'Transaction preview'}
          </span>
        </div>

        {/* Re-simulate button */}
        {!loading && (
          <button
            onClick={onSimulate}
            className="text-xs transition-colors px-2 py-0.5 rounded-md"
            style={{
              color: '#6366F1',
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.16)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.08)'
            }}
          >
            {hasResult ? 'Re-simulate' : 'Simulate'}
          </button>
        )}
      </div>

      {/* Loading shimmer */}
      {loading && (
        <div className="space-y-1 mt-2">
          <ShimmerRow />
          <ShimmerRow />
          <ShimmerRow />
        </div>
      )}

      {/* Failure reason */}
      {!loading && hasResult && !result.success && (
        <div className="mt-1">
          <p className="text-xs" style={{ color: '#FCA5A5' }}>
            Reason: {result.error ?? 'Unknown error'}
          </p>
          <p className="text-xs mt-1.5" style={{ color: '#64748B' }}>
            Try adjusting slippage or the trade amount.
          </p>
        </div>
      )}

      {/* Hook error (simulate() itself threw) */}
      {!loading && !hasResult && error && (
        <p className="text-xs mt-1" style={{ color: '#FCA5A5' }}>
          {error}
        </p>
      )}

      {/* Empty state — not yet simulated */}
      {showEmpty && (
        <p className="text-xs mt-1" style={{ color: '#475569' }}>
          Click Simulate to preview what this transaction will do before signing.
        </p>
      )}

      {/* Success detail */}
      {!loading && hasResult && result.success && (
        <div className="mt-1 space-y-0.5">
          {/* Balance changes for the connected user */}
          {(() => {
            const userChanges = result.balanceChanges.filter(c =>
              isUserChange(c, userAddress)
            )
            // Gas change from SUI is already in balanceChanges; also show the
            // precise gas cost line separately so it's clear.
            if (userChanges.length === 0) {
              return (
                <p className="text-xs py-1" style={{ color: '#475569' }}>
                  No balance changes detected for your address.
                </p>
              )
            }
            return userChanges.map((change, idx) => {
              const isPositive = change.amount >= 0n
              const label = isPositive ? 'you receive' : 'you send'
              return (
                <div key={idx} className="flex items-center justify-between py-1">
                  <span className="text-xs" style={{ color: '#64748B' }}>
                    {label}
                  </span>
                  <span
                    className="text-xs font-semibold tabular-nums"
                    style={{ color: isPositive ? '#10B981' : '#94A3B8' }}
                  >
                    {formatChangeAmount(change)}
                  </span>
                </div>
              )
            })
          })()}

          {/* Separator */}
          <div style={{ borderTop: '1px solid rgba(99,102,241,0.08)', marginTop: '4px', paddingTop: '4px' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#64748B' }}>
                Network gas (actual)
              </span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: '#94A3B8' }}>
                -{result.gasUsed.netGasSUI.toFixed(6)} SUI
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

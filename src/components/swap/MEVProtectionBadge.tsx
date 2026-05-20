'use client'

import { SandwichRisk, estimateSandwichProfit } from '@/lib/mev'

interface MEVProtectionBadgeProps {
  risk: SandwichRisk
  tradeAmountUsd: number
  onSwitchToPrivate: () => void
}

export function MEVProtectionBadge({ risk, tradeAmountUsd, onSwitchToPrivate }: MEVProtectionBadgeProps) {
  if (risk.level === 'low') {
    return (
      <div
        className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
        style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          color: '#10B981',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Protected — low sandwich risk
      </div>
    )
  }

  if (risk.level === 'medium') {
    return (
      <div
        className="mt-3 rounded-xl text-xs overflow-hidden"
        style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
        }}
      >
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ color: '#F59E0B' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="font-semibold">MEV Risk: Medium</span>
          <span
            className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: 'rgba(245,158,11,0.2)', color: '#FDE68A' }}
          >
            Score {risk.score}
          </span>
        </div>
        <div
          className="px-3 pb-2.5 pt-0"
          style={{ color: '#94A3B8' }}
        >
          Consider tightening slippage to {(risk.suggestedSlippage / 100).toFixed(2)}% to reduce attack surface.
        </div>
      </div>
    )
  }

  // High risk
  const attackerProfit = estimateSandwichProfit(tradeAmountUsd, 30, risk.suggestedSlippage + 40)

  return (
    <div
      className="mt-3 rounded-xl text-xs overflow-hidden"
      style={{
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.35)',
        animation: 'mev-pulse 2s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes mev-pulse {
          0%, 100% { border-color: rgba(239,68,68,0.35); box-shadow: none; }
          50% { border-color: rgba(239,68,68,0.65); box-shadow: 0 0 12px rgba(239,68,68,0.2); }
        }
      `}</style>

      <div className="flex items-center gap-2 px-3 py-2.5" style={{ color: '#EF4444' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="font-semibold">High MEV Risk — Use Private Order Flow</span>
        <span
          className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: 'rgba(239,68,68,0.2)', color: '#FCA5A5' }}
        >
          Score {risk.score}
        </span>
      </div>

      <div className="px-3 pb-1" style={{ color: '#94A3B8' }}>
        {risk.reason}
        {attackerProfit > 0 && (
          <span style={{ color: '#FCA5A5' }}>
            {' '}Estimated attacker profit: <strong>${attackerProfit.toFixed(2)}</strong>
          </span>
        )}
      </div>

      <div className="px-3 pb-3 pt-2">
        <button
          onClick={onSwitchToPrivate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
            color: '#fff',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          Switch to Private Order Flow
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default MEVProtectionBadge

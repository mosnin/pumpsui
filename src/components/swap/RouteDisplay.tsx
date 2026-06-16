'use client'

import { useState } from 'react'
import { SwapQuote } from '@/hooks/useSwap'
import { Token } from '@/lib/tokens'
import { PRICE_IMPACT_WARNING_THRESHOLD, PRICE_IMPACT_DANGER_THRESHOLD } from '@/lib/constants'

interface RouteDisplayProps {
  quote: SwapQuote
  tokenIn: Token
  tokenOut: Token
}

function PriceImpactBadge({ impact }: { impact: number }) {
  const isWarning = impact >= PRICE_IMPACT_WARNING_THRESHOLD
  const isDanger = impact >= PRICE_IMPACT_DANGER_THRESHOLD
  const color = isDanger ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981'
  const bg = isDanger ? 'rgba(239,68,68,0.12)' : isWarning ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)'

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ color, background: bg }}
    >
      {isDanger && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )}
      {impact.toFixed(2)}% impact
    </span>
  )
}

export default function RouteDisplay({ quote, tokenIn, tokenOut }: RouteDisplayProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}
    >
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors duration-150"
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>Best Route</span>
          <PriceImpactBadge impact={quote.priceImpact} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#64748B' }}>
            {quote.route.steps.length} DEX{quote.route.steps.length !== 1 ? 'es' : ''}
          </span>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#64748B" strokeWidth="2" strokeLinecap="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      <div
        style={{
          maxHeight: expanded ? '400px' : '0',
          overflow: 'hidden',
          transition: 'max-height 300ms ease',
        }}
      >
        <div className="px-4 pb-4">
          {/* Route visualization */}
          <div className="mb-4">
            <div className="flex items-center gap-1 flex-wrap">
              {/* Token In */}
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <img
                  src={tokenIn.logoURI}
                  alt={tokenIn.symbol}
                  width={16}
                  height={16}
                  className="rounded-full"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <span className="text-xs font-semibold" style={{ color: '#E2E8F0' }}>{tokenIn.symbol}</span>
              </div>

              {/* Steps */}
              {quote.route.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  {/* Arrow */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>

                  {/* DEX badge */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: step.dex.bgColor,
                      border: `1px solid ${step.dex.color}33`,
                    }}
                  >
                    {/* DEX color dot */}
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: step.dex.color }}
                    />
                    <span className="text-xs font-semibold" style={{ color: step.dex.color }}>
                      {step.dex.name}
                    </span>
                    <span
                      className="text-xs font-bold px-1 py-0.5 rounded"
                      style={{ background: 'rgba(0,0,0,0.3)', color: step.dex.color }}
                    >
                      {step.percentage}%
                    </span>
                  </div>
                </div>
              ))}

              {/* Arrow to token out */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>

              {/* Token Out */}
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <img
                  src={tokenOut.logoURI}
                  alt={tokenOut.symbol}
                  width={16}
                  height={16}
                  className="rounded-full"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <span className="text-xs font-semibold" style={{ color: '#E2E8F0' }}>{tokenOut.symbol}</span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="space-y-2 border-t pt-3" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#64748B' }}>Minimum received</span>
              <span className="text-xs font-semibold" style={{ color: '#E2E8F0' }}>
                {parseFloat(quote.route.minimumReceived).toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenOut.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#64748B' }}>Price impact</span>
              <PriceImpactBadge impact={quote.priceImpact} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#64748B' }}>Network fee</span>
              <span className="text-xs font-semibold" style={{ color: '#E2E8F0' }}>
                ≈ ${quote.route.fee}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#64748B' }}>DEX fees</span>
              <span className="text-xs font-semibold" style={{ color: '#E2E8F0' }}>
                {quote.route.steps.map((s) => `${s.dex.name} ${(s.fee / 100).toFixed(2)}%`).join(' + ')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#64748B' }}>OmniWeave fee</span>
              <span className="text-xs font-semibold" style={{ color: '#10B981' }}>0.05%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

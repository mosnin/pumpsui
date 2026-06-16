'use client'

import { TrendingUp, Minus, Plus, DollarSign } from 'lucide-react'
import { DEXBadge } from '@/components/common/DEXBadge'
import { LPPosition } from '@/lib/liquidity'

interface PositionCardProps {
  position: LPPosition
  onAddMore: (position: LPPosition) => void
  onRemove: (position: LPPosition) => void
  onCollectFees: (position: LPPosition) => void
}

export default function PositionCard({ position, onAddMore, onRemove, onCollectFees }: PositionCardProps) {
  const {
    token0,
    token1,
    dex,
    inRange,
    priceRangeLow,
    priceRangeHigh,
    currentPrice,
    valueUsd,
    feesEarnedUsd,
    apr,
    amount0,
    amount1,
    feesEarned0,
    feesEarned1,
  } = position

  // Compute price range bar visualization
  const totalMin = priceRangeLow * 0.8
  const totalMax = priceRangeHigh * 1.2
  const totalRange = totalMax - totalMin

  const rangeStartPct = ((priceRangeLow - totalMin) / totalRange) * 100
  const rangeEndPct = ((priceRangeHigh - totalMin) / totalRange) * 100
  const rangeWidthPct = rangeEndPct - rangeStartPct
  const currentPricePct = Math.max(0, Math.min(100, ((currentPrice - totalMin) / totalRange) * 100))

  const fmtPrice = (p: number) => {
    if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 0 })
    if (p >= 1) return p.toFixed(4)
    return p.toFixed(6)
  }

  const fmtUsd = (v: number) =>
    v.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: 'rgba(13,13,31,0.8)',
        border: '1px solid rgba(99,102,241,0.2)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {/* Token pair circles */}
          <div className="flex -space-x-2">
            {[token0, token1].map((tok) => (
              <div
                key={tok}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-[#060611]"
                style={{ background: 'rgba(99,102,241,0.25)', color: '#6366F1' }}
              >
                {tok[0]}
              </div>
            ))}
          </div>
          <span className="font-semibold text-base" style={{ color: '#E2E8F0' }}>
            {token0} / {token1}
          </span>
          <DEXBadge dex={dex} size="sm" />
        </div>

        {/* In range badge */}
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={
            inRange
              ? { background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }
              : { background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }
          }
        >
          {inRange ? 'In Range' : 'Out of Range'}
        </span>
      </div>

      {/* Price range bar */}
      <div>
        <div className="relative w-full h-2 rounded-full" style={{ background: 'rgba(99,102,241,0.1)' }}>
          {/* Colored range */}
          <div
            className="absolute h-full rounded-full"
            style={{
              left: `${rangeStartPct}%`,
              width: `${rangeWidthPct}%`,
              background: inRange
                ? 'linear-gradient(90deg, #6366F1, #06B6D4)'
                : 'rgba(239,68,68,0.5)',
            }}
          />
          {/* Current price dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ring-2 ring-[#060611]"
            style={{
              left: `calc(${currentPricePct}% - 6px)`,
              background: inRange ? '#06B6D4' : '#EF4444',
            }}
          />
        </div>

        {/* Price labels */}
        <div className="flex items-center justify-between mt-1.5 text-xs" style={{ color: '#64748B' }}>
          <span>Low: {fmtPrice(priceRangeLow)}</span>
          <span style={{ color: '#94A3B8' }}>Current: {fmtPrice(currentPrice)}</span>
          <span>High: {fmtPrice(priceRangeHigh)}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5" style={{ color: '#E2E8F0' }}>
          <DollarSign size={14} style={{ color: '#6366F1' }} />
          <span className="text-xs text-slate-400">Value</span>
          <span className="text-sm font-semibold">{fmtUsd(valueUsd)}</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: '#E2E8F0' }}>
          <TrendingUp size={14} style={{ color: '#06B6D4' }} />
          <span className="text-xs text-slate-400">Fees</span>
          <span className="text-sm font-semibold" style={{ color: '#06B6D4' }}>{fmtUsd(feesEarnedUsd)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">APR</span>
          <span className="text-sm font-semibold" style={{ color: '#10B981' }}>{apr.toFixed(1)}%</span>
        </div>
      </div>

      {/* Token amounts */}
      <div className="flex gap-3 text-xs" style={{ color: '#94A3B8' }}>
        <span>{amount0.toLocaleString(undefined, { maximumFractionDigits: 4 })} {token0}</span>
        <span style={{ color: '#475569' }}>+</span>
        <span>{amount1.toLocaleString(undefined, { maximumFractionDigits: 4 })} {token1}</span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onAddMore(position)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.35)',
            color: '#6366F1',
          }}
        >
          <Plus size={12} />
          Add More
        </button>

        <button
          onClick={() => onRemove(position)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#EF4444',
          }}
        >
          <Minus size={12} />
          Remove
        </button>

        {feesEarnedUsd > 0 && (
          <button
            onClick={() => onCollectFees(position)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{
              background: 'rgba(6,182,212,0.1)',
              border: '1px solid rgba(6,182,212,0.3)',
              color: '#06B6D4',
            }}
          >
            <DollarSign size={12} />
            Collect Fees ({fmtUsd(feesEarnedUsd)})
          </button>
        )}
      </div>

      {/* Hidden references to avoid unused var warnings */}
      <span className="hidden">{feesEarned0}{feesEarned1}</span>
    </div>
  )
}

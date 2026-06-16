'use client'

import { useState } from 'react'
import { estimateMonthlyEarnings, KEEPER_TIP_BPS } from '@/lib/keeper'

interface EarningsCalculatorProps {
  onJoin?: () => void
}

export function EarningsCalculator({ onJoin }: EarningsCalculatorProps) {
  const [ordersPerDay, setOrdersPerDay] = useState(100)
  const [avgOrderSize, setAvgOrderSize] = useState(50)

  const monthly = estimateMonthlyEarnings({
    ordersPerDay,
    avgOrderSizeSui: avgOrderSize,
  })
  const daily = monthly / 30
  const yearly = monthly * 12

  function fmt(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return n.toFixed(2)
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>Earnings Calculator</h3>
          <p className="text-xs" style={{ color: '#64748B' }}>{KEEPER_TIP_BPS} bps (0.1%) per execution</p>
        </div>
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-4">
        {/* Orders per day */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium" style={{ color: '#94A3B8' }}>
              Orders per day
            </label>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8' }}
            >
              {ordersPerDay.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={1000}
            value={ordersPerDay}
            onChange={(e) => setOrdersPerDay(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #6366F1 ${(ordersPerDay / 1000) * 100}%, rgba(99,102,241,0.15) ${(ordersPerDay / 1000) * 100}%)`,
              accentColor: '#6366F1',
            }}
          />
          <div className="flex justify-between text-xs" style={{ color: '#334155' }}>
            <span>1</span>
            <span>500</span>
            <span>1,000</span>
          </div>
        </div>

        {/* Average order size */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium" style={{ color: '#94A3B8' }}>
              Avg order size (SUI)
            </label>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(6,182,212,0.1)', color: '#06B6D4' }}
            >
              {avgOrderSize} SUI
            </span>
          </div>
          <input
            type="number"
            min={1}
            max={100_000}
            value={avgOrderSize}
            onChange={(e) => {
              const v = Math.max(1, Number(e.target.value))
              setAvgOrderSize(v)
            }}
            className="w-full rounded-xl h-10 px-4 text-sm"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(99,102,241,0.2)',
              color: '#E2E8F0',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Earnings breakdown */}
      <div
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Estimated earnings</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Daily', value: `${fmt(daily)} SUI` },
            { label: 'Monthly', value: `${fmt(monthly)} SUI` },
            { label: 'Yearly', value: `${fmt(yearly)} SUI` },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <p className="text-xs" style={{ color: '#64748B' }}>{label}</p>
              <p className="text-sm font-bold" style={{ color: '#E2E8F0' }}>{value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: '#475569' }}>
          Based on {KEEPER_TIP_BPS} bps tip per order. Actual earnings depend on network activity.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onJoin}
        className="w-full rounded-xl h-11 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
          boxShadow: '0 0 20px rgba(99,102,241,0.3)',
        }}
      >
        Join the Keeper Network
      </button>
    </div>
  )
}

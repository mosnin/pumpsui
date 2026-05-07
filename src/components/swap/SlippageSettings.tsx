'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { SwapSettings } from '@/hooks/useSwap'
import { SLIPPAGE_PRESETS } from '@/lib/constants'

interface SlippageSettingsProps {
  settings: SwapSettings
  onUpdate: (partial: Partial<SwapSettings>) => void
}

export default function SlippageSettings({ settings, onUpdate }: SlippageSettingsProps) {
  const [open, setOpen] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [deadlineInput, setDeadlineInput] = useState(String(settings.deadlineMinutes))
  const containerRef = useRef<HTMLDivElement>(null)

  const slippagePct = (settings.slippageBps / 100).toFixed(2).replace(/\.?0+$/, '')
  const isCustom = !SLIPPAGE_PRESETS.includes(settings.slippageBps as typeof SLIPPAGE_PRESETS[number])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handlePreset = useCallback(
    (bps: number) => {
      setCustomInput('')
      onUpdate({ slippageBps: bps })
    },
    [onUpdate],
  )

  const handleCustomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (val === '' || /^\d*\.?\d*$/.test(val)) {
        setCustomInput(val)
        const pct = parseFloat(val)
        if (!isNaN(pct) && pct > 0 && pct <= 50) {
          onUpdate({ slippageBps: Math.round(pct * 100) })
        }
      }
    },
    [onUpdate],
  )

  const handleDeadlineChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setDeadlineInput(val)
      const mins = parseInt(val)
      if (!isNaN(mins) && mins > 0 && mins <= 4320) {
        onUpdate({ deadlineMinutes: mins })
      }
    },
    [onUpdate],
  )

  const getSlippageColor = () => {
    if (settings.slippageBps < 10) return '#F59E0B'
    if (settings.slippageBps > 100) return '#EF4444'
    return '#10B981'
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
        style={{
          background: open ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(99,102,241,0.2)',
          color: getSlippageColor(),
        }}
        title="Slippage & settings"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M12 2v2M12 20v2M4.93 4.93l1.41 1.41M18.66 18.66l1.41 1.41M2 12h2M20 12h2" />
        </svg>
        {slippagePct}%
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-72 rounded-2xl p-4 z-40"
          style={{
            background: 'linear-gradient(135deg, #0f0f23 0%, #0a0a1a 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(99,102,241,0.1)',
          }}
        >
          {/* Slippage tolerance */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold" style={{ color: '#E2E8F0' }}>
                Slippage Tolerance
              </span>
              {settings.slippageBps < 10 && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                  May fail
                </span>
              )}
              {settings.slippageBps > 100 && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                  High risk
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {SLIPPAGE_PRESETS.map((bps) => {
                const active = settings.slippageBps === bps && !isCustom
                return (
                  <button
                    key={bps}
                    onClick={() => handlePreset(bps)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
                    style={{
                      background: active
                        ? 'linear-gradient(135deg, #6366F1, #06B6D4)'
                        : 'rgba(255,255,255,0.06)',
                      border: active ? '1px solid transparent' : '1px solid rgba(99,102,241,0.2)',
                      color: active ? '#fff' : '#94A3B8',
                    }}
                  >
                    {(bps / 100).toFixed(1)}%
                  </button>
                )
              })}
              {/* Custom input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Custom"
                  value={isCustom && !customInput ? slippagePct : customInput}
                  onChange={handleCustomChange}
                  className="w-full py-2 pr-5 pl-2 rounded-lg text-xs font-semibold text-center outline-none transition-all duration-150"
                  style={{
                    background: isCustom ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                    border: isCustom ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(99,102,241,0.2)',
                    color: '#E2E8F0',
                  }}
                />
                <span
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                  style={{ color: '#64748B' }}
                >
                  %
                </span>
              </div>
            </div>
          </div>

          {/* MEV Protection */}
          <div className="flex items-center justify-between mb-4 py-3 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.1)' }}>
            <div>
              <p className="text-xs font-semibold" style={{ color: '#E2E8F0' }}>MEV Protection</p>
              <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>Shield from front-running</p>
            </div>
            <button
              onClick={() => onUpdate({ mevProtection: !settings.mevProtection })}
              className="relative w-10 h-5.5 rounded-full transition-all duration-200 flex-shrink-0"
              style={{
                background: settings.mevProtection
                  ? 'linear-gradient(135deg, #6366F1, #06B6D4)'
                  : 'rgba(255,255,255,0.12)',
                width: '40px',
                height: '22px',
              }}
            >
              <span
                className="absolute top-0.5 rounded-full transition-all duration-200"
                style={{
                  width: '18px',
                  height: '18px',
                  background: '#fff',
                  left: settings.mevProtection ? '20px' : '2px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
            </button>
          </div>

          {/* Transaction deadline */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#E2E8F0' }}>
              Transaction Deadline
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={deadlineInput}
                onChange={handleDeadlineChange}
                className="w-16 py-2 px-2 rounded-lg text-xs font-semibold text-center outline-none transition-all duration-150"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  color: '#E2E8F0',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)' }}
              />
              <span className="text-xs" style={{ color: '#64748B' }}>minutes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

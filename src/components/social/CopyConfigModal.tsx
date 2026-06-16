'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocialStore } from '@/store/socialStore'
import type { TraderProfile } from '@/lib/social'
import { fmtUSD } from '@/lib/social'

// ─── Props ────────────────────────────────────────────────────────────────────

interface CopyConfigModalProps {
  trader: TraderProfile
  isOpen: boolean
  onClose: () => void
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-sm font-semibold font-mono" style={{ color: '#E2E8F0' }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #6366F1 0%, #06B6D4 ${((value - min) / (max - min)) * 100}%, rgba(99,102,241,0.2) ${((value - min) / (max - min)) * 100}%)`,
          accentColor: '#6366F1',
        }}
      />
      <div className="flex justify-between text-xs text-slate-600">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
}

function InputRow({
  label,
  value,
  prefix,
  onChange,
}: {
  label: string
  value: number
  prefix?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-slate-400">{label}</label>
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={{
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}
      >
        {prefix && <span className="text-slate-500 text-sm">{prefix}</span>}
        <input
          type="number"
          value={value}
          min={0}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="flex-1 bg-transparent text-sm font-mono focus:outline-none"
          style={{ color: '#E2E8F0' }}
        />
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function CopyConfigModal({ trader, isOpen, onClose }: CopyConfigModalProps) {
  const { copyConfigs, setCopyConfig, toggleCopyTrading, isCopying, followedTraders, followTrader } =
    useSocialStore()

  const existingConfig = copyConfigs[trader.address]
  const copying = isCopying(trader.address)

  const [maxTradeSize, setMaxTradeSize] = useState(existingConfig?.maxTradeSize ?? 100)
  const [maxDailyVolume, setMaxDailyVolume] = useState(existingConfig?.maxDailyVolume ?? 500)
  const [copyRatio, setCopyRatio] = useState(existingConfig?.copyRatio ?? 0.1)
  const [slippageBps, setSlippageBps] = useState(existingConfig?.slippageBps ?? 100)

  // Sync state when config changes externally
  useEffect(() => {
    if (existingConfig) {
      setMaxTradeSize(existingConfig.maxTradeSize)
      setMaxDailyVolume(existingConfig.maxDailyVolume)
      setCopyRatio(existingConfig.copyRatio)
      setSlippageBps(existingConfig.slippageBps)
    }
  }, [existingConfig])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  function handleSave() {
    if (!followedTraders.includes(trader.address)) {
      followTrader(trader.address)
    }
    setCopyConfig(trader.address, { maxTradeSize, maxDailyVolume, copyRatio, slippageBps })
    onClose()
  }

  function handleToggle() {
    if (!followedTraders.includes(trader.address)) {
      followTrader(trader.address)
    }
    setCopyConfig(trader.address, { maxTradeSize, maxDailyVolume, copyRatio, slippageBps })
    toggleCopyTrading(trader.address)
  }

  const estimatedCost = Math.min(trader.avgTradeSize * copyRatio, maxTradeSize)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="copy-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="copy-modal-panel"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[480px] rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(10, 10, 28, 0.97)',
              border: '1px solid rgba(99,102,241,0.3)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label={`Copy trading config for ${trader.displayName}`}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}
            >
              <div>
                <h2 className="text-base font-semibold" style={{ color: '#E2E8F0' }}>
                  Copy Trading Config
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">for {trader.displayName}</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-white"
                aria-label="Close modal"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Warning banner */}
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(245,158,11,0.07)',
                  border: '1px solid rgba(245,158,11,0.25)',
                }}
              >
                <span className="text-amber-400 text-sm leading-none mt-0.5">⚠</span>
                <p className="text-xs text-amber-300/90 leading-relaxed">
                  Copy trading does not guarantee profits. Past performance is not indicative of future results.
                </p>
              </div>

              {/* Copy Ratio Slider */}
              <SliderRow
                label="Copy Ratio"
                value={copyRatio}
                min={0.1}
                max={1}
                step={0.05}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={setCopyRatio}
              />

              {/* Slippage Slider */}
              <SliderRow
                label="Slippage Tolerance"
                value={slippageBps}
                min={10}
                max={500}
                step={10}
                format={(v) => `${(v / 100).toFixed(1)}%`}
                onChange={setSlippageBps}
              />

              {/* Max Trade Size */}
              <InputRow
                label="Max Trade Size (USD)"
                value={maxTradeSize}
                prefix="$"
                onChange={setMaxTradeSize}
              />

              {/* Max Daily Volume */}
              <InputRow
                label="Max Daily Volume (USD)"
                value={maxDailyVolume}
                prefix="$"
                onChange={setMaxDailyVolume}
              />

              {/* Estimated cost preview */}
              <div
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.15)',
                }}
              >
                <span className="text-sm text-slate-400">Est. cost per trade</span>
                <span className="text-sm font-bold font-mono" style={{ color: '#06B6D4' }}>
                  ~{fmtUSD(estimatedCost)}
                </span>
              </div>

              {/* Enable / disable toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#E2E8F0' }}>
                    Auto-copy trades
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {copying ? 'Active — trades will be copied automatically' : 'Inactive — save config first'}
                  </p>
                </div>
                <button
                  onClick={handleToggle}
                  className="relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none"
                  style={{
                    background: copying
                      ? 'linear-gradient(135deg, #6366F1, #06B6D4)'
                      : 'rgba(99,102,241,0.2)',
                  }}
                  aria-label="Toggle copy trading"
                  aria-pressed={copying}
                >
                  <span
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
                    style={{ transform: copying ? 'translateX(20px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex gap-3 px-6 pb-5"
              style={{ borderTop: '1px solid rgba(99,102,241,0.1)', paddingTop: '1.25rem' }}
            >
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
                style={{ border: '1px solid rgba(99,102,241,0.15)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                }}
              >
                Save Config
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

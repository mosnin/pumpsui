'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLivePrices } from '@/hooks/useLivePrices'
import { useAlerts } from '@/hooks/useAlerts'
import type { AlertCondition } from '@/lib/alerts'

// ─── Constants ────────────────────────────────────────────────────────────────

const TOP_TOKENS = ['SUI', 'USDC', 'WETH', 'CETUS', 'TURBOS'] as const
type TopToken = (typeof TOP_TOKENS)[number]

const PRESETS: { label: string; pct: number }[] = [
  { label: '+5%', pct: 5 },
  { label: '+10%', pct: 10 },
  { label: '+25%', pct: 25 },
  { label: '-5%', pct: -5 },
  { label: '-10%', pct: -10 },
  { label: '-25%', pct: -25 },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface PriceAlertModalProps {
  isOpen: boolean
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PriceAlertModal({ isOpen, onClose }: PriceAlertModalProps) {
  const [selectedToken, setSelectedToken] = useState<TopToken>('SUI')
  const [condition, setCondition] = useState<AlertCondition>('above')
  const [targetInput, setTargetInput] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { prices } = useLivePrices(TOP_TOKENS as unknown as string[])
  const { addAlert, permissionGranted, requestPermission } = useAlerts()

  const currentPrice = prices[selectedToken]?.price ?? null

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedToken('SUI')
      setCondition('above')
      setTargetInput('')
      setSubmitted(false)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const applyPreset = useCallback(
    (pct: number) => {
      if (currentPrice === null) return
      const newPrice = currentPrice * (1 + pct / 100)
      setTargetInput(newPrice.toFixed(4))
      // Auto-set condition based on preset sign
      setCondition(pct > 0 ? 'above' : 'below')
    },
    [currentPrice],
  )

  const handleCreate = useCallback(() => {
    const target = parseFloat(targetInput)
    if (isNaN(target) || target <= 0) return
    addAlert(selectedToken, condition, target)
    setSubmitted(true)
    setTimeout(() => {
      onClose()
    }, 800)
  }, [targetInput, selectedToken, condition, addAlert, onClose])

  const targetValue = parseFloat(targetInput)
  const isValid = !isNaN(targetValue) && targetValue > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            key="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Create price alert"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl border p-6 shadow-2xl"
            style={{
              background: 'rgba(10, 10, 28, 0.97)',
              borderColor: 'rgba(99, 102, 241, 0.25)',
            }}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-slate-100">New Price Alert</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Notification permission banner */}
            {!permissionGranted && (
              <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3">
                <p className="text-xs text-amber-300">Enable browser notifications to get alerted in the background.</p>
                <button
                  onClick={() => void requestPermission()}
                  className="shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/25"
                >
                  Enable
                </button>
              </div>
            )}

            {/* Token selector */}
            <div className="mb-5">
              <label className="mb-2 block text-xs font-medium text-slate-400">Token</label>
              <div className="flex flex-wrap gap-2">
                {TOP_TOKENS.map((token) => (
                  <button
                    key={token}
                    onClick={() => setSelectedToken(token)}
                    className={[
                      'rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
                      selectedToken === token
                        ? 'border-indigo-500/60 bg-indigo-500/20 text-indigo-300'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200',
                    ].join(' ')}
                  >
                    {token}
                  </button>
                ))}
              </div>
            </div>

            {/* Current price */}
            <div className="mb-5 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
              <span className="text-xs text-slate-500">Current price</span>
              <div className="mt-0.5 text-lg font-semibold text-slate-100">
                {currentPrice !== null
                  ? `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                  : <span className="text-slate-500 text-sm">Loading…</span>}
              </div>
            </div>

            {/* Condition toggle */}
            <div className="mb-5">
              <label className="mb-2 block text-xs font-medium text-slate-400">Alert when price…</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCondition('above')}
                  className={[
                    'flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all',
                    condition === 'above'
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200',
                  ].join(' ')}
                >
                  <TrendingUp className="h-4 w-4" />
                  Rises above ▲
                </button>
                <button
                  onClick={() => setCondition('below')}
                  className={[
                    'flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-all',
                    condition === 'below'
                      ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200',
                  ].join(' ')}
                >
                  <TrendingDown className="h-4 w-4" />
                  Falls below ▼
                </button>
              </div>
            </div>

            {/* Target price input */}
            <div className="mb-5">
              <label htmlFor="target-price" className="mb-2 block text-xs font-medium text-slate-400">
                Target price
              </label>
              <div className="flex items-center rounded-xl border border-white/12 bg-white/5 px-4 py-3 transition-colors focus-within:border-indigo-500/50">
                <span className="mr-2 text-slate-500">$</span>
                <input
                  id="target-price"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick presets */}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-medium text-slate-400">Quick presets</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(({ label, pct }) => (
                  <button
                    key={label}
                    onClick={() => applyPreset(pct)}
                    disabled={currentPrice === null}
                    className={[
                      'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40',
                      pct > 0
                        ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/15'
                        : 'border-rose-500/30 bg-rose-500/8 text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/15',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Create button */}
            <Button
              variant="primary"
              size="md"
              className="w-full"
              disabled={!isValid || submitted}
              onClick={handleCreate}
            >
              {submitted ? 'Alert created!' : 'Create Alert'}
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

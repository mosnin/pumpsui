'use client'

import { useState, useEffect, useCallback } from 'react'
import { PrivateOrderQuote, PrivateOrderRequest, getPrivateOrderQuotes } from '@/lib/privateOrderFlow'

interface PrivateOrderModalProps {
  open: boolean
  onClose: () => void
  order: PrivateOrderRequest
  tokenInSymbol: string
  tokenOutSymbol: string
}

export function PrivateOrderModal({
  open,
  onClose,
  order,
  tokenInSymbol,
  tokenOutSymbol,
}: PrivateOrderModalProps) {
  const [quotes, setQuotes] = useState<PrivateOrderQuote[]>([])
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [selectedSolver, setSelectedSolver] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(30)

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    setQuotes([])
    setSelectedSolver(null)
    setSecondsLeft(30)
    try {
      const result = await getPrivateOrderQuotes(order)
      // Sort best first
      const sorted = [...result].sort((a, b) => b.improvement - a.improvement)
      setQuotes(sorted)
      setSelectedSolver(sorted[0]?.solver ?? null)
    } finally {
      setLoading(false)
    }
  }, [order])

  useEffect(() => {
    if (open) {
      void fetchQuotes()
    }
  }, [open, fetchQuotes])

  // Countdown timer
  useEffect(() => {
    if (!open || loading || quotes.length === 0) return
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          void fetchQuotes()
          return 30
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [open, loading, quotes.length, fetchQuotes])

  const handleExecute = useCallback(async () => {
    if (!selectedSolver) return
    setExecuting(true)
    // Simulate execution
    await new Promise<void>(r => setTimeout(r, 1500))
    setExecuting(false)
    onClose()
  }, [selectedSolver, onClose])

  if (!open) return null

  const bestQuote = quotes[0]
  const selectedQuote = quotes.find(q => q.solver === selectedSolver) ?? bestQuote

  const formatAmount = (amount: bigint) => {
    const num = Number(amount) / 1e9
    return num.toFixed(6)
  }

  const formatGas = (gas: bigint) => {
    return (Number(gas) / 1e6).toFixed(2) + 'M'
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Private Order Flow"
      >
        <div
          className="relative w-full max-w-md rounded-2xl p-px"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(6,182,212,0.4))',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div
            className="rounded-[calc(1rem-1px)] p-6"
            style={{ background: 'linear-gradient(145deg, #0d0d1f 0%, #080814 100%)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100">Private Order Flow</h2>
                  <p className="text-[11px]" style={{ color: '#64748B' }}>
                    Shielded from public mempool
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-colors"
                aria-label="Close modal"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Trade summary */}
            <div
              className="mb-4 px-3 py-2.5 rounded-xl text-xs"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-slate-400">Swapping </span>
              <span className="text-slate-200 font-medium">
                {formatAmount(order.amountIn)} {tokenInSymbol}
              </span>
              <span className="text-slate-400"> → </span>
              <span className="text-slate-200 font-medium">
                min {formatAmount(order.minAmountOut)} {tokenOutSymbol}
              </span>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="py-8 flex flex-col items-center gap-3">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-full"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
                >
                  <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-300 font-medium">Collecting solver bids…</p>
                  <p className="text-xs text-slate-500 mt-1">Broadcasting to private solver network</p>
                </div>
              </div>
            )}

            {/* Solver quotes */}
            {!loading && quotes.length > 0 && (
              <>
                <div className="space-y-2.5 mb-4">
                  {quotes.map((quote, i) => {
                    const isBest = i === 0
                    const isSelected = quote.solver === selectedSolver
                    return (
                      <button
                        key={quote.solver}
                        onClick={() => setSelectedSolver(quote.solver)}
                        className="w-full text-left rounded-xl p-3 transition-all"
                        style={{
                          background: isSelected
                            ? 'rgba(99,102,241,0.12)'
                            : 'rgba(255,255,255,0.03)',
                          border: isSelected
                            ? '1px solid rgba(99,102,241,0.4)'
                            : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-200">
                              {quote.solverName}
                            </span>
                            {isBest && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.3))',
                                  color: '#06B6D4',
                                  border: '1px solid rgba(6,182,212,0.3)',
                                }}
                              >
                                Best
                              </span>
                            )}
                          </div>
                          <span
                            className="text-xs font-semibold"
                            style={{ color: '#10B981' }}
                          >
                            +{(quote.improvement / 100).toFixed(2)}% better
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span style={{ color: '#64748B' }}>
                            Output: <span className="text-slate-300">
                              {formatAmount(quote.outputAmount)} {tokenOutSymbol}
                            </span>
                          </span>
                          <span style={{ color: '#64748B' }}>
                            Gas: {formatGas(quote.gasEstimate)} MIST
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Quote expiry countdown */}
                <div
                  className="flex items-center justify-between mb-4 px-3 py-2 rounded-lg text-[11px]"
                  style={{
                    background: secondsLeft <= 10 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
                    border: secondsLeft <= 10 ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.06)',
                    color: secondsLeft <= 10 ? '#EF4444' : '#64748B',
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    Quotes expire in
                  </span>
                  <span className="font-bold tabular-nums">{secondsLeft}s</span>
                </div>

                {/* Gas breakdown */}
                {selectedQuote && (
                  <div
                    className="mb-4 px-3 py-2.5 rounded-xl text-[11px] space-y-1.5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="flex justify-between">
                      <span style={{ color: '#64748B' }}>Solver</span>
                      <span className="text-slate-300">{selectedQuote.solverName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#64748B' }}>Output improvement</span>
                      <span style={{ color: '#10B981' }}>+{(selectedQuote.improvement / 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#64748B' }}>Gas estimate</span>
                      <span className="text-slate-300">{formatGas(selectedQuote.gasEstimate)} MIST</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#64748B' }}>MEV protection</span>
                      <span style={{ color: '#10B981' }}>Enabled</span>
                    </div>
                  </div>
                )}

                {/* Execute CTA */}
                <button
                  onClick={handleExecute}
                  disabled={executing || !selectedSolver}
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: executing
                      ? 'rgba(255,255,255,0.06)'
                      : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 40%, #06B6D4 100%)',
                    color: executing ? '#475569' : '#fff',
                    boxShadow: executing ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
                    cursor: executing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {executing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      Executing Private Order…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                      Execute Private Order
                    </span>
                  )}
                </button>

                {/* Explanation */}
                <p className="mt-3 text-center text-[11px]" style={{ color: '#475569' }}>
                  Your order is routed directly to solvers — not visible in the public mempool
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default PrivateOrderModal

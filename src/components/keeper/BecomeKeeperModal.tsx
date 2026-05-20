'use client'

import { useState } from 'react'
import { estimateMonthlyEarnings } from '@/lib/keeper'

interface BecomeKeeperModalProps {
  isOpen: boolean
  onClose: () => void
}

type Step = 1 | 2 | 3

function StepIndicator({ current, total }: { current: Step; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const step = (i + 1) as Step
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                background: done
                  ? 'linear-gradient(135deg, #6366F1, #06B6D4)'
                  : active
                  ? 'rgba(99,102,241,0.2)'
                  : 'rgba(255,255,255,0.04)',
                border: active
                  ? '1px solid rgba(99,102,241,0.5)'
                  : done
                  ? 'none'
                  : '1px solid rgba(255,255,255,0.08)',
                color: done ? '#fff' : active ? '#818CF8' : '#475569',
              }}
            >
              {done ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                step
              )}
            </div>
            {i < total - 1 && (
              <div
                className="w-8 h-0.5 rounded-full transition-all duration-300"
                style={{
                  background: done ? 'linear-gradient(90deg, #6366F1, #06B6D4)' : 'rgba(255,255,255,0.08)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

const STEP_LABELS: Record<Step, string> = {
  1: 'Register your bot',
  2: 'Download bot script',
  3: 'Configure & run',
}

export function BecomeKeeperModal({ isOpen, onClose }: BecomeKeeperModalProps) {
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [registering, setRegistering] = useState(false)
  const [calcOrders, setCalcOrders] = useState(100)
  const [calcSize, setCalcSize] = useState(50)

  const estimatedMonthly = estimateMonthlyEarnings({
    ordersPerDay: calcOrders,
    avgOrderSizeSui: calcSize,
  })

  function handleRegister() {
    if (!name.trim()) return
    setRegistering(true)
    // Simulate tx submission
    setTimeout(() => {
      setRegistering(false)
      setStep(2)
    }, 1200)
  }

  function handleClose() {
    setStep(1)
    setName('')
    setEndpoint('')
    setRegistering(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0d0d1f 0%, #080814 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 60px rgba(99,102,241,0.08)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold" style={{ color: '#E2E8F0' }}>
              Become a Keeper
            </h2>
            <p className="text-xs" style={{ color: '#64748B' }}>
              {STEP_LABELS[step]}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/8"
            style={{ color: '#64748B' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center px-6 py-4">
          <StepIndicator current={step} total={3} />
        </div>

        {/* Step content */}
        <div className="px-6 pb-6">
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <p className="text-sm" style={{ color: '#94A3B8' }}>
                Register your keeper bot on-chain. You&apos;ll receive a KeeperProfile NFT
                that tracks your executions and reputation.
              </p>

              {/* Earnings preview */}
              <div
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}
              >
                <p className="text-xs font-semibold" style={{ color: '#06B6D4' }}>Earnings preview</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: '#64748B' }}>Orders/day</label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={calcOrders}
                      onChange={(e) => setCalcOrders(Math.max(1, Number(e.target.value)))}
                      className="rounded-lg h-9 px-3 text-sm w-full"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(6,182,212,0.2)',
                        color: '#E2E8F0',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: '#64748B' }}>Avg size (SUI)</label>
                    <input
                      type="number"
                      min={1}
                      value={calcSize}
                      onChange={(e) => setCalcSize(Math.max(1, Number(e.target.value)))}
                      className="rounded-lg h-9 px-3 text-sm w-full"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(6,182,212,0.2)',
                        color: '#E2E8F0',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
                <p className="text-sm font-bold" style={{ color: '#E2E8F0' }}>
                  ~{estimatedMonthly.toFixed(1)} SUI/month
                </p>
              </div>

              {/* Bot name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium" style={{ color: '#94A3B8' }}>Bot name *</label>
                <input
                  type="text"
                  placeholder="e.g. My Keeper Bot"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl h-11 px-4 text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#E2E8F0',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Endpoint */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium" style={{ color: '#94A3B8' }}>
                  Bot endpoint <span style={{ color: '#475569' }}>(optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://my-keeper-bot.example.com"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="w-full rounded-xl h-11 px-4 text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#E2E8F0',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                onClick={handleRegister}
                disabled={!name.trim() || registering}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                  boxShadow: name.trim() ? '0 0 20px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                {registering ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Registering on-chain…
                  </span>
                ) : (
                  'Register Bot'
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <p className="text-sm" style={{ color: '#94A3B8' }}>
                Download the open-source keeper bot. It monitors the chain and executes
                ready orders automatically.
              </p>

              {/* Download commands */}
              <div className="flex flex-col gap-3">
                {[
                  { label: 'npm', cmd: 'npm install -g @omniweave/keeper-bot' },
                  { label: 'curl', cmd: 'curl -sSL https://keeper.omniweave.io/install.sh | sh' },
                ].map(({ label, cmd }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium" style={{ color: '#64748B' }}>via {label}</p>
                    <div
                      className="flex items-center justify-between gap-2 rounded-xl px-4 py-3"
                      style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(99,102,241,0.15)' }}
                    >
                      <code className="text-xs font-mono truncate" style={{ color: '#06B6D4' }}>{cmd}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(cmd)}
                        className="flex-shrink-0 text-xs px-2 py-1 rounded-lg transition-colors hover:bg-white/8"
                        style={{ color: '#475569' }}
                        title="Copy"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* GitHub link */}
              <a
                href="https://github.com/omniweave/keeper-bot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-10 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94A3B8',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                View on GitHub
              </a>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 h-11 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/5"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#94A3B8',
                  }}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}
                >
                  Next: Configure
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <p className="text-sm" style={{ color: '#94A3B8' }}>
                Set these environment variables, then start the bot. It will auto-detect
                your registered KeeperProfile and begin executing orders.
              </p>

              {/* Env vars */}
              <div
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(99,102,241,0.15)' }}
              >
                {[
                  { key: 'KEEPER_PRIVATE_KEY', desc: 'Your Sui wallet private key (bech32)', required: true },
                  { key: 'SUI_RPC_URL', desc: 'Mainnet RPC endpoint', required: true },
                  { key: 'KEEPER_REGISTRY_ID', desc: 'OmniWeave registry object ID', required: true },
                  { key: 'POLL_INTERVAL_MS', desc: 'How often to poll (default: 2000)', required: false },
                ].map(({ key, desc, required }) => (
                  <div key={key} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-bold" style={{ color: '#818CF8' }}>{key}</code>
                      {required && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                        >
                          required
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: '#475569' }}>{desc}</p>
                  </div>
                ))}
              </div>

              {/* Start command */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium" style={{ color: '#64748B' }}>Start the bot</p>
                <div
                  className="flex items-center justify-between gap-2 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(99,102,241,0.15)' }}
                >
                  <code className="text-xs font-mono" style={{ color: '#22C55E' }}>
                    omniweave-keeper start
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText('omniweave-keeper start')}
                    className="flex-shrink-0 text-xs px-2 py-1 rounded-lg transition-colors hover:bg-white/8"
                    style={{ color: '#475569' }}
                    title="Copy"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Info */}
              <div
                className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs"
                style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <p style={{ color: '#86EFAC' }}>
                  Your bot will earn <strong>0.1% of every order</strong> it executes.
                  Stats flow back to your dashboard in real-time.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 h-11 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/5"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#94A3B8',
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

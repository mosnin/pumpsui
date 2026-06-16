'use client'

import { useState, useCallback } from 'react'
import { type LaunchProject, fillPercent, formatSui } from '@/lib/launchpad'

// ─── Vesting schedule display ─────────────────────────────────────────────────

function VestingSchedule({
  tgePercent,
  cliffMonths,
  vestingMonths,
}: {
  tgePercent: number
  cliffMonths: number
  vestingMonths: number
}) {
  const steps = [
    { label: 'At TGE', value: `${tgePercent}% unlocked` },
    ...(cliffMonths > 0
      ? [{ label: `${cliffMonths}‑month cliff`, value: 'Tokens locked' }]
      : []),
    {
      label: `${vestingMonths}‑month linear`,
      value: `${100 - tgePercent}% vested`,
    },
  ]

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        Vesting Schedule
      </p>
      <div className="flex gap-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex flex-1 items-start gap-1.5">
            <div className="flex flex-col items-center pt-0.5">
              <div
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ background: i === 0 ? '#6366F1' : '#334155' }}
              />
              {i < steps.length - 1 && (
                <div className="w-px flex-1 mt-1" style={{ background: 'rgba(99,102,241,0.2)', minHeight: '20px' }} />
              )}
            </div>
            <div className="pb-3">
              <p className="text-xs font-medium text-slate-300">{step.label}</p>
              <p className="text-xs text-slate-500">{step.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ContributeModal ──────────────────────────────────────────────────────────

interface ContributeModalProps {
  project: LaunchProject
  isOpen: boolean
  onClose: () => void
  /** Simulated staked OMNI for demo whitelist check */
  stakedOmni?: number
}

export function ContributeModal({
  project,
  isOpen,
  onClose,
  stakedOmni = 1_500,
}: ContributeModalProps) {
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const parsedAmount = parseFloat(amount) || 0
  const tokensReceived =
    parsedAmount > 0 && project.pricePerTokenSui > 0
      ? parsedAmount / project.pricePerTokenSui
      : 0

  const qualifies = !project.whitelistRequired || stakedOmni >= project.minOmniStake
  const belowMin = parsedAmount > 0 && parsedAmount < project.minContributionSui
  const aboveMax = parsedAmount > project.maxContributionSui
  const hasError = belowMin || aboveMax || !qualifies
  const canSubmit = parsedAmount > 0 && !hasError && !submitting

  const setPreset = useCallback(
    (type: 'min' | 'mid' | 'max') => {
      const value =
        type === 'min'
          ? project.minContributionSui
          : type === 'max'
            ? project.maxContributionSui
            : Math.floor((project.minContributionSui + project.maxContributionSui) / 2)
      setAmount(String(value))
    },
    [project.minContributionSui, project.maxContributionSui],
  )

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    setSubmitting(true)
    // Simulate tx delay
    await new Promise<void>((resolve) => setTimeout(resolve, 1500))
    setSubmitting(false)
    setSubmitted(true)
  }, [canSubmit])

  if (!isOpen) return null

  const pct = fillPercent(project)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Contribute to ${project.name}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-md rounded-2xl p-6 flex flex-col gap-5 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(22,22,48,0.98), rgba(13,13,31,0.99))',
          border: '1px solid rgba(99,102,241,0.25)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/8 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {submitted ? (
          /* Success state */
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-2xl"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              &#10003;
            </div>
            <div>
              <p className="text-lg font-bold text-white">Contribution Submitted!</p>
              <p className="mt-1 text-sm text-slate-400">
                You contributed <span className="text-white font-semibold">{amount} SUI</span> to{' '}
                {project.name}. Your receipt NFT will appear in your wallet shortly.
              </p>
            </div>
            <button
              onClick={() => { setSubmitted(false); setAmount(''); onClose() }}
              className="mt-2 w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black text-white"
                  style={{ background: `linear-gradient(135deg, ${project.logoGradient[0]}, ${project.logoGradient[1]})` }}
                >
                  {project.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-bold text-white">{project.name}</p>
                  <p className="text-xs text-slate-500">{project.symbol} token sale</p>
                </div>
              </div>

              {/* Fill bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>{formatSui(project.raisedSui)} SUI raised</span>
                  <span>{pct}% filled</span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${project.logoGradient[0]}, ${project.logoGradient[1]})`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Whitelist status */}
            <div
              className="flex items-center gap-3 rounded-xl p-3"
              style={{
                background: qualifies ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${qualifies ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}
            >
              <span className="text-lg">{qualifies ? '✓' : '✗'}</span>
              <div>
                {qualifies ? (
                  <>
                    <p className="text-sm font-semibold" style={{ color: '#34D399' }}>
                      You qualify
                    </p>
                    <p className="text-xs text-slate-400">
                      {project.whitelistRequired
                        ? `${stakedOmni.toLocaleString()} OMNI staked (min ${project.minOmniStake.toLocaleString()})`
                        : 'Public sale — no stake required'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold" style={{ color: '#F87171' }}>
                      Whitelist required
                    </p>
                    <p className="text-xs text-slate-400">
                      Need {project.minOmniStake.toLocaleString()} OMNI staked — you have{' '}
                      {stakedOmni.toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Amount input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Amount (SUI)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={project.minContributionSui}
                  max={project.maxContributionSui}
                  step="0.1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ${project.minContributionSui} SUI`}
                  className="w-full rounded-xl px-4 py-3 pr-16 text-sm font-mono text-white placeholder-slate-600 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${belowMin || aboveMax ? 'rgba(239,68,68,0.5)' : 'rgba(99,102,241,0.25)'}`,
                  }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  SUI
                </span>
              </div>

              {/* Presets */}
              <div className="flex gap-2">
                {(['min', 'mid', 'max'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setPreset(preset)}
                    className="flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors"
                    style={{
                      background: 'rgba(99,102,241,0.08)',
                      border: '1px solid rgba(99,102,241,0.15)',
                      color: '#818CF8',
                    }}
                  >
                    {preset === 'min'
                      ? `MIN ${project.minContributionSui}`
                      : preset === 'max'
                        ? `MAX ${project.maxContributionSui}`
                        : 'HALF'}
                  </button>
                ))}
              </div>

              {/* Errors */}
              {belowMin && (
                <p className="text-xs" style={{ color: '#F87171' }}>
                  Minimum contribution is {project.minContributionSui} SUI
                </p>
              )}
              {aboveMax && (
                <p className="text-xs" style={{ color: '#F87171' }}>
                  Maximum contribution is {project.maxContributionSui} SUI
                </p>
              )}
            </div>

            {/* Allocation preview */}
            {tokensReceived > 0 && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.15)',
                }}
              >
                <p className="text-xs text-slate-500 mb-2">Your allocation</p>
                <p className="text-lg font-bold text-white">
                  ~{tokensReceived.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
                  <span className="text-indigo-400">{project.symbol}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  At {project.pricePerTokenSui} SUI per token
                </p>
              </div>
            )}

            {/* Vesting schedule */}
            <VestingSchedule
              tgePercent={project.tgePercent}
              cliffMonths={project.cliffMonths}
              vestingMonths={project.vestingMonths}
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90 active:scale-[0.98]"
              style={{
                background: canSubmit
                  ? `linear-gradient(135deg, ${project.logoGradient[0]}, ${project.logoGradient[1]})`
                  : 'rgba(99,102,241,0.2)',
              }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Confirming...
                </span>
              ) : (
                `Contribute ${parsedAmount > 0 ? `${parsedAmount} SUI` : ''}`
              )}
            </button>

            <p className="text-center text-xs text-slate-600">
              2% platform fee applies. Contributions are non-refundable unless soft cap is not reached.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import TokenSelector from '@/components/swap/TokenSelector'
import TokenModal from '@/components/swap/TokenModal'
import { Token, SUI_TOKENS } from '@/lib/tokens'
import {
  TWAP_PRESETS,
  buildCreateTWAPTx,
  estimateTotalDuration,
  buildExecutionTimeline,
  formatTokenAmount,
} from '@/lib/twap'

// ─── Types ────────────────────────────────────────────────────────────────────

type TokenModalTarget = 'in' | 'out' | null

// ─── Preset selector ──────────────────────────────────────────────────────────

interface PresetSelectorProps {
  selectedIndex: number | null
  onChange: (index: number) => void
}

function PresetSelector({ selectedIndex, onChange }: PresetSelectorProps) {
  return (
    <div>
      <label className="text-xs font-medium mb-2 block" style={{ color: '#64748B' }}>
        Schedule preset
      </label>
      <div className="flex flex-wrap gap-2" role="group" aria-label="TWAP preset">
        {TWAP_PRESETS.map((preset, i) => {
          const active = selectedIndex === i
          return (
            <button
              key={i}
              onClick={() => onChange(i)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{
                background: active
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.2))'
                  : 'rgba(255,255,255,0.04)',
                border: active
                  ? '1px solid rgba(99,102,241,0.45)'
                  : '1px solid rgba(99,102,241,0.15)',
                color: active ? '#818CF8' : '#64748B',
              }}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Custom schedule inputs ───────────────────────────────────────────────────

interface CustomScheduleProps {
  chunks: string
  intervalMinutes: string
  onChunksChange: (v: string) => void
  onIntervalChange: (v: string) => void
}

function CustomSchedule({
  chunks,
  intervalMinutes,
  onChunksChange,
  onIntervalChange,
}: CustomScheduleProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: '#64748B' }}>
          Number of chunks
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={chunks}
          onChange={(e) => {
            const v = e.target.value
            if (v === '' || /^\d+$/.test(v)) onChunksChange(v)
          }}
          placeholder="10"
          className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold bg-transparent outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(99,102,241,0.2)',
            color: '#E2E8F0',
            caretColor: '#6366F1',
          }}
        />
      </div>
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: '#64748B' }}>
          Interval (minutes)
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={intervalMinutes}
          onChange={(e) => {
            const v = e.target.value
            if (v === '' || /^\d+$/.test(v)) onIntervalChange(v)
          }}
          placeholder="60"
          className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold bg-transparent outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(99,102,241,0.2)',
            color: '#E2E8F0',
            caretColor: '#6366F1',
          }}
        />
      </div>
    </div>
  )
}

// ─── Summary preview ──────────────────────────────────────────────────────────

interface SummaryPreviewProps {
  tokenIn: Token | null
  tokenOut: Token | null
  totalAmount: string
  numChunks: number
  intervalMs: number
}

function SummaryPreview({
  tokenIn,
  tokenOut,
  totalAmount,
  numChunks,
  intervalMs,
}: SummaryPreviewProps) {
  const amountNum = parseFloat(totalAmount) || 0
  const chunkSize = numChunks > 0 ? amountNum / numChunks : 0
  const duration = estimateTotalDuration(numChunks, intervalMs)

  const isValid = tokenIn && tokenOut && amountNum > 0 && numChunks > 0 && intervalMs > 0
  if (!isValid) return null

  // Build next few execution times
  const now = Date.now()
  const timeline = buildExecutionTimeline(now - intervalMs, intervalMs, Math.min(numChunks, 5), 0)

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <span className="text-xs font-semibold" style={{ color: '#818CF8' }}>TWAP Preview</span>
      </div>

      {/* Main description */}
      <p className="text-sm font-medium leading-relaxed" style={{ color: '#E2E8F0' }}>
        Buying{' '}
        <span style={{ color: '#06B6D4' }}>{tokenOut?.symbol}</span>
        {' '}with{' '}
        <span style={{ color: '#818CF8' }}>{tokenIn?.symbol}</span>
        {' '}—{' '}
        <span style={{ color: '#818CF8' }}>{numChunks} chunks</span>
        {' '}of{' '}
        <span style={{ color: '#06B6D4' }}>
          {chunkSize.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tokenIn?.symbol}
        </span>
        {' '}over{' '}
        <span style={{ color: '#E2E8F0' }}>{duration}</span>
      </p>

      {/* Detail rows */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span style={{ color: '#64748B' }}>Total amount</span>
          <span style={{ color: '#E2E8F0', fontWeight: 600 }}>
            {amountNum.toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenIn?.symbol}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#64748B' }}>Per chunk</span>
          <span style={{ color: '#E2E8F0' }}>
            {chunkSize.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tokenIn?.symbol}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#64748B' }}>Chunks</span>
          <span style={{ color: '#E2E8F0' }}>{numChunks}</span>
        </div>
        <div
          className="flex justify-between pt-1.5"
          style={{ borderTop: '1px solid rgba(99,102,241,0.15)' }}
        >
          <span style={{ color: '#64748B' }}>Est. total duration</span>
          <span className="font-semibold" style={{ color: '#818CF8' }}>{duration}</span>
        </div>
      </div>

      {/* Execution timeline */}
      <div style={{ borderTop: '1px solid rgba(99,102,241,0.12)', paddingTop: 10 }}>
        <p className="text-xs font-semibold mb-2" style={{ color: '#64748B' }}>
          Estimated execution timeline
        </p>
        <div className="space-y-1">
          {timeline.map((date, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                style={{ background: 'rgba(99,102,241,0.2)', color: '#818CF8' }}
              >
                {i + 1}
              </span>
              <span style={{ color: '#94A3B8' }}>
                {date.toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {i === timeline.length - 1 && numChunks > 5 && (
                <span style={{ color: '#475569' }}>+ {numChunks - 5} more</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CreateTWAPCardProps {
  onOrderCreated?: (txDigest: string) => void
}

export function CreateTWAPCard({ onOrderCreated }: CreateTWAPCardProps) {
  const account = useCurrentAccount()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()

  const [tokenIn, setTokenIn] = useState<Token | null>(
    SUI_TOKENS.find((t) => t.symbol === 'USDC') ?? null,
  )
  const [tokenOut, setTokenOut] = useState<Token | null>(
    SUI_TOKENS.find((t) => t.symbol === 'SUI') ?? null,
  )
  const [totalAmount, setTotalAmount] = useState('')
  const [tokenModal, setTokenModal] = useState<TokenModalTarget>(null)

  // Schedule state: preset index (-1 = custom)
  const [presetIndex, setPresetIndex] = useState<number | null>(1) // default: 10 chunks / 1hr
  const [customChunks, setCustomChunks] = useState('10')
  const [customIntervalMin, setCustomIntervalMin] = useState('60')

  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    msg: string
    digest?: string
  } | null>(null)

  // Derived schedule values
  const { numChunks, intervalMs } = useMemo(() => {
    if (presetIndex !== null) {
      const preset = TWAP_PRESETS[presetIndex]
      return { numChunks: preset.chunks, intervalMs: preset.intervalMs }
    }
    return {
      numChunks: parseInt(customChunks) || 0,
      intervalMs: (parseInt(customIntervalMin) || 0) * 60 * 1000,
    }
  }, [presetIndex, customChunks, customIntervalMin])

  const handlePresetSelect = useCallback((index: number) => {
    setPresetIndex(index)
  }, [])

  const handleCustomMode = useCallback(() => {
    setPresetIndex(null)
  }, [])

  const handleTokenInSelect = useCallback((t: Token) => {
    setTokenIn(t)
    if (t.address === tokenOut?.address) setTokenOut(null)
  }, [tokenOut])

  const handleTokenOutSelect = useCallback((t: Token) => {
    setTokenOut(t)
    if (t.address === tokenIn?.address) setTokenIn(null)
  }, [tokenIn])

  const swapTokens = useCallback(() => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
  }, [tokenIn, tokenOut])

  const canCreate = useMemo(() => {
    return (
      !!account &&
      !!tokenIn &&
      !!tokenOut &&
      parseFloat(totalAmount) > 0 &&
      numChunks > 0 &&
      intervalMs > 0
    )
  }, [account, tokenIn, tokenOut, totalAmount, numChunks, intervalMs])

  const handleCreate = useCallback(async () => {
    if (!canCreate || !account || !tokenIn) return
    setSubmitting(true)
    setFeedback(null)

    try {
      const decimals = tokenIn.decimals
      const amountBaseUnits = BigInt(Math.round(parseFloat(totalAmount) * 10 ** decimals))

      const tx = buildCreateTWAPTx(
        '0x_PLACEHOLDER_COIN_OBJECT_ID',
        amountBaseUnits,
        numChunks,
        intervalMs,
        0n,
      )

      // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
      const result = await signAndExecute({ transaction: tx })
      setFeedback({
        type: 'success',
        msg: `TWAP order created! Tx: ${result.digest.slice(0, 20)}…`,
        digest: result.digest,
      })
      onOrderCreated?.(result.digest)
      setTotalAmount('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create TWAP order'
      setFeedback({ type: 'error', msg })
    } finally {
      setSubmitting(false)
    }
  }, [
    canCreate, account, tokenIn, totalAmount,
    numChunks, intervalMs, signAndExecute, onOrderCreated,
  ])

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Token pair selectors */}
        <div className="relative flex flex-col gap-1">
          <TokenSelector
            token={tokenIn}
            amount={totalAmount}
            onAmountChange={setTotalAmount}
            onTokenClick={() => setTokenModal('in')}
            label="Spend (total)"
          />

          {/* Swap button */}
          <div className="flex justify-center -my-0.5 relative z-10">
            <button
              onClick={swapTokens}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150"
              style={{
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.25)',
                color: '#818CF8',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.25)'
                e.currentTarget.style.transform = 'rotate(180deg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(99,102,241,0.12)'
                e.currentTarget.style.transform = 'rotate(0deg)'
              }}
              aria-label="Swap tokens"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          <TokenSelector
            token={tokenOut}
            amount=""
            onAmountChange={() => {}}
            onTokenClick={() => setTokenModal('out')}
            label="Receive (estimated)"
            readOnly
          />
        </div>

        {/* Preset selector */}
        <PresetSelector selectedIndex={presetIndex} onChange={handlePresetSelect} />

        {/* Custom mode toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCustomMode}
            className="text-xs font-medium transition-all duration-150 px-2.5 py-1 rounded-lg"
            style={{
              background: presetIndex === null ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              border: presetIndex === null ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(99,102,241,0.12)',
              color: presetIndex === null ? '#818CF8' : '#64748B',
            }}
          >
            Custom schedule
          </button>
        </div>

        {/* Custom inputs */}
        {presetIndex === null && (
          <CustomSchedule
            chunks={customChunks}
            intervalMinutes={customIntervalMin}
            onChunksChange={setCustomChunks}
            onIntervalChange={setCustomIntervalMin}
          />
        )}

        {/* Summary preview */}
        <SummaryPreview
          tokenIn={tokenIn}
          tokenOut={tokenOut}
          totalAmount={totalAmount}
          numChunks={numChunks}
          intervalMs={intervalMs}
        />

        {/* Wallet warning */}
        {!account && (
          <div
            className="text-xs p-3 rounded-xl"
            style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.2)',
              color: '#818CF8',
            }}
          >
            Connect your wallet to create a TWAP order.
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleCreate}
          disabled={!canCreate || submitting}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200"
          style={{
            background: !canCreate
              ? 'rgba(255,255,255,0.06)'
              : 'linear-gradient(135deg, #6366F1, #06B6D4)',
            color: !canCreate ? '#475569' : '#fff',
            cursor: !canCreate ? 'not-allowed' : 'pointer',
            border: !canCreate ? '1px solid rgba(99,102,241,0.1)' : 'none',
            boxShadow: canCreate ? '0 4px 20px rgba(99,102,241,0.35)' : 'none',
          }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Creating Order…
            </span>
          ) : !account ? (
            'Connect wallet'
          ) : !canCreate ? (
            'Configure your TWAP'
          ) : (
            'Create TWAP Order'
          )}
        </button>

        {/* Feedback */}
        {feedback && (
          <div
            className="rounded-xl px-4 py-3 text-xs"
            style={{
              background: feedback.type === 'success'
                ? 'rgba(16,185,129,0.1)'
                : 'rgba(239,68,68,0.1)',
              border: `1px solid ${feedback.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: feedback.type === 'success' ? '#10B981' : '#FCA5A5',
            }}
          >
            {feedback.msg}
          </div>
        )}
      </div>

      {/* Token modals */}
      <TokenModal
        open={tokenModal === 'in'}
        onClose={() => setTokenModal(null)}
        onSelect={handleTokenInSelect}
        excludeAddress={tokenOut?.address}
      />
      <TokenModal
        open={tokenModal === 'out'}
        onClose={() => setTokenModal(null)}
        onSelect={handleTokenOutSelect}
        excludeAddress={tokenIn?.address}
      />
    </>
  )
}

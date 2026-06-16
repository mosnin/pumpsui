'use client'

import { useState, useCallback, useMemo } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import TokenSelector from '@/components/swap/TokenSelector'
import TokenModal from '@/components/swap/TokenModal'
import { Token, SUI_TOKENS, findToken } from '@/lib/tokens'
import {
  DCA_INTERVALS,
  buildCreateDCATx,
  formatCountdown,
  computeTotalCost,
  SUI_CLOCK_OBJECT_ID,
} from '@/lib/dca'

// ─── Types ────────────────────────────────────────────────────────────────────

type TokenModalTarget = 'in' | 'out' | null

// ─── Frequency Selector ───────────────────────────────────────────────────────

interface FrequencySelectorProps {
  selectedMs: number
  onChange: (ms: number) => void
}

function FrequencySelector({ selectedMs, onChange }: FrequencySelectorProps) {
  return (
    <div>
      <label className="text-xs font-medium mb-2 block" style={{ color: '#64748B' }}>
        Frequency
      </label>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Execution frequency"
      >
        {DCA_INTERVALS.map((interval) => {
          const active = selectedMs === interval.ms
          return (
            <button
              key={interval.ms}
              onClick={() => onChange(interval.ms)}
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
              {interval.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Summary Preview ──────────────────────────────────────────────────────────

interface SummaryPreviewProps {
  tokenIn: Token | null
  tokenOut: Token | null
  amountPerCycle: string
  totalCycles: string
  intervalMs: number
}

function SummaryPreview({
  tokenIn,
  tokenOut,
  amountPerCycle,
  totalCycles,
  intervalMs,
}: SummaryPreviewProps) {
  const interval = DCA_INTERVALS.find((i) => i.ms === intervalMs)
  const intervalLabel = interval ? interval.label.replace('Every ', 'every ') : `every ${intervalMs}ms`
  const cyclesNum = parseInt(totalCycles) || 0
  const amountNum = parseFloat(amountPerCycle) || 0
  const total = amountNum * cyclesNum

  const nextExecMs = intervalMs
  const countdown = formatCountdown(nextExecMs)

  const isValid = tokenIn && tokenOut && amountNum > 0 && cyclesNum > 0

  if (!isValid) return null

  return (
    <div
      className="rounded-2xl p-4 space-y-2.5"
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
        <span className="text-xs font-semibold" style={{ color: '#818CF8' }}>
          DCA Preview
        </span>
      </div>

      {/* Main line */}
      <p className="text-sm font-medium" style={{ color: '#E2E8F0' }}>
        Buying{' '}
        <span style={{ color: '#06B6D4' }}>{tokenOut?.symbol}</span>
        {' '}with{' '}
        <span style={{ color: '#818CF8' }}>{tokenIn?.symbol}</span>
      </p>

      {/* Detail rows */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span style={{ color: '#64748B' }}>Per order</span>
          <span style={{ color: '#E2E8F0', fontWeight: 600 }}>
            {amountNum.toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenIn?.symbol}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#64748B' }}>Schedule</span>
          <span style={{ color: '#E2E8F0' }}>
            {intervalLabel} × {cyclesNum} orders
          </span>
        </div>
        <div
          className="flex justify-between pt-1.5"
          style={{ borderTop: '1px solid rgba(99,102,241,0.15)' }}
        >
          <span style={{ color: '#64748B' }}>Total cost</span>
          <span className="font-bold" style={{ color: '#818CF8' }}>
            {total.toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenIn?.symbol}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#64748B' }}>Next order in</span>
          <span style={{ color: '#10B981' }}>{countdown}</span>
        </div>
      </div>

      {/* DCA benefit note */}
      <div
        className="flex items-start gap-2 pt-1"
        style={{ borderTop: '1px solid rgba(99,102,241,0.12)' }}
      >
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="#818CF8" strokeWidth="2" className="mt-0.5 flex-shrink-0"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        <p className="text-xs" style={{ color: '#64748B' }}>
          Average cost spread over time — DCA reduces timing risk
        </p>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface CreateDCACardProps {
  onPositionCreated?: (txDigest: string) => void
}

export function CreateDCACard({ onPositionCreated }: CreateDCACardProps) {
  const account = useCurrentAccount()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()

  const [tokenIn, setTokenIn] = useState<Token | null>(
    SUI_TOKENS.find((t) => t.symbol === 'USDC') ?? null,
  )
  const [tokenOut, setTokenOut] = useState<Token | null>(
    SUI_TOKENS.find((t) => t.symbol === 'SUI') ?? null,
  )
  const [amountPerCycle, setAmountPerCycle] = useState('')
  const [totalCycles, setTotalCycles] = useState('10')
  const [intervalMs, setIntervalMs] = useState<number>(DCA_INTERVALS[2].ms) // weekly
  const [tokenModal, setTokenModal] = useState<TokenModalTarget>(null)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    msg: string
    digest?: string
  } | null>(null)

  const handleAmountInput = useCallback((val: string) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) setAmountPerCycle(val)
  }, [])

  const handleCyclesInput = useCallback((val: string) => {
    if (val === '' || /^\d+$/.test(val)) setTotalCycles(val)
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
      parseFloat(amountPerCycle) > 0 &&
      parseInt(totalCycles) > 0
    )
  }, [account, tokenIn, tokenOut, amountPerCycle, totalCycles])

  const handleCreate = useCallback(async () => {
    if (!canCreate || !account || !tokenIn || !tokenOut) return
    setSubmitting(true)
    setFeedback(null)

    try {
      const decimals = tokenIn.decimals
      const amountBigint = BigInt(
        Math.round(parseFloat(amountPerCycle) * 10 ** decimals),
      )
      const cyclesBigint = BigInt(parseInt(totalCycles))

      // In a live integration, look up the user's coin object for tokenIn.
      // Here we use a placeholder — a real flow would query suiClient.getCoins().
      const tx = buildCreateDCATx({
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amountPerCycle: amountBigint,
        intervalMs: BigInt(intervalMs),
        totalCycles: cyclesBigint,
        coinObjectId: '0x_PLACEHOLDER_COIN_OBJECT_ID',
        clockObjectId: SUI_CLOCK_OBJECT_ID,
      })

      // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
      const result = await signAndExecute({ transaction: tx })
      setFeedback({
        type: 'success',
        msg: `DCA position created! Tx: ${result.digest.slice(0, 20)}…`,
        digest: result.digest,
      })
      onPositionCreated?.(result.digest)
      setAmountPerCycle('')
      setTotalCycles('10')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create DCA position'
      setFeedback({ type: 'error', msg })
    } finally {
      setSubmitting(false)
    }
  }, [
    canCreate, account, tokenIn, tokenOut,
    amountPerCycle, totalCycles, intervalMs,
    signAndExecute, onPositionCreated,
  ])

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Token pair */}
        <div className="relative flex flex-col gap-1">
          {/* Pay token */}
          <TokenSelector
            token={tokenIn}
            amount={amountPerCycle}
            onAmountChange={handleAmountInput}
            onTokenClick={() => setTokenModal('in')}
            label="Pay"
          />

          {/* Swap tokens button */}
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

          {/* Receive token (read-only amount — filled by quote) */}
          <TokenSelector
            token={tokenOut}
            amount=""
            onAmountChange={() => {}}
            onTokenClick={() => setTokenModal('out')}
            label="Receive (estimated)"
            readOnly
          />
        </div>

        {/* Frequency */}
        <FrequencySelector selectedMs={intervalMs} onChange={setIntervalMs} />

        {/* Number of orders */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: '#64748B' }}>
            Number of orders
          </label>
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(99,102,241,0.15)',
            }}
          >
            <button
              onClick={() => setTotalCycles((prev) => String(Math.max(1, parseInt(prev || '1') - 1)))}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
              style={{
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: '#818CF8',
              }}
              aria-label="Decrease cycles"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14" />
              </svg>
            </button>

            <input
              type="text"
              inputMode="numeric"
              value={totalCycles}
              onChange={(e) => handleCyclesInput(e.target.value)}
              className="flex-1 text-center text-xl font-bold bg-transparent outline-none"
              style={{ color: '#E2E8F0', caretColor: '#6366F1' }}
              aria-label="Total cycles"
            />

            <button
              onClick={() => setTotalCycles((prev) => String(parseInt(prev || '0') + 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
              style={{
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: '#818CF8',
              }}
              aria-label="Increase cycles"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex gap-1.5 mt-2">
            {[5, 10, 20, 52].map((n) => (
              <button
                key={n}
                onClick={() => setTotalCycles(String(n))}
                className="px-2 py-1 rounded-md text-xs transition-all"
                style={{
                  background: totalCycles === String(n)
                    ? 'rgba(99,102,241,0.2)'
                    : 'rgba(255,255,255,0.04)',
                  border: totalCycles === String(n)
                    ? '1px solid rgba(99,102,241,0.35)'
                    : '1px solid rgba(99,102,241,0.1)',
                  color: totalCycles === String(n) ? '#818CF8' : '#64748B',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* DCA summary preview */}
        <SummaryPreview
          tokenIn={tokenIn}
          tokenOut={tokenOut}
          amountPerCycle={amountPerCycle}
          totalCycles={totalCycles}
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
            Connect your wallet to create a DCA position.
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
              Creating Position…
            </span>
          ) : !account ? (
            'Connect wallet'
          ) : !canCreate ? (
            'Configure your DCA'
          ) : (
            'Fund & Create DCA'
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

'use client'

import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Transaction } from '@mysten/sui/transactions'
import { Token } from '@/lib/tokens'
import { SwapQuote } from '@/hooks/useSwap'
import { useExecuteSwap } from '@/hooks/useExecuteSwap'
import { useSimulation } from '@/hooks/useSimulation'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { TxStatusBadge } from './TxStatusBadge'
import { SimulationPreview } from './SimulationPreview'
import { OMNIWEAVE_FEE_BPS, PRICE_IMPACT_DANGER_THRESHOLD } from '@/lib/constants'
import { GradientSpinner } from '@/components/ui/Spinner'

const SUISCAN_TX_URL = 'https://suiscan.xyz/mainnet/tx'

interface ConfirmSwapModalProps {
  open: boolean
  onClose: () => void
  tokenIn: Token
  tokenOut: Token
  amountIn: string
  amountOut: string
  priceImpact: number
  route: SwapQuote
  slippageBps: number
  onBuildTx: () => Transaction
  onSwapAgain?: () => void
}

// Small inline row for the fee/detail summary
function DetailRow({
  label,
  value,
  valueColor,
  warning,
}: {
  label: string
  value: React.ReactNode
  valueColor?: string
  warning?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs" style={{ color: '#64748B' }}>
        {label}
      </span>
      <span
        className="text-xs font-semibold"
        style={{ color: warning ? '#F59E0B' : valueColor ?? '#E2E8F0' }}
      >
        {value}
      </span>
    </div>
  )
}

function TokenAmountRow({
  label,
  token,
  amount,
  accent,
}: {
  label: string
  token: Token
  amount: string
  accent?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl"
      style={{
        background: accent
          ? 'rgba(6,182,212,0.07)'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${accent ? 'rgba(6,182,212,0.18)' : 'rgba(99,102,241,0.12)'}`,
      }}
    >
      <div>
        <p className="text-xs mb-0.5" style={{ color: '#64748B' }}>
          {label}
        </p>
        <p className="text-xl font-bold" style={{ color: '#E2E8F0' }}>
          {parseFloat(amount).toLocaleString(undefined, { maximumFractionDigits: 6 })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <img
          src={token.logoURI}
          alt={token.symbol}
          width={28}
          height={28}
          className="rounded-full"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <span className="text-base font-bold" style={{ color: '#E2E8F0' }}>
          {token.symbol}
        </span>
      </div>
    </div>
  )
}

export function ConfirmSwapModal({
  open,
  onClose,
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  priceImpact,
  route,
  slippageBps,
  onBuildTx,
  onSwapAgain,
}: ConfirmSwapModalProps) {
  const { execute, status, txHash, error, reset } = useExecuteSwap()
  const { simulate, result: simResult, loading: simLoading, error: simError, reset: simReset } = useSimulation()
  const account = useCurrentAccount()

  // Auto-simulate when the modal opens (idle state only)
  useEffect(() => {
    if (open && status === 'idle') {
      try {
        const tx = onBuildTx()
        simulate(tx)
      } catch {
        // onBuildTx may throw if quote isn't ready; simulation just won't run
      }
    }
    // Reset simulation when modal closes
    if (!open) {
      simReset()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const isIdle = status === 'idle'
  const isSigning = status === 'signing'
  const isPending = status === 'pending'
  const isSuccess = status === 'success'
  const isError = status === 'error'
  const isLoading = isSigning || isPending

  const isDangerImpact = priceImpact >= PRICE_IMPACT_DANGER_THRESHOLD
  const isWarnImpact = priceImpact >= 2 && !isDangerImpact

  const feeTokenAmount = tokenIn
    ? ((parseFloat(amountIn) * OMNIWEAVE_FEE_BPS) / 10_000).toFixed(tokenIn.decimals > 6 ? 6 : tokenIn.decimals)
    : null
  const omniWeaveFeeDisplay = feeTokenAmount
    ? `${(OMNIWEAVE_FEE_BPS / 100).toFixed(2)}% (${feeTokenAmount} ${tokenIn?.symbol})`
    : `${(OMNIWEAVE_FEE_BPS / 100).toFixed(2)}%`
  const slippageDisplay = `${(slippageBps / 100).toFixed(2)}%`
  const minimumReceived = route.route.minimumReceived

  const handleConfirm = async () => {
    if (!isIdle) return
    try {
      const tx = onBuildTx()
      await execute(tx)
    } catch {
      // error state already set in useExecuteSwap
    }
  }

  const handleClose = () => {
    if (isLoading) return // prevent closing mid-tx
    reset()
    simReset()
    onClose()
  }

  const handleSwapAgain = () => {
    reset()
    onSwapAgain?.()
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          className="fixed inset-0 z-50"
          style={{
            background: 'rgba(6,6,17,0.8)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />

        {/* Panel */}
        <Dialog.Content
          className="fixed z-50 left-1/2 top-1/2 w-full max-w-md focus:outline-none"
          style={{ transform: 'translate(-50%, -50%)' }}
          onInteractOutside={(e) => { if (isLoading) e.preventDefault() }}
          onEscapeKeyDown={(e) => { if (isLoading) e.preventDefault() }}
          aria-describedby="confirm-swap-desc"
        >
          {/* Gradient border wrapper */}
          <div
            className="rounded-3xl p-px mx-4"
            style={{
              background:
                'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(6,182,212,0.4) 50%, rgba(99,102,241,0.3) 100%)',
            }}
          >
            <div
              className="rounded-[calc(1.5rem-1px)]"
              style={{
                background: 'linear-gradient(145deg, #0d0d1f 0%, #080814 100%)',
              }}
            >
              {/* ── IDLE / SUMMARY STATE ── */}
              {(isIdle || isError) && (
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <Dialog.Title className="text-lg font-bold" style={{ color: '#E2E8F0' }}>
                      Confirm Swap
                    </Dialog.Title>
                    <Dialog.Close asChild>
                      <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#64748B',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#94A3B8'
                          e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#64748B'
                          e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                        }}
                        aria-label="Close"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </Dialog.Close>
                  </div>

                  <p id="confirm-swap-desc" className="sr-only">
                    Review the swap details and confirm to execute the transaction.
                  </p>

                  {/* Token amounts */}
                  <div className="space-y-2 mb-4">
                    <TokenAmountRow label="You pay" token={tokenIn} amount={amountIn} />
                    {/* Arrow divider */}
                    <div className="flex justify-center">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{
                          background: 'rgba(99,102,241,0.12)',
                          border: '1px solid rgba(99,102,241,0.2)',
                          color: '#6366F1',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                      </div>
                    </div>
                    <TokenAmountRow label="You receive (estimated)" token={tokenOut} amount={amountOut} accent />
                  </div>

                  {/* Price impact warning banner */}
                  {(isDangerImpact || isWarnImpact) && (
                    <div
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-xs mb-4"
                      style={{
                        background: isDangerImpact ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                        border: `1px solid ${isDangerImpact ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                        color: isDangerImpact ? '#FCA5A5' : '#FDE68A',
                      }}
                    >
                      <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <span>
                        {isDangerImpact
                          ? `High price impact of ${priceImpact.toFixed(2)}%. You may lose a significant portion of your funds.`
                          : `Price impact of ${priceImpact.toFixed(2)}% is above 2%. Consider trading a smaller amount.`}
                      </span>
                    </div>
                  )}

                  {/* Error message */}
                  {isError && error && (
                    <div
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-xs mb-4"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        color: '#FCA5A5',
                      }}
                    >
                      <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Simulation preview */}
                  <SimulationPreview
                    result={simResult}
                    loading={simLoading}
                    error={simError}
                    userAddress={account?.address ?? ''}
                    onSimulate={() => {
                      try {
                        simulate(onBuildTx())
                      } catch {
                        // ignore build errors
                      }
                    }}
                  />

                  {/* Route breakdown */}
                  <div
                    className="rounded-xl px-4 py-1 mb-4"
                    style={{
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(99,102,241,0.1)',
                    }}
                  >
                    <p className="text-xs font-semibold py-2 mb-1" style={{ color: '#94A3B8', borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
                      Route
                    </p>

                    {/* DEX route steps */}
                    <div className="flex flex-wrap items-center gap-1 py-2 mb-1">
                      {/* Token in chip */}
                      <span
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: '#E2E8F0' }}
                      >
                        {tokenIn.symbol}
                      </span>

                      {route.route.steps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                          <span
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{
                              background: step.dex.bgColor,
                              border: `1px solid ${step.dex.color}33`,
                              color: step.dex.color,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: step.dex.color }} />
                            {step.dex.name}
                            <span
                              className="px-1 py-0.5 rounded text-xs font-bold"
                              style={{ background: 'rgba(0,0,0,0.3)', color: step.dex.color }}
                            >
                              {step.percentage}%
                            </span>
                          </span>
                        </div>
                      ))}

                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>

                      {/* Token out chip */}
                      <span
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)', color: '#E2E8F0' }}
                      >
                        {tokenOut.symbol}
                      </span>
                    </div>

                    {/* Fee breakdown */}
                    <div style={{ borderTop: '1px solid rgba(99,102,241,0.08)' }}>
                      <DetailRow
                        label="OmniWeave fee"
                        value={omniWeaveFeeDisplay}
                        valueColor="#10B981"
                      />
                      <DetailRow
                        label="Price impact"
                        value={`${priceImpact.toFixed(2)}%`}
                        warning={priceImpact >= 2}
                      />
                      <DetailRow
                        label="Network gas (est.)"
                        value={`≈ $${route.route.fee}`}
                      />
                      <DetailRow
                        label="Slippage tolerance"
                        value={slippageDisplay}
                      />
                      <DetailRow
                        label="Minimum received"
                        value={`${parseFloat(minimumReceived).toLocaleString(undefined, { maximumFractionDigits: 6 })} ${tokenOut.symbol}`}
                      />
                    </div>
                  </div>

                  {/* Simulation failure warning — shown above CTA when sim failed */}
                  {simResult && !simResult.success && isIdle && (
                    <div
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-xs mb-3"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#FCA5A5',
                      }}
                    >
                      <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <span>
                        Simulation shows this transaction would fail. Confirm is disabled.
                      </span>
                    </div>
                  )}

                  {/* CTA Button */}
                  {(() => {
                    const simFailed = !!simResult && !simResult.success
                    const isDisabled = simFailed && isIdle
                    return (
                      <button
                        onClick={isIdle && !isDisabled ? handleConfirm : () => { reset(); simReset() }}
                        disabled={isDisabled}
                        className="w-full py-4 rounded-2xl font-bold text-base relative overflow-hidden transition-all duration-200"
                        style={{
                          background: isDisabled
                            ? 'rgba(255,255,255,0.04)'
                            : isError
                            ? 'linear-gradient(135deg, #1e1e3a 0%, #12122a 100%)'
                            : isDangerImpact
                            ? 'linear-gradient(135deg, #DC2626, #EF4444)'
                            : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 40%, #06B6D4 100%)',
                          color: isDisabled ? '#475569' : isError ? '#94A3B8' : '#fff',
                          border: isDisabled
                            ? '1px solid rgba(239,68,68,0.2)'
                            : isError
                            ? '1px solid rgba(99,102,241,0.2)'
                            : 'none',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          boxShadow: isDisabled || isError
                            ? 'none'
                            : isDangerImpact
                            ? '0 4px 20px rgba(239,68,68,0.4)'
                            : '0 4px 20px rgba(99,102,241,0.4), 0 0 40px rgba(6,182,212,0.15)',
                        }}
                      >
                        {isDisabled
                          ? 'Transaction would fail'
                          : isError
                          ? 'Try again'
                          : isDangerImpact
                          ? 'Swap anyway'
                          : 'Confirm Swap'}
                      </button>
                    )
                  })()}
                </div>
              )}

              {/* ── SIGNING / PENDING STATE ── */}
              {isLoading && (
                <div className="p-8 flex flex-col items-center gap-5">
                  <Dialog.Title className="sr-only">Transaction in progress</Dialog.Title>
                  <p id="confirm-swap-desc" className="sr-only">
                    {isSigning ? 'Waiting for wallet signature.' : 'Transaction submitted, waiting for confirmation.'}
                  </p>

                  {/* Spinner with token icons */}
                  <div className="relative flex items-center justify-center w-20 h-20">
                    <GradientSpinner size="xl" className="absolute inset-0 w-full h-full" />
                    <div className="relative z-10 flex -space-x-2">
                      <img
                        src={tokenIn.logoURI}
                        alt={tokenIn.symbol}
                        width={24}
                        height={24}
                        className="rounded-full ring-2 ring-[#0d0d1f]"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                      <img
                        src={tokenOut.logoURI}
                        alt={tokenOut.symbol}
                        width={24}
                        height={24}
                        className="rounded-full ring-2 ring-[#0d0d1f]"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-base font-semibold mb-1" style={{ color: '#E2E8F0' }}>
                      {isSigning ? 'Confirm in wallet' : 'Transaction submitted'}
                    </p>
                    <p className="text-sm animate-pulse" style={{ color: '#64748B' }}>
                      {isSigning
                        ? 'Please approve the transaction in your wallet…'
                        : 'Waiting for on-chain confirmation…'}
                    </p>
                  </div>

                  {isPending && txHash && (
                    <a
                      href={`${SUISCAN_TX_URL}/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
                      style={{ color: '#6366F1' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      View on Suiscan
                    </a>
                  )}

                  <TxStatusBadge status="pending" txHash={txHash} />
                </div>
              )}

              {/* ── SUCCESS STATE ── */}
              {isSuccess && (
                <div className="p-8 flex flex-col items-center gap-5">
                  <Dialog.Title className="sr-only">Swap confirmed</Dialog.Title>
                  <p id="confirm-swap-desc" className="sr-only">Your swap was successfully executed.</p>

                  {/* Success checkmark */}
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(16,185,129,0.12)',
                      border: '2px solid rgba(16,185,129,0.3)',
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>

                  <div className="text-center">
                    <p className="text-lg font-bold mb-1" style={{ color: '#E2E8F0' }}>
                      Swap Confirmed!
                    </p>
                    <p className="text-sm" style={{ color: '#64748B' }}>
                      {parseFloat(amountIn).toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenIn.symbol}
                      {' → '}
                      {parseFloat(amountOut).toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenOut.symbol}
                    </p>
                  </div>

                  <TxStatusBadge status="success" txHash={txHash} />

                  {txHash && (
                    <a
                      href={`${SUISCAN_TX_URL}/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
                      style={{ color: '#6366F1' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      {txHash.slice(0, 8)}…{txHash.slice(-6)} — View on Suiscan
                    </a>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#94A3B8',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                    >
                      Close
                    </button>
                    <button
                      onClick={handleSwapAgain}
                      className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all duration-200"
                      style={{
                        background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 40%, #06B6D4 100%)',
                        color: '#fff',
                        boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.5)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      Swap again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default ConfirmSwapModal

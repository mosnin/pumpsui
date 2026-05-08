'use client'

import React, { useState, useCallback } from 'react'
import { X, AlertTriangle, Fuel, ChevronDown } from 'lucide-react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { buildWithdrawFeesTx, type TreasuryBalance } from '@/lib/admin'
import { formatTokenAmount } from '@/lib/formatters'
import { parseAmount } from '@/lib/formatters'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeeWithdrawModalProps {
  open: boolean
  onClose: () => void
  treasuryBalances: TreasuryBalance[]
  adminCapId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FeeWithdrawModal({
  open,
  onClose,
  treasuryBalances,
  adminCapId,
}: FeeWithdrawModalProps) {
  const account = useCurrentAccount()
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()

  // Form state
  const [selectedCoinType, setSelectedCoinType] = useState<string>(
    treasuryBalances[0]?.coinType ?? '',
  )
  const [amountStr, setAmountStr] = useState('')
  const [destination, setDestination] = useState(account?.address ?? '')
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false)
  const [txResult, setTxResult] = useState<{ digest: string } | null>(null)
  const [txError, setTxError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  // Derived values
  const selectedBalance = treasuryBalances.find((b) => b.coinType === selectedCoinType)
  const maxHuman = selectedBalance
    ? formatTokenAmount(selectedBalance.rawBalance, selectedBalance.decimals, 6)
    : '0'

  const parsedAmount = selectedBalance
    ? parseAmount(amountStr, selectedBalance.decimals)
    : 0n

  const exceedsMax = selectedBalance ? parsedAmount > selectedBalance.rawBalance : false

  const isValid =
    parsedAmount > 0n &&
    !exceedsMax &&
    destination.startsWith('0x') &&
    destination.length >= 10 &&
    selectedCoinType !== '' &&
    adminCapId !== ''

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleMax = useCallback(() => {
    if (!selectedBalance) return
    setAmountStr(formatTokenAmount(selectedBalance.rawBalance, selectedBalance.decimals, 6))
  }, [selectedBalance])

  const handleSelectToken = useCallback((coinType: string) => {
    setSelectedCoinType(coinType)
    setAmountStr('')
    setTokenDropdownOpen(false)
  }, [])

  const handleConfirm = useCallback(() => {
    setTxError(null)
    setConfirming(true)
  }, [])

  const handleExecute = useCallback(() => {
    if (!isValid || !selectedBalance) return

    const tx = buildWithdrawFeesTx(selectedCoinType, parsedAmount, adminCapId, destination)

    signAndExecute(
      // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
      { transaction: tx },
      {
        onSuccess: (result) => {
          setTxResult({ digest: result.digest })
          setConfirming(false)
        },
        onError: (err) => {
          setTxError(err.message ?? 'Transaction failed')
          setConfirming(false)
        },
      },
    )
  }, [isValid, selectedBalance, selectedCoinType, parsedAmount, adminCapId, destination, signAndExecute])

  const handleClose = useCallback(() => {
    setAmountStr('')
    setDestination(account?.address ?? '')
    setTxResult(null)
    setTxError(null)
    setConfirming(false)
    onClose()
  }, [account, onClose])

  if (!open) return null

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className="relative w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: 'linear-gradient(135deg, #161630 0%, #0D0D1F 100%)',
          border: '1px solid rgba(99,102,241,0.35)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#E2E8F0]">Withdraw Fees</h2>
            <p className="text-xs text-slate-500 mt-0.5">Transfer accumulated fees from treasury</p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-[#E2E8F0] transition-colors p-1 rounded-lg hover:bg-[#2A2A5A]/40"
          >
            <X size={18} />
          </button>
        </div>

        {txResult ? (
          // ── Success state ──
          <div className="flex flex-col items-center gap-4 py-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)' }}
            >
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-[#E2E8F0] font-semibold">Withdrawal Successful</p>
            <a
              href={`https://suiscan.xyz/mainnet/tx/${txResult.digest}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#06B6D4] hover:underline font-mono break-all text-center"
            >
              {txResult.digest}
            </a>
            <Button variant="secondary" size="sm" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : confirming ? (
          // ── Confirmation screen ──
          <div className="flex flex-col gap-4">
            <div
              className="rounded-xl p-4 flex flex-col gap-2"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                <AlertTriangle size={15} />
                Confirm Withdrawal
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                You are about to withdraw{' '}
                <span className="text-[#E2E8F0] font-semibold">
                  {amountStr} {selectedBalance?.symbol}
                </span>{' '}
                from the treasury to:
              </p>
              <p className="text-xs font-mono text-[#06B6D4] break-all">{destination}</p>
            </div>

            <div
              className="rounded-xl p-3 flex items-center gap-2 text-xs"
              style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <Fuel size={13} className="text-[#6366F1] shrink-0" />
              <span className="text-slate-400">Estimated gas:</span>
              <span className="text-[#E2E8F0] font-semibold ml-auto">~0.005 SUI</span>
            </div>

            {txError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                {txError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setConfirming(false)} disabled={isPending}>
                Back
              </Button>
              <Button variant="primary" onClick={handleExecute} loading={isPending}>
                {isPending ? 'Sending…' : 'Execute'}
              </Button>
            </div>
          </div>
        ) : (
          // ── Form ──
          <div className="flex flex-col gap-4">
            {/* Token selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#94A3B8] tracking-wide">Token</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTokenDropdownOpen((v) => !v)}
                  className={cn(
                    'w-full h-11 px-4 rounded-xl text-sm text-left',
                    'bg-[#0D0D1F] border border-[#2A2A5A]',
                    'hover:border-[#3A3A7A] transition-colors',
                    'flex items-center justify-between',
                    tokenDropdownOpen && 'border-[#6366F1] shadow-[0_0_0_3px_rgba(99,102,241,0.15)]',
                  )}
                >
                  <span className="text-[#E2E8F0] font-medium">
                    {selectedBalance?.symbol ?? 'Select token'}
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedBalance && (
                      <span className="text-xs text-slate-500 font-mono">
                        {formatTokenAmount(selectedBalance.rawBalance, selectedBalance.decimals, 4)} max
                      </span>
                    )}
                    <ChevronDown
                      size={15}
                      className={cn(
                        'text-slate-500 transition-transform',
                        tokenDropdownOpen && 'rotate-180',
                      )}
                    />
                  </div>
                </button>

                {tokenDropdownOpen && (
                  <div
                    className="absolute z-10 top-full mt-1 w-full rounded-xl overflow-hidden"
                    style={{
                      background: '#161630',
                      border: '1px solid rgba(42,42,90,0.8)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}
                  >
                    {treasuryBalances.map((bal) => (
                      <button
                        key={bal.coinType}
                        type="button"
                        onClick={() => handleSelectToken(bal.coinType)}
                        className={cn(
                          'w-full px-4 py-3 text-sm text-left flex items-center justify-between',
                          'hover:bg-[#6366F1]/10 transition-colors',
                          bal.coinType === selectedCoinType && 'bg-[#6366F1]/15 text-[#818CF8]',
                        )}
                      >
                        <span className="font-semibold text-[#E2E8F0]">{bal.symbol}</span>
                        <span className="text-xs text-slate-500 font-mono">
                          {formatTokenAmount(bal.rawBalance, bal.decimals, 4)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Amount input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#94A3B8] tracking-wide">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  className={cn(
                    'w-full h-11 px-4 pr-20 rounded-xl text-sm',
                    'bg-[#0D0D1F] border text-[#E2E8F0]',
                    'placeholder:text-[#64748B]',
                    'transition-all duration-200',
                    'focus:outline-none focus:border-[#6366F1]',
                    'focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]',
                    exceedsMax
                      ? 'border-rose-500/60 focus:border-rose-500'
                      : 'border-[#2A2A5A] hover:border-[#3A3A7A]',
                    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                  )}
                />
                <button
                  type="button"
                  onClick={handleMax}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6366F1] hover:text-[#818CF8] transition-colors px-2 py-1 rounded-md hover:bg-[#6366F1]/10"
                >
                  MAX
                </button>
              </div>
              {exceedsMax && (
                <p className="text-xs text-rose-400">
                  Exceeds treasury balance ({maxHuman} {selectedBalance?.symbol})
                </p>
              )}
            </div>

            {/* Destination address */}
            <Input
              label="Destination Address"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="0x..."
              helperText="Defaults to your connected wallet"
            />

            {/* Gas estimate */}
            <div
              className="rounded-xl p-3 flex items-center gap-2 text-xs"
              style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <Fuel size={13} className="text-[#6366F1] shrink-0" />
              <span className="text-slate-400">Estimated gas:</span>
              <span className="text-[#E2E8F0] font-semibold ml-auto">~0.005 SUI</span>
            </div>

            <Button
              variant="primary"
              size="md"
              disabled={!isValid}
              onClick={handleConfirm}
              className="w-full"
            >
              Review Withdrawal
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

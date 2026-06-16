'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { LPPosition, buildRemoveLiquidityTx } from '@/lib/liquidity'
import { DEXBadge } from '@/components/common/DEXBadge'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'

interface RemoveLiquidityModalProps {
  open: boolean
  onClose: () => void
  position: LPPosition | null
}

export default function RemoveLiquidityModal({ open, onClose, position }: RemoveLiquidityModalProps) {
  const account = useCurrentAccount()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()

  const [percentage, setPercentage] = useState(50)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txStatus, setTxStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = () => {
    if (!position) return

    const liquidityAmount = BigInt(Math.floor(1_000_000 * percentage / 100))
    const tx = buildRemoveLiquidityTx(position.positionId, liquidityAmount)

    setIsSubmitting(true)
    setTxStatus('idle')

    signAndExecuteTransaction(
      // @ts-expect-error — dapp-kit mutation types diverge from Transaction shape at runtime
      { transaction: tx },
      {
        onSuccess: () => {
          setIsSubmitting(false)
          setTxStatus('success')
          setTimeout(() => {
            setTxStatus('idle')
            onClose()
          }, 1500)
        },
        onError: () => {
          setIsSubmitting(false)
          setTxStatus('error')
          setTimeout(() => setTxStatus('idle'), 3000)
        },
      },
    )
  }

  if (!open || !position) return null

  const receiveAmount0 = (position.amount0 * percentage / 100)
  const receiveAmount1 = (position.amount1 * percentage / 100)
  const receiveFees0 = (position.feesEarned0 * percentage / 100)
  const receiveFees1 = (position.feesEarned1 * percentage / 100)
  const receiveValueUsd = (position.valueUsd * percentage / 100)

  const fmtAmount = (v: number, symbol: string) =>
    `${v.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${symbol}`

  const fmtUsd = (v: number) =>
    v.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl flex flex-col"
        style={{
          background: 'linear-gradient(135deg, #0f0f23 0%, #0a0a1a 100%)',
          border: '1px solid rgba(99,102,241,0.3)',
          boxShadow: '0 0 60px rgba(99,102,241,0.15), 0 25px 50px rgba(0,0,0,0.5)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 border-b sticky top-0 z-10"
          style={{
            borderColor: 'rgba(99,102,241,0.15)',
            background: 'linear-gradient(135deg, #0f0f23 0%, #0a0a1a 100%)',
          }}
        >
          <h2 className="text-lg font-bold" style={{ color: '#E2E8F0' }}>
            Remove Liquidity
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: '#64748B' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.15)'
              e.currentTarget.style.color = '#E2E8F0'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#64748B'
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Position info */}
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {[position.token0, position.token1].map((tok) => (
                  <div
                    key={tok}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-[#0a0a1a]"
                    style={{ background: 'rgba(99,102,241,0.25)', color: '#6366F1' }}
                  >
                    {tok[0]}
                  </div>
                ))}
              </div>
              <span className="font-semibold text-sm" style={{ color: '#E2E8F0' }}>
                {position.token0} / {position.token1}
              </span>
            </div>
            <DEXBadge dex={position.dex} size="sm" />
          </div>

          {/* Percentage display */}
          <div className="text-center">
            <div className="text-6xl font-black mb-1" style={{ color: '#E2E8F0' }}>
              {percentage}%
            </div>
            <p className="text-sm" style={{ color: '#64748B' }}>of position to remove</p>
          </div>

          {/* Quick percentage buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => setPercentage(pct)}
                className="py-2 rounded-xl text-sm font-bold transition-all"
                style={
                  percentage === pct
                    ? { background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#EF4444' }
                    : { background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#94A3B8' }
                }
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Slider */}
          <div>
            <input
              type="range"
              min={0}
              max={100}
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-full accent-red-500"
              style={{ accentColor: '#EF4444' }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: '#475569' }}>
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* You will receive */}
          <div
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>
              You Will Receive
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(99,102,241,0.25)', color: '#6366F1' }}
                  >
                    {position.token0[0]}
                  </div>
                  <span className="text-sm" style={{ color: '#94A3B8' }}>{position.token0}</span>
                </div>
                <span className="font-semibold text-sm font-mono" style={{ color: '#E2E8F0' }}>
                  {receiveAmount0.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(6,182,212,0.25)', color: '#06B6D4' }}
                  >
                    {position.token1[0]}
                  </div>
                  <span className="text-sm" style={{ color: '#94A3B8' }}>{position.token1}</span>
                </div>
                <span className="font-semibold text-sm font-mono" style={{ color: '#E2E8F0' }}>
                  {receiveAmount1.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </span>
              </div>
            </div>

            {/* Total value */}
            <div
              className="flex items-center justify-between pt-2"
              style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}
            >
              <span className="text-xs" style={{ color: '#64748B' }}>Total value</span>
              <span className="text-sm font-bold" style={{ color: '#E2E8F0' }}>{fmtUsd(receiveValueUsd)}</span>
            </div>
          </div>

          {/* Includes fees */}
          {position.feesEarnedUsd > 0 && (
            <div
              className="rounded-xl p-4 flex flex-col gap-2"
              style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#06B6D4' }}>
                Includes Uncollected Fees
              </p>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: '#94A3B8' }}>{fmtAmount(receiveFees0, position.token0)}</span>
                <span style={{ color: '#94A3B8' }}>+</span>
                <span style={{ color: '#94A3B8' }}>{fmtAmount(receiveFees1, position.token1)}</span>
              </div>
            </div>
          )}

          {/* Not connected warning */}
          {!account && (
            <p className="text-xs text-center" style={{ color: '#64748B' }}>
              Connect your wallet to remove liquidity
            </p>
          )}

          {/* Status feedback */}
          {txStatus === 'success' && (
            <div
              className="text-center text-sm font-semibold py-2 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
            >
              Liquidity removed successfully!
            </div>
          )}
          {txStatus === 'error' && (
            <div
              className="text-center text-sm font-semibold py-2 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
            >
              Transaction failed. Please try again.
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || percentage === 0 || !account}
            className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              color: '#fff',
            }}
          >
            {isSubmitting ? 'Removing…' : `Remove ${percentage}% Liquidity`}
          </button>
        </div>
      </div>
    </div>
  )
}

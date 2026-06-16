'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Token, SUI_TOKENS, findToken } from '@/lib/tokens'
import TokenModal from '@/components/swap/TokenModal'
import { AddLiquidityParams, PRICE_RANGE_PRESETS, buildAddLiquidityTx, computeLiquidityFee, LIQUIDITY_FEE_BPS } from '@/lib/liquidity'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'

interface AddLiquidityModalProps {
  open: boolean
  onClose: () => void
  initialToken0?: string
  initialToken1?: string
  initialPoolId?: string
}

const FEE_TIERS = [
  { bps: 1, label: '0.01%', desc: 'Best for stable pairs' },
  { bps: 5, label: '0.05%', desc: 'Most popular' },
  { bps: 30, label: '0.3%', desc: 'Most pairs' },
  { bps: 100, label: '1%', desc: 'Exotic pairs' },
]

const CURRENT_PRICE = 1.2038

export default function AddLiquidityModal({
  open,
  onClose,
  initialToken0,
  initialToken1,
  initialPoolId,
}: AddLiquidityModalProps) {
  const account = useCurrentAccount()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()

  const defaultToken0 = findToken('SUI') ?? SUI_TOKENS[0]
  const defaultToken1 = findToken('USDC') ?? SUI_TOKENS[1]

  const [token0, setToken0] = useState<Token | null>(defaultToken0)
  const [token1, setToken1] = useState<Token | null>(defaultToken1)
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [minPrice, setMinPrice] = useState('0')
  const [maxPrice, setMaxPrice] = useState('∞')
  const [feeTier, setFeeTier] = useState(5)
  const [tokenModal, setTokenModal] = useState<'token0' | 'token1' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txStatus, setTxStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Initialize tokens from props
  useEffect(() => {
    if (initialToken0) {
      const t = findToken(initialToken0)
      if (t) setToken0(t)
    }
    if (initialToken1) {
      const t = findToken(initialToken1)
      if (t) setToken1(t)
    }
  }, [initialToken0, initialToken1])

  // Apply preset
  useEffect(() => {
    const preset = PRICE_RANGE_PRESETS[selectedPreset]
    if (preset.label === 'Full Range') {
      setMinPrice('0')
      setMaxPrice('∞')
    } else if ('multiplier' in preset) {
      setMinPrice((CURRENT_PRICE * (1 - preset.multiplier)).toFixed(4))
      setMaxPrice((CURRENT_PRICE * (1 + preset.multiplier)).toFixed(4))
    }
  }, [selectedPreset])

  const handleAmount0Change = (val: string) => {
    setAmount0(val)
    const parsed = parseFloat(val)
    if (!isNaN(parsed) && parsed > 0) {
      setAmount1((parsed * CURRENT_PRICE).toFixed(6))
    } else {
      setAmount1('')
    }
  }

  const handleAmount1Change = (val: string) => {
    setAmount1(val)
    const parsed = parseFloat(val)
    if (!isNaN(parsed) && parsed > 0) {
      setAmount0((parsed / CURRENT_PRICE).toFixed(6))
    } else {
      setAmount0('')
    }
  }

  const getTicksForPreset = () => {
    const preset = PRICE_RANGE_PRESETS[selectedPreset]
    if ('tickLower' in preset) {
      return { tickLower: preset.tickLower, tickUpper: preset.tickUpper }
    }
    return { tickLower: -887272, tickUpper: 887272 }
  }

  const handleSubmit = () => {
    if (!token0 || !token1 || !amount0 || !amount1) return

    const parsed0 = parseFloat(amount0)
    const parsed1 = parseFloat(amount1)
    if (isNaN(parsed0) || isNaN(parsed1) || parsed0 <= 0 || parsed1 <= 0) return

    const { tickLower, tickUpper } = getTicksForPreset()

    const rawAmount0 = BigInt(Math.floor(parsed0 * Math.pow(10, token0.decimals)))
    const rawAmount1 = BigInt(Math.floor(parsed1 * Math.pow(10, token1.decimals)))

    const fee0 = computeLiquidityFee(rawAmount0)
    const fee1 = computeLiquidityFee(rawAmount1)

    const params: AddLiquidityParams = {
      poolId: initialPoolId ?? '0xdemo_pool',
      token0: token0.symbol,
      token1: token1.symbol,
      amount0: rawAmount0 - fee0,
      amount1: rawAmount1 - fee1,
      tickLower,
      tickUpper,
      slippageBps: 50,
    }

    const tx = buildAddLiquidityTx(params)
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

  const isInRange =
    minPrice !== '0' && maxPrice !== '∞'
      ? CURRENT_PRICE >= parseFloat(minPrice) && CURRENT_PRICE <= parseFloat(maxPrice)
      : true

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg rounded-2xl flex flex-col"
          style={{
            background: 'linear-gradient(135deg, #0f0f23 0%, #0a0a1a 100%)',
            border: '1px solid rgba(99,102,241,0.3)',
            boxShadow: '0 0 60px rgba(99,102,241,0.15), 0 25px 50px rgba(0,0,0,0.5)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
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
              Add Liquidity
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
            {/* Section: Select Pair */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#64748B' }}>
                Select Pair
              </p>
              <div className="flex items-center gap-3">
                {/* Token 0 */}
                <button
                  onClick={() => setTokenModal('token0')}
                  className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all hover:opacity-80"
                  style={{
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    color: '#E2E8F0',
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(99,102,241,0.25)', color: '#6366F1' }}
                  >
                    {token0 ? token0.symbol[0] : '?'}
                  </div>
                  <span className="font-semibold text-sm">{token0?.symbol ?? 'Select'}</span>
                  <svg className="ml-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                <span className="text-slate-500 font-bold">+</span>

                {/* Token 1 */}
                <button
                  onClick={() => setTokenModal('token1')}
                  className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all hover:opacity-80"
                  style={{
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    color: '#E2E8F0',
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(6,182,212,0.25)', color: '#06B6D4' }}
                  >
                    {token1 ? token1.symbol[0] : '?'}
                  </div>
                  <span className="font-semibold text-sm">{token1?.symbol ?? 'Select'}</span>
                  <svg className="ml-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Section: Fee Tier */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#64748B' }}>
                Fee Tier
              </p>
              <div className="grid grid-cols-4 gap-2">
                {FEE_TIERS.map((tier) => (
                  <button
                    key={tier.bps}
                    onClick={() => setFeeTier(tier.bps)}
                    className="flex flex-col items-center p-2.5 rounded-xl text-center transition-all"
                    style={
                      feeTier === tier.bps
                        ? { background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.5)', color: '#E2E8F0' }
                        : { background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', color: '#94A3B8' }
                    }
                  >
                    <span className="text-sm font-bold">{tier.label}</span>
                    <span className="text-[10px] mt-0.5 leading-tight" style={{ color: feeTier === tier.bps ? '#6366F1' : '#475569' }}>
                      {tier.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Section: Price Range */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#64748B' }}>
                Set Price Range
              </p>

              {/* Preset pills */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {PRICE_RANGE_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.label}
                    onClick={() => setSelectedPreset(idx)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={
                      selectedPreset === idx
                        ? { background: '#6366F1', color: '#fff' }
                        : { background: 'rgba(99,102,241,0.1)', color: '#94A3B8', border: '1px solid rgba(99,102,241,0.2)' }
                    }
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Min/Max price inputs */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Min Price</label>
                  <div
                    className="flex items-center rounded-xl px-3 py-2"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    <input
                      type="text"
                      value={minPrice}
                      onChange={(e) => { setMinPrice(e.target.value); setSelectedPreset(-1) }}
                      className="flex-1 bg-transparent outline-none text-sm font-mono"
                      style={{ color: '#E2E8F0' }}
                      placeholder="0"
                    />
                    <span className="text-xs ml-1" style={{ color: '#64748B' }}>
                      {token1?.symbol ?? 'USDC'}/{token0?.symbol ?? 'SUI'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#64748B' }}>Max Price</label>
                  <div
                    className="flex items-center rounded-xl px-3 py-2"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    <input
                      type="text"
                      value={maxPrice}
                      onChange={(e) => { setMaxPrice(e.target.value); setSelectedPreset(-1) }}
                      className="flex-1 bg-transparent outline-none text-sm font-mono"
                      style={{ color: '#E2E8F0' }}
                      placeholder="∞"
                    />
                    <span className="text-xs ml-1" style={{ color: '#64748B' }}>
                      {token1?.symbol ?? 'USDC'}/{token0?.symbol ?? 'SUI'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current price */}
              <div
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}
              >
                <span className="text-xs" style={{ color: '#64748B' }}>Current price</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-semibold" style={{ color: '#E2E8F0' }}>
                    {CURRENT_PRICE.toFixed(4)} {token1?.symbol ?? 'USDC'}/{token0?.symbol ?? 'SUI'}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={
                      isInRange
                        ? { background: 'rgba(16,185,129,0.15)', color: '#10B981' }
                        : { background: 'rgba(239,68,68,0.15)', color: '#EF4444' }
                    }
                  >
                    {isInRange ? 'In Range' : 'Out of Range'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section: Deposit Amounts */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#64748B' }}>
                Deposit Amounts
              </p>

              <div className="flex flex-col gap-2.5">
                {/* Token 0 amount */}
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>{token0?.symbol ?? 'SUI'}</span>
                    <span className="text-xs" style={{ color: '#475569' }}>Balance: —</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={amount0}
                      onChange={(e) => handleAmount0Change(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-xl font-semibold"
                      style={{ color: '#E2E8F0' }}
                      placeholder="0.0"
                      min="0"
                    />
                    <span className="text-sm font-bold" style={{ color: '#6366F1' }}>
                      {token0?.symbol ?? 'SUI'}
                    </span>
                  </div>
                  {amount0 && !isNaN(parseFloat(amount0)) && (
                    <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                      ≈ ${(parseFloat(amount0) * CURRENT_PRICE).toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Token 1 amount */}
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>{token1?.symbol ?? 'USDC'}</span>
                    <span className="text-xs" style={{ color: '#475569' }}>Balance: —</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={amount1}
                      onChange={(e) => handleAmount1Change(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-xl font-semibold"
                      style={{ color: '#E2E8F0' }}
                      placeholder="0.0"
                      min="0"
                    />
                    <span className="text-sm font-bold" style={{ color: '#06B6D4' }}>
                      {token1?.symbol ?? 'USDC'}
                    </span>
                  </div>
                  {amount1 && !isNaN(parseFloat(amount1)) && (
                    <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                      ≈ ${parseFloat(amount1).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Platform fee disclosure */}
            {(amount0 || amount1) && (
              <div
                className="flex flex-col gap-1 px-3 py-2.5 rounded-xl text-xs"
                style={{
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.15)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ color: '#64748B' }}>Platform fee</span>
                  <span style={{ color: '#818CF8' }}>{Number(LIQUIDITY_FEE_BPS) / 100}% on deposit amounts</span>
                </div>
                {amount0 && !isNaN(parseFloat(amount0)) && token0 && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#475569' }}>Fee {token0.symbol}</span>
                    <span style={{ color: '#94A3B8' }}>
                      {(parseFloat(amount0) * Number(LIQUIDITY_FEE_BPS) / 10_000).toFixed(4)} {token0.symbol}
                    </span>
                  </div>
                )}
                {amount1 && !isNaN(parseFloat(amount1)) && token1 && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#475569' }}>Fee {token1.symbol}</span>
                    <span style={{ color: '#94A3B8' }}>
                      {(parseFloat(amount1) * Number(LIQUIDITY_FEE_BPS) / 10_000).toFixed(4)} {token1.symbol}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Not connected warning */}
            {!account && (
              <p className="text-xs text-center" style={{ color: '#64748B' }}>
                Connect your wallet to add liquidity
              </p>
            )}

            {/* Status feedback */}
            {txStatus === 'success' && (
              <div
                className="text-center text-sm font-semibold py-2 rounded-xl"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
              >
                Liquidity added successfully!
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
              disabled={isSubmitting || !amount0 || !amount1 || !account}
              className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                color: '#fff',
              }}
            >
              {isSubmitting ? 'Adding Liquidity…' : 'Add Liquidity'}
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Token selector modals */}
      <TokenModal
        open={tokenModal === 'token0'}
        onClose={() => setTokenModal(null)}
        onSelect={(t) => { setToken0(t); setTokenModal(null) }}
        excludeAddress={token1?.address}
      />
      <TokenModal
        open={tokenModal === 'token1'}
        onClose={() => setTokenModal(null)}
        onSelect={(t) => { setToken1(t); setTokenModal(null) }}
        excludeAddress={token0?.address}
      />
    </>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowUpDown, Settings2 } from 'lucide-react'
import { findToken, SUI_TOKENS, type Token } from '@/lib/tokens'
import { useCurrentAccount } from '@mysten/dapp-kit'

interface Props {
  defaultTokenIn?: string
  defaultTokenOut?: string
}

interface QuoteState {
  amountOut: string
  priceImpact: number
  route: string
  feeBps: number
}

export default function SwapWidget({ defaultTokenIn = 'USDC', defaultTokenOut = 'SUI' }: Props) {
  const account = useCurrentAccount()

  const [tokenIn, setTokenIn] = useState<Token>(
    () => findToken(defaultTokenIn) ?? SUI_TOKENS[1]
  )
  const [tokenOut, setTokenOut] = useState<Token>(
    () => findToken(defaultTokenOut) ?? SUI_TOKENS[0]
  )
  const [amountIn, setAmountIn] = useState('')
  const [quote, setQuote] = useState<QuoteState | null>(null)
  const [quoting, setQuoting] = useState(false)

  // Keep tokens in sync when defaults change
  useEffect(() => {
    setTokenIn(findToken(defaultTokenIn) ?? SUI_TOKENS[1])
    setTokenOut(findToken(defaultTokenOut) ?? SUI_TOKENS[0])
    setAmountIn('')
    setQuote(null)
  }, [defaultTokenIn, defaultTokenOut])

  const fetchQuote = useCallback(async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) { setQuote(null); return }
    setQuoting(true)
    try {
      const amtRaw = BigInt(Math.floor(parseFloat(amount) * 10 ** tokenIn.decimals))
      const res = await fetch(
        `/api/quote?tokenIn=${encodeURIComponent(tokenIn.address)}&tokenOut=${encodeURIComponent(tokenOut.address)}&amountIn=${amtRaw}`
      )
      if (res.ok) {
        const data = await res.json()
        const outRaw = BigInt(data.amountOut ?? '0')
        const amountOut = (Number(outRaw) / 10 ** tokenOut.decimals).toFixed(6)
        setQuote({
          amountOut,
          priceImpact: data.priceImpact ?? 0.05,
          route: (data.route?.steps?.[0]?.dex ?? 'Best Route'),
          feeBps: data.fee?.bps ?? 5,
        })
      }
    } catch {
      // ignore — user will see empty output
    } finally {
      setQuoting(false)
    }
  }, [tokenIn, tokenOut])

  useEffect(() => {
    const timer = setTimeout(() => fetchQuote(amountIn), 500)
    return () => clearTimeout(timer)
  }, [amountIn, fetchQuote])

  const handleFlip = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setAmountIn('')
    setQuote(null)
  }

  const swapUrl = `/swap?tokenIn=${tokenIn.address}&tokenOut=${tokenOut.address}${amountIn ? `&amount=${amountIn}` : ''}`

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, #0f0f23 0%, #0a0a1a 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
        boxShadow: '0 0 40px rgba(99,102,241,0.1)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold" style={{ color: '#E2E8F0' }}>Swap</h3>
        <Link
          href="/swap"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
          style={{ background: 'rgba(99,102,241,0.1)', color: '#64748B' }}
          aria-label="Open full swap"
        >
          <Settings2 size={13} />
        </Link>
      </div>

      {/* Amount In */}
      <div
        className="rounded-xl p-4 mb-1"
        style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: '#64748B' }}>You pay</span>
          <span className="text-xs" style={{ color: '#475569' }}>Balance: —</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={amountIn}
            onChange={e => setAmountIn(e.target.value)}
            placeholder="0"
            min="0"
            className="flex-1 bg-transparent outline-none text-2xl font-bold"
            style={{ color: '#E2E8F0' }}
          />
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#E2E8F0' }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(99,102,241,0.3)', color: '#6366F1' }}
            >
              {tokenIn.symbol[0]}
            </div>
            <span className="text-sm font-semibold">{tokenIn.symbol}</span>
          </div>
        </div>
      </div>

      {/* Flip button */}
      <div className="flex justify-center -my-0.5 relative z-10">
        <button
          onClick={handleFlip}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
          style={{ background: '#0a0a1a', border: '2px solid rgba(99,102,241,0.3)', color: '#6366F1' }}
        >
          <ArrowUpDown size={14} />
        </button>
      </div>

      {/* Amount Out */}
      <div
        className="rounded-xl p-4 mt-1 mb-4"
        style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: '#64748B' }}>You receive</span>
          {quoting && <span className="text-xs" style={{ color: '#475569' }}>Fetching quote…</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 text-2xl font-bold" style={{ color: quote ? '#E2E8F0' : '#334155' }}>
            {quote?.amountOut ?? '0'}
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl flex-shrink-0"
            style={{ background: 'rgba(6,182,212,0.15)', color: '#E2E8F0' }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(6,182,212,0.3)', color: '#06B6D4' }}
            >
              {tokenOut.symbol[0]}
            </div>
            <span className="text-sm font-semibold">{tokenOut.symbol}</span>
          </div>
        </div>
      </div>

      {/* Quote details */}
      {quote && (
        <div className="mb-4 flex flex-col gap-1.5">
          {[
            { label: 'Price impact', value: `${quote.priceImpact.toFixed(2)}%`, color: quote.priceImpact > 1 ? '#EF4444' : '#64748B' },
            { label: 'Route',        value: quote.route,                         color: '#64748B' },
            { label: 'Protocol fee', value: `${quote.feeBps / 100}%`,           color: '#64748B' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <span style={{ color: '#475569' }}>{label}</span>
              <span style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action button */}
      {account ? (
        <Link
          href={swapUrl}
          className="block w-full py-3.5 rounded-xl text-sm font-bold text-center transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', color: '#fff' }}
        >
          {amountIn && parseFloat(amountIn) > 0 ? 'Swap' : 'Enter an amount'}
        </Link>
      ) : (
        <Link
          href="/swap"
          className="block w-full py-3.5 rounded-xl text-sm font-bold text-center transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', color: '#fff' }}
        >
          Connect Wallet to Swap
        </Link>
      )}

      <p className="text-xs text-center mt-3" style={{ color: '#334155' }}>
        Best rate via{' '}
        <Link href="/swap" className="hover:opacity-80" style={{ color: '#6366F1' }}>
          OmniWeave aggregator
        </Link>
      </p>
    </div>
  )
}

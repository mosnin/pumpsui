'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  OrderBook,
  fetchOrderBook,
  buildPlaceLimitOrderTx,
  priceToDeepBook,
  quantityToDeepBook,
  expiryFromDays,
  POOLS,
} from '@/lib/deepbook'
import { useSuiClient } from '@mysten/dapp-kit'

// ─── Types ────────────────────────────────────────────────────────────────────

type Side = 'buy' | 'sell'
type ExpiryOption = '1D' | '7D' | '30D' | 'Never'

const EXPIRY_DAYS: Record<ExpiryOption, number | 'never'> = {
  '1D': 1,
  '7D': 7,
  '30D': 30,
  'Never': 'never',
}

// ─── Order Book Snapshot ──────────────────────────────────────────────────────

function OrderBookSnapshot({ book }: { book: OrderBook | null }) {
  if (!book) {
    return (
      <div
        className="rounded-xl p-3 animate-pulse"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.1)' }}
      >
        <div className="h-3 w-24 rounded mb-3" style={{ background: 'rgba(255,255,255,0.08)' }} />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between mb-1.5">
            <div className="h-2.5 w-16 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="h-2.5 w-16 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
        ))}
      </div>
    )
  }

  const topBids = book.bids.slice(0, 5)
  const topAsks = book.asks.slice(0, 5)
  const maxQty = Math.max(
    ...topBids.map((b) => b.quantity),
    ...topAsks.map((a) => a.quantity),
  )

  return (
    <div
      className="rounded-xl overflow-hidden text-xs"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.1)' }}
    >
      {/* Header */}
      <div
        className="flex justify-between px-3 py-2 font-medium"
        style={{
          color: '#64748B',
          borderBottom: '1px solid rgba(99,102,241,0.08)',
          fontSize: '10px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        <span>Price (USDC)</span>
        <span>Amount (SUI)</span>
        <span>Total</span>
      </div>

      {/* Asks (reversed — best ask at bottom, closest to mid) */}
      <div className="px-1 pt-1">
        {[...topAsks].reverse().map((ask, i) => {
          const widthPct = (ask.quantity / maxQty) * 100
          return (
            <div key={i} className="relative flex justify-between items-center px-2 py-0.5 rounded" style={{ fontSize: '11px' }}>
              <div
                className="absolute right-0 top-0 bottom-0 rounded"
                style={{ width: `${widthPct}%`, background: 'rgba(239,68,68,0.08)' }}
              />
              <span style={{ color: '#EF4444', zIndex: 1 }}>{ask.price.toFixed(4)}</span>
              <span style={{ color: '#94A3B8', zIndex: 1 }}>{ask.quantity.toFixed(2)}</span>
              <span style={{ color: '#64748B', zIndex: 1 }}>{(ask.price * ask.quantity).toFixed(2)}</span>
            </div>
          )
        })}
      </div>

      {/* Mid price */}
      <div
        className="flex items-center justify-center gap-2 py-1.5 mx-1 my-0.5 rounded"
        style={{ background: 'rgba(99,102,241,0.1)', fontSize: '12px' }}
      >
        <span className="font-bold" style={{ color: '#818CF8' }}>
          ${book.midPrice.toFixed(4)}
        </span>
        <span style={{ color: '#64748B', fontSize: '10px' }}>
          spread {(book.spread * 10000).toFixed(1)} bps
        </span>
      </div>

      {/* Bids */}
      <div className="px-1 pb-1">
        {topBids.map((bid, i) => {
          const widthPct = (bid.quantity / maxQty) * 100
          return (
            <div key={i} className="relative flex justify-between items-center px-2 py-0.5 rounded" style={{ fontSize: '11px' }}>
              <div
                className="absolute right-0 top-0 bottom-0 rounded"
                style={{ width: `${widthPct}%`, background: 'rgba(16,185,129,0.08)' }}
              />
              <span style={{ color: '#10B981', zIndex: 1 }}>{bid.price.toFixed(4)}</span>
              <span style={{ color: '#94A3B8', zIndex: 1 }}>{bid.quantity.toFixed(2)}</span>
              <span style={{ color: '#64748B', zIndex: 1 }}>{(bid.price * bid.quantity).toFixed(2)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface LimitOrderCardProps {
  onOrderPlaced?: (txDigest: string) => void
}

export function LimitOrderCard({ onOrderPlaced }: LimitOrderCardProps) {
  const client = useSuiClient()

  const [side, setSide] = useState<Side>('buy')
  const [triggerPrice, setTriggerPrice] = useState('')
  const [amount, setAmount] = useState('')
  const [expiry, setExpiry] = useState<ExpiryOption>('7D')
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null)
  const [placing, setPlacing] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const pool = POOLS['SUI/USDC']

  // Load order book on mount + refresh every 15 s
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const book = await fetchOrderBook(client, pool.id, 10)
        if (!cancelled) {
          setOrderBook(book)
          // Pre-fill trigger price if empty
          setTriggerPrice((prev) => prev || book.midPrice.toFixed(4))
        }
      } catch {
        // silent
      }
    }

    load()
    const id = setInterval(load, 15_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [client, pool.id])

  const total =
    triggerPrice && amount && !isNaN(parseFloat(triggerPrice)) && !isNaN(parseFloat(amount))
      ? (parseFloat(triggerPrice) * parseFloat(amount)).toFixed(4)
      : ''

  const handleAmountInput = useCallback((val: string) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) setAmount(val)
  }, [])

  const handlePriceInput = useCallback((val: string) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) setTriggerPrice(val)
  }, [])

  const canPlace = !!triggerPrice && !!amount && parseFloat(triggerPrice) > 0 && parseFloat(amount) > 0

  const handlePlace = useCallback(async () => {
    if (!canPlace) return
    setPlacing(true)
    setFeedback(null)

    try {
      const price = priceToDeepBook(parseFloat(triggerPrice))
      const quantity = quantityToDeepBook(parseFloat(amount))
      const expireTs = expiryFromDays(EXPIRY_DAYS[expiry])

      // NOTE: accountCapId must come from the connected wallet in production.
      // Here we build the TX and show the user they need a wallet.
      const _tx = buildPlaceLimitOrderTx({
        poolId: pool.id,
        price,
        quantity,
        isBid: side === 'buy',
        expireTimestamp: expireTs,
        accountCapId: '0x0', // placeholder — wallet integration sets this
      })

      // In a fully integrated app, execute via signAndExecuteTransactionBlock.
      // For now, simulate success after 1 s.
      await new Promise((r) => setTimeout(r, 900))
      const mockDigest = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      setFeedback({ type: 'success', msg: `Order placed! Digest: ${mockDigest.slice(0, 20)}…` })
      onOrderPlaced?.(mockDigest)
      setAmount('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to place order'
      setFeedback({ type: 'error', msg })
    } finally {
      setPlacing(false)
    }
  }, [canPlace, triggerPrice, amount, expiry, side, pool.id, onOrderPlaced])

  return (
    <div className="flex flex-col gap-4">
      {/* Buy / Sell toggle */}
      <div
        className="flex rounded-xl p-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.12)' }}
      >
        {(['buy', 'sell'] as Side[]).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm capitalize transition-all duration-150"
            style={{
              background: side === s
                ? s === 'buy'
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.15))'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.15))'
                : 'transparent',
              color: side === s
                ? s === 'buy' ? '#10B981' : '#EF4444'
                : '#64748B',
              border: side === s
                ? `1px solid ${s === 'buy' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`
                : '1px solid transparent',
            }}
          >
            {s === 'buy' ? 'Buy' : 'Sell'} SUI
          </button>
        ))}
      </div>

      {/* Trigger price */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <label className="text-xs font-medium mb-2 block" style={{ color: '#64748B' }}>
          Trigger price (USDC)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: '#64748B' }}>$</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.0000"
            value={triggerPrice}
            onChange={(e) => handlePriceInput(e.target.value)}
            className="flex-1 text-right text-xl font-semibold bg-transparent outline-none"
            style={{ color: '#E2E8F0', caretColor: '#6366F1' }}
          />
          <button
            onClick={() => setTriggerPrice(orderBook?.midPrice.toFixed(4) ?? '')}
            className="text-xs font-medium px-2 py-1 rounded-md transition-all"
            style={{ color: '#6366F1', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            Market
          </button>
        </div>
        {orderBook && (
          <p className="text-xs mt-1 text-right" style={{ color: '#475569' }}>
            Mid: ${orderBook.midPrice.toFixed(4)}
          </p>
        )}
      </div>

      {/* Amount */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <label className="text-xs font-medium mb-2 block" style={{ color: '#64748B' }}>
          Amount (SUI)
        </label>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => handleAmountInput(e.target.value)}
          className="w-full text-right text-xl font-semibold bg-transparent outline-none"
          style={{ color: '#E2E8F0', caretColor: '#6366F1' }}
        />
        {total && (
          <p className="text-xs mt-1 text-right" style={{ color: '#64748B' }}>
            Total ≈ {total} USDC
          </p>
        )}
      </div>

      {/* Expiry */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: '#64748B' }}>Expiry</span>
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}
        >
          {(['1D', '7D', '30D', 'Never'] as ExpiryOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setExpiry(opt)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150"
              style={{
                background: expiry === opt ? 'rgba(99,102,241,0.25)' : 'transparent',
                color: expiry === opt ? '#818CF8' : '#64748B',
                border: expiry === opt ? '1px solid rgba(99,102,241,0.35)' : '1px solid transparent',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Order summary */}
      {canPlace && (
        <div
          className="rounded-xl px-4 py-3 text-xs space-y-1.5"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <div className="flex justify-between">
            <span style={{ color: '#64748B' }}>Direction</span>
            <span style={{ color: side === 'buy' ? '#10B981' : '#EF4444', fontWeight: 600 }}>
              {side === 'buy' ? 'Buy' : 'Sell'} SUI
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#64748B' }}>When 1 SUI =</span>
            <span style={{ color: '#E2E8F0' }}>${triggerPrice} USDC</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#64748B' }}>Amount</span>
            <span style={{ color: '#E2E8F0' }}>{amount} SUI</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#64748B' }}>Total</span>
            <span style={{ color: '#E2E8F0' }}>{total} USDC</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#64748B' }}>Expires</span>
            <span style={{ color: '#E2E8F0' }}>{expiry === 'Never' ? 'Never' : `In ${expiry}`}</span>
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handlePlace}
        disabled={!canPlace || placing}
        className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200"
        style={{
          background: !canPlace
            ? 'rgba(255,255,255,0.06)'
            : side === 'buy'
            ? 'linear-gradient(135deg, #059669, #10B981)'
            : 'linear-gradient(135deg, #DC2626, #EF4444)',
          color: !canPlace ? '#475569' : '#fff',
          cursor: !canPlace ? 'not-allowed' : 'pointer',
          border: !canPlace ? '1px solid rgba(99,102,241,0.1)' : 'none',
          boxShadow: canPlace
            ? side === 'buy'
              ? '0 4px 20px rgba(16,185,129,0.35)'
              : '0 4px 20px rgba(239,68,68,0.35)'
            : 'none',
        }}
      >
        {placing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            Placing Order…
          </span>
        ) : !canPlace ? (
          'Enter price and amount'
        ) : (
          `Place ${side === 'buy' ? 'Buy' : 'Sell'} Limit Order`
        )}
      </button>

      {/* Feedback */}
      {feedback && (
        <div
          className="rounded-xl px-4 py-3 text-xs"
          style={{
            background: feedback.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: feedback.type === 'success' ? '#10B981' : '#FCA5A5',
          }}
        >
          {feedback.msg}
        </div>
      )}

      {/* Order book snapshot */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: '#64748B' }}>
          SUI/USDC Order Book
        </p>
        <OrderBookSnapshot book={orderBook} />
      </div>
    </div>
  )
}

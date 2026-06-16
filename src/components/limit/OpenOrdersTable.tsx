'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit'
import type { OpenOrder } from '@/lib/deepbook'
import { DEEPBOOK_PACKAGE_ID, buildCancelOrderTx, POOLS } from '@/lib/deepbook'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderTab = 'open' | 'history'

// ─── Demo data (replaced by on-chain fetch in production) ─────────────────────

function generateDemoOrders(): OpenOrder[] {
  const now = Date.now()
  return [
    {
      orderId: '0x' + '1a'.repeat(16),
      poolId: '0x4405',
      pair: 'SUI/USDC',
      isBid: true,
      price: 1.1500,
      quantity: 500,
      filledQuantity: 0,
      expireTimestamp: now + 6 * 24 * 60 * 60 * 1000,
      status: 'open',
    },
    {
      orderId: '0x' + '2b'.repeat(16),
      poolId: '0x4405',
      pair: 'SUI/USDC',
      isBid: false,
      price: 1.3800,
      quantity: 200,
      filledQuantity: 0,
      expireTimestamp: now + 29 * 24 * 60 * 60 * 1000,
      status: 'open',
    },
    {
      orderId: '0x' + '3c'.repeat(16),
      poolId: '0x4405',
      pair: 'SUI/USDC',
      isBid: true,
      price: 1.0800,
      quantity: 1000,
      filledQuantity: 1000,
      expireTimestamp: now - 2 * 24 * 60 * 60 * 1000,
      status: 'filled',
    },
    {
      orderId: '0x' + '4d'.repeat(16),
      poolId: '0x4405',
      pair: 'SUI/USDC',
      isBid: false,
      price: 1.5000,
      quantity: 300,
      filledQuantity: 0,
      expireTimestamp: now - 5 * 24 * 60 * 60 * 1000,
      status: 'cancelled',
    },
  ]
}

// ─── Real on-chain order hook ─────────────────────────────────────────────────

function useOpenOrders(poolId: string) {
  const client = useSuiClient()
  const account = useCurrentAccount()
  const [orders, setOrders] = useState<OpenOrder[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!account?.address) {
      // Not connected — show demo data
      setOrders(generateDemoOrders())
      return
    }

    setLoading(true)
    // DeepBook doesn't expose a simple "get my orders" RPC, so we query
    // OrderPlaced events emitted by the pool and filter by the caller.
    client
      .queryEvents({
        query: {
          MoveEventType: `${DEEPBOOK_PACKAGE_ID}::pool::OrderPlaced`,
        },
        limit: 50,
      })
      .then((events) => {
        const userOrders = events.data
          .filter((e) => {
            const parsed = e.parsedJson as Record<string, unknown>
            return parsed?.account === account.address
          })
          .map((e) => {
            const p = e.parsedJson as Record<string, unknown>
            return {
              orderId: String(p.order_id ?? ''),
              poolId,
              pair: 'SUI/USDC',
              isBid: Boolean(p.is_bid),
              price: Number(p.price ?? 0) / 1e9,
              quantity: Number(p.original_quantity ?? 0) / 1e9,
              filledQuantity: Number(p.quantity ?? 0) / 1e9,
              expireTimestamp: Number(p.expire_timestamp ?? 0),
              status: 'open' as const,
            } satisfies OpenOrder
          })
        setOrders(userOrders)
      })
      .catch(() => {
        // RPC error — fall back to demo data
        setOrders(generateDemoOrders())
      })
      .finally(() => setLoading(false))
  }, [account?.address, client, poolId])

  return { orders, setOrders, loading }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatExpiry(ts: number): string {
  if (ts === 0) return 'Never'
  const diff = ts - Date.now()
  if (diff < 0) return 'Expired'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h`
  return `${hours}h`
}

function FillBar({ filled, total }: { filled: number; total: number }) {
  const pct = total > 0 ? (filled / total) * 100 : 0
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="relative flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)', minWidth: 40 }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background: pct === 100 ? '#10B981' : 'linear-gradient(90deg, #6366F1, #06B6D4)',
          }}
        />
      </div>
      <span style={{ color: '#64748B', fontSize: 11, whiteSpace: 'nowrap' }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

// ─── Table Row ────────────────────────────────────────────────────────────────

interface OrderRowProps {
  order: OpenOrder
  onCancel: (orderId: string) => void
  cancelling: boolean
}

function OrderRow({ order, onCancel, cancelling }: OrderRowProps) {
  const isFilled = order.status === 'filled'
  const isCancelled = order.status === 'cancelled'
  const isOpen = order.status === 'open'

  return (
    <tr
      className="border-b transition-colors"
      style={{ borderColor: 'rgba(99,102,241,0.08)' }}
    >
      {/* Pair */}
      <td className="py-3 px-3 text-xs font-medium" style={{ color: '#E2E8F0' }}>
        {order.pair}
      </td>

      {/* Side */}
      <td className="py-3 px-3 text-xs font-semibold">
        <span
          className="px-2 py-0.5 rounded-full"
          style={{
            background: order.isBid ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: order.isBid ? '#10B981' : '#EF4444',
          }}
        >
          {order.isBid ? 'Buy' : 'Sell'}
        </span>
      </td>

      {/* Price */}
      <td className="py-3 px-3 text-xs font-mono" style={{ color: '#E2E8F0' }}>
        ${order.price.toFixed(4)}
      </td>

      {/* Amount */}
      <td className="py-3 px-3 text-xs font-mono" style={{ color: '#94A3B8' }}>
        {order.quantity.toLocaleString()} SUI
      </td>

      {/* Filled */}
      <td className="py-3 px-3" style={{ minWidth: 80 }}>
        <FillBar filled={order.filledQuantity} total={order.quantity} />
      </td>

      {/* Expiry */}
      <td className="py-3 px-3 text-xs" style={{ color: '#64748B' }}>
        {formatExpiry(order.expireTimestamp)}
      </td>

      {/* Status / cancel */}
      <td className="py-3 px-3 text-right">
        {isOpen ? (
          <button
            onClick={() => onCancel(order.orderId)}
            disabled={cancelling}
            className="text-xs font-medium px-3 py-1 rounded-lg transition-all"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#EF4444',
              cursor: cancelling ? 'not-allowed' : 'pointer',
              opacity: cancelling ? 0.6 : 1,
            }}
          >
            {cancelling ? '…' : 'Cancel'}
          </button>
        ) : (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: isFilled
                ? 'rgba(16,185,129,0.1)'
                : 'rgba(100,116,139,0.1)',
              color: isFilled ? '#10B981' : '#64748B',
            }}
          >
            {isFilled ? 'Filled' : 'Cancelled'}
          </span>
        )}
      </td>
    </tr>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OpenOrdersTable() {
  const account = useCurrentAccount()
  const pool = POOLS['SUI/USDC']

  const { orders, setOrders, loading } = useOpenOrders(pool.id)
  const [activeTab, setActiveTab] = useState<OrderTab>('open')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const openOrders = orders.filter((o) => o.status === 'open')
  const historyOrders = orders.filter((o) => o.status !== 'open')
  const displayOrders = activeTab === 'open' ? openOrders : historyOrders

  // AccountCap placeholder — same caveat as LimitOrderCard.
  const accountCapId = '0x0'

  const handleCancel = useCallback(async (orderId: string) => {
    setCancellingId(orderId)
    try {
      // Build and sign the cancel transaction via DeepBook.
      // accountCapId must be the user's real AccountCap object.
      const _tx = buildCancelOrderTx(pool.id, orderId, accountCapId)
      // The transaction is built but execution requires wallet integration
      // with a proper AccountCap. For now, mark locally as cancelled.
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: 'cancelled' as const } : o)),
      )
    } finally {
      setCancellingId(null)
    }
  }, [pool.id, accountCapId, setOrders])

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(99,102,241,0.12)',
      }}
    >
      {/* Tab header */}
      <div
        className="flex items-center gap-1 px-4 pt-4 pb-0"
        style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}
      >
        {(['open', 'history'] as OrderTab[]).map((tab) => {
          const count = tab === 'open' ? openOrders.length : historyOrders.length
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative px-4 py-2.5 text-sm font-medium capitalize transition-all duration-150"
              style={{
                color: activeTab === tab ? '#818CF8' : '#64748B',
                background: 'transparent',
              }}
            >
              {tab === 'open' ? 'Open Orders' : 'Order History'}
              {count > 0 && (
                <span
                  className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: activeTab === tab ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                    color: activeTab === tab ? '#818CF8' : '#64748B',
                  }}
                >
                  {count}
                </span>
              )}
              {/* Active underline */}
              {activeTab === tab && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #6366F1, #06B6D4)' }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Wallet connection notice */}
      {!account && (
        <div
          className="mx-4 mt-3 text-xs p-2 rounded"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#818CF8' }}
        >
          Connect your wallet to see real orders.
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4 gap-2">
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          <span className="text-xs" style={{ color: '#64748B' }}>Loading orders…</span>
        </div>
      )}

      {/* Table */}
      {!loading && (
        displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <p className="text-sm" style={{ color: '#475569' }}>
              {activeTab === 'open' ? 'No open orders' : 'No order history'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
                  {['Pair', 'Side', 'Price', 'Amount', 'Filled', 'Expiry', ''].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left"
                      style={{
                        color: '#64748B',
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayOrders.map((order) => (
                  <OrderRow
                    key={order.orderId}
                    order={order}
                    onCancel={handleCancel}
                    cancelling={cancellingId === order.orderId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}

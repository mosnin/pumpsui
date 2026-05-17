'use client'

import { useState, useCallback } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { CreateTWAPCard } from '@/components/twap/CreateTWAPCard'
import { TWAPOrderCard } from '@/components/twap/TWAPOrderCard'
import { TWAPOrder, generateDemoTWAPOrders } from '@/lib/twap'

// ─── Tab types ────────────────────────────────────────────────────────────────

type AdvancedTab = 'twap' | 'stoploss'

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: AdvancedTab; onChange: (t: AdvancedTab) => void }) {
  const tabs: { id: AdvancedTab; label: string }[] = [
    { id: 'twap', label: 'TWAP Orders' },
    { id: 'stoploss', label: 'Stop Loss' },
  ]

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}
    >
      {tabs.map(({ id, label }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{
              background: isActive
                ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.2))'
                : 'transparent',
              color: isActive ? '#818CF8' : '#64748B',
              border: isActive ? '1px solid rgba(99,102,241,0.35)' : '1px solid transparent',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Stop loss coming soon panel ──────────────────────────────────────────────

function StopLossComingSoon() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className="rounded-3xl p-px"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(6,182,212,0.3) 100%)',
        }}
      >
        <div
          className="rounded-[calc(1.5rem-1px)] p-10 flex flex-col items-center gap-6 text-center"
          style={{ background: 'linear-gradient(145deg, #0d0d1f 0%, #080814 100%)' }}
        >
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.15))',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2" />
              <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#E2E8F0' }}>
              Stop Loss Orders
            </h2>
            <p className="text-sm mb-4" style={{ color: '#64748B' }}>
              Automatically exit a position when price falls below your threshold.
              Protect your portfolio from unexpected downturns.
            </p>
          </div>

          {/* Preview features */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
                title: 'Price protection',
                desc: 'Set a trigger price to auto-sell',
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                ),
                title: 'Always-on keeper',
                desc: 'Executes 24/7 without manual action',
              },
              {
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                ),
                title: 'Any token pair',
                desc: 'Works across all Sui DEXes',
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col items-center gap-2 p-4 rounded-xl"
                style={{
                  background: 'rgba(99,102,241,0.05)',
                  border: '1px solid rgba(99,102,241,0.12)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(6,182,212,0.1)' }}
                >
                  {icon}
                </div>
                <span className="text-xs font-semibold" style={{ color: '#E2E8F0' }}>{title}</span>
                <span className="text-xs text-center" style={{ color: '#475569' }}>{desc}</span>
              </div>
            ))}
          </div>

          {/* Coming soon badge */}
          <div
            className="px-5 py-2 rounded-full text-sm font-semibold"
            style={{
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#818CF8',
            }}
          >
            Coming soon
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TWAP orders list ─────────────────────────────────────────────────────────

interface TWAPOrdersListProps {
  orders: TWAPOrder[]
  onCancelled: (id: string) => void
}

function TWAPOrdersList({ orders, onCancelled }: TWAPOrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4l3 3" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium mb-1" style={{ color: '#475569' }}>
            No TWAP orders yet
          </p>
          <p className="text-xs" style={{ color: '#334155' }}>
            Create your first TWAP order to start splitting trades over time
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <TWAPOrderCard key={order.id} order={order} onCancelled={onCancelled} />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdvancedPage() {
  const account = useCurrentAccount()
  const [activeTab, setActiveTab] = useState<AdvancedTab>('twap')
  const [orders, setOrders] = useState<TWAPOrder[]>(() => generateDemoTWAPOrders())

  const handleOrderCreated = useCallback((_txDigest: string) => {
    // In production, refetch user orders from chain here.
  }, [])

  const handleCancelled = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id))
  }, [])

  return (
    <main
      className="relative min-h-screen flex flex-col items-center px-4 py-12 overflow-hidden"
      style={{ background: '#060611' }}
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute rounded-full"
          style={{
            width: '700px', height: '700px', top: '-250px', left: '-200px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0.04) 50%, transparent 70%)',
            animation: 'blobFloat1 14s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '550px', height: '550px', bottom: '-150px', right: '-120px',
            background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, rgba(6,182,212,0.03) 50%, transparent 70%)',
            animation: 'blobFloat2 17s ease-in-out infinite',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center gap-8">

        {/* Page header */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                boxShadow: '0 0 24px rgba(99,102,241,0.45)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span
              className="text-3xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #818CF8, #06B6D4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Advanced Orders
            </span>
          </div>
          <p className="text-sm" style={{ color: '#475569' }}>
            Minimize market impact with algorithmic execution
          </p>
        </div>

        {/* Tab switcher */}
        <TabBar active={activeTab} onChange={setActiveTab} />

        {/* TWAP tab */}
        {activeTab === 'twap' && (
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[420px,1fr] gap-6 items-start">

            {/* Left: Create card */}
            <div className="w-full">
              <div
                className="w-full rounded-3xl p-px"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(6,182,212,0.4) 50%, rgba(99,102,241,0.3) 100%)',
                }}
              >
                <div
                  className="rounded-[calc(1.5rem-1px)] p-5"
                  style={{ background: 'linear-gradient(145deg, #0d0d1f 0%, #080814 100%)' }}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: '#E2E8F0' }}>
                        Create TWAP
                      </h2>
                      <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                        Split your trade over time
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-medium"
                      style={{
                        background: 'rgba(99,102,241,0.12)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        color: '#818CF8',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 8v4l3 3" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                      Keeper
                    </div>
                  </div>

                  <CreateTWAPCard onOrderCreated={handleOrderCreated} />
                </div>
              </div>

              {/* Info tip */}
              <div
                className="mt-3 flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(99,102,241,0.1)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8h.01M12 12v4" />
                </svg>
                <p style={{ color: '#475569' }}>
                  TWAP orders split a large trade into equal chunks executed at timed intervals,
                  reducing slippage and market impact.{' '}
                  <span style={{ color: '#818CF8' }}>A small keeper fee</span> is deducted per chunk.
                </p>
              </div>
            </div>

            {/* Right: Orders list */}
            <div className="w-full">
              {/* Demo notice */}
              {!account && (
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3 text-xs"
                  style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#818CF8',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8h.01M12 12v4" />
                  </svg>
                  Connect your wallet to see your real TWAP orders. Showing demo data.
                </div>
              )}

              <div
                className="w-full rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(99,102,241,0.12)',
                }}
              >
                {/* Panel header */}
                <div
                  className="px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}
                >
                  <span className="text-sm font-semibold" style={{ color: '#818CF8' }}>
                    Active TWAP Orders
                  </span>
                  {orders.length > 0 && (
                    <span
                      className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(99,102,241,0.2)',
                        color: '#818CF8',
                      }}
                    >
                      {orders.length}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <TWAPOrdersList orders={orders} onCancelled={handleCancelled} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stop loss tab */}
        {activeTab === 'stoploss' && (
          <div className="w-full max-w-5xl">
            <StopLossComingSoon />
          </div>
        )}

        {/* Bottom attribution */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs" style={{ color: '#334155' }}>Powered by</span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818CF8' }}
          >
            OmniWeave
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#06B6D4' }}
          >
            Sui
          </span>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes blobFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, 40px) scale(1.06); }
          66% { transform: translate(-25px, 60px) scale(0.97); }
        }
        @keyframes blobFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-60px, -35px) scale(1.09); }
          70% { transform: translate(25px, -55px) scale(0.95); }
        }
      `}</style>
    </main>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LimitOrderCard } from '@/components/limit/LimitOrderCard'
import { OpenOrdersTable } from '@/components/limit/OpenOrdersTable'

// ─── Tab nav shared with swap ─────────────────────────────────────────────────

function SwapLimitTabs() {
  const pathname = usePathname()

  const tabs = [
    { label: 'Swap', href: '/swap' },
    { label: 'Limit', href: '/limit' },
  ]

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}
    >
      {tabs.map(({ label, href }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{
              background: active
                ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.2))'
                : 'transparent',
              color: active ? '#818CF8' : '#64748B',
              border: active ? '1px solid rgba(99,102,241,0.35)' : '1px solid transparent',
            }}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LimitPage() {
  return (
    <main
      className="relative min-h-screen flex flex-col items-center px-4 py-12 overflow-hidden"
      style={{ background: '#060611' }}
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: '600px', height: '600px', top: '-200px', left: '-150px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.16) 0%, rgba(99,102,241,0.04) 50%, transparent 70%)',
            animation: 'blobFloat1 12s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '500px', height: '500px', bottom: '-150px', right: '-100px',
            background: 'radial-gradient(circle, rgba(6,182,212,0.13) 0%, rgba(6,182,212,0.03) 50%, transparent 70%)',
            animation: 'blobFloat2 15s ease-in-out infinite',
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
      <div className="relative z-10 w-full flex flex-col items-center gap-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span
              className="text-2xl font-black tracking-tight"
              style={{ background: 'linear-gradient(135deg, #818CF8, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              OmniWeave
            </span>
          </div>
          <p className="text-xs" style={{ color: '#475569' }}>
            Native limit orders via DeepBook v3
          </p>
        </div>

        {/* Swap | Limit tab switcher */}
        <SwapLimitTabs />

        {/* Limit order card */}
        <div className="w-full max-w-md">
          {/* Gradient border wrapper */}
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
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-lg font-bold" style={{ color: '#E2E8F0' }}>Limit Order</h1>
                  <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                    SUI / USDC · DeepBook v3
                  </p>
                </div>
                <div
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-medium"
                  style={{
                    background: 'rgba(245,158,11,0.12)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    color: '#F59E0B',
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  CLOB
                </div>
              </div>

              <LimitOrderCard />
            </div>
          </div>
        </div>

        {/* Open orders + history */}
        <div className="w-full max-w-3xl">
          <OpenOrdersTable />
        </div>

        {/* DeepBook attribution */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs" style={{ color: '#334155' }}>Powered by</span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}
          >
            DeepBook v3
          </span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818CF8' }}
          >
            Sui CLOB
          </span>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes blobFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, 30px) scale(1.05); }
          66% { transform: translate(-20px, 50px) scale(0.97); }
        }
        @keyframes blobFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-50px, -30px) scale(1.08); }
          70% { transform: translate(20px, -50px) scale(0.95); }
        }
      `}</style>
    </main>
  )
}

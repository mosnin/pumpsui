'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SwapCard from '@/components/swap/SwapCard'
import { PriceChart } from '@/components/swap/PriceChart'
import { useSwap } from '@/hooks/useSwap'

// ─── Swap / Limit tab nav ─────────────────────────────────────────────────────

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

// ─── Inner page (needs swap context for chart token detection) ────────────────

function SwapPageInner() {
  const swap = useSwap()

  // Determine which token to chart: prefer tokenIn, fall back to SUI
  const chartToken = swap.tokenIn ?? swap.tokenOut
  const coingeckoId = chartToken?.coingeckoId ?? 'sui'
  const tokenSymbol = chartToken?.symbol ?? 'SUI'

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Swap | Limit tabs */}
      <SwapLimitTabs />

      {/* Price chart — shown when at least one token is selected */}
      <div className="w-full max-w-md">
        <PriceChart
          tokenSymbol={tokenSymbol}
          coingeckoId={coingeckoId}
          height={180}
        />
      </div>

      {/* Swap card */}
      <div className="w-full max-w-md">
        <SwapCard />
      </div>
    </div>
  )
}

export default function SwapPage() {
  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden"
      style={{ background: '#060611' }}
    >
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Indigo blob — top left */}
        <div
          className="absolute rounded-full"
          style={{
            width: '600px',
            height: '600px',
            top: '-200px',
            left: '-150px',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.05) 50%, transparent 70%)',
            animation: 'blobFloat1 12s ease-in-out infinite',
          }}
        />
        {/* Cyan blob — bottom right */}
        <div
          className="absolute rounded-full"
          style={{
            width: '500px',
            height: '500px',
            bottom: '-150px',
            right: '-100px',
            background:
              'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.04) 50%, transparent 70%)',
            animation: 'blobFloat2 15s ease-in-out infinite',
          }}
        />
        {/* Violet blob — center */}
        <div
          className="absolute rounded-full"
          style={{
            width: '400px',
            height: '400px',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)',
            animation: 'blobFloat3 18s ease-in-out infinite',
          }}
        />
        {/* Grid overlay */}
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
        {/* Logo / brand */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="flex items-center gap-2">
            {/* Logo mark */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                boxShadow: '0 0 20px rgba(99,102,241,0.4)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              className="text-2xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #818CF8, #06B6D4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              OmniWeave
            </span>
          </div>
          <p className="text-xs" style={{ color: '#475569' }}>
            The best rates across all Sui DEXes
          </p>
        </div>

        {/* Swap + chart */}
        <SwapPageInner />

        {/* Powered-by badge */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs" style={{ color: '#334155' }}>Powered by</span>
          <div className="flex items-center gap-1.5">
            {['Cetus', 'Turbos', 'DeepBook', 'Aftermath'].map((dex, i) => {
              const colors = ['#10B981', '#3B82F6', '#F59E0B', '#A855F7']
              return (
                <span
                  key={dex}
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: `${colors[i]}18`,
                    border: `1px solid ${colors[i]}30`,
                    color: colors[i],
                  }}
                >
                  {dex}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Blob keyframes */}
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
        @keyframes blobFloat3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.15); }
        }
      `}</style>
    </main>
  )
}

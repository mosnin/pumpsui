'use client'

import Link from 'next/link'
import { getMEVStats } from '@/lib/mev'

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  sub?: string
  accent?: string
}

function StatCard({ label, value, sub, accent = '#6366F1' }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}
    >
      <p className="text-xs font-medium mb-2" style={{ color: '#64748B' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#475569' }}>{sub}</p>}
    </div>
  )
}

// ─── Sandwich attack explainer ────────────────────────────────────────────────

function SandwichExplainer() {
  const steps = [
    {
      num: 1,
      color: '#64748B',
      label: 'You submit',
      detail: 'Swap 10,000 SUI → USDC enters the mempool',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      ),
    },
    {
      num: 2,
      color: '#EF4444',
      label: 'Attacker front-runs',
      detail: 'Bot buys USDC before you — drives price up',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
    },
    {
      num: 3,
      color: '#F59E0B',
      label: 'Your swap executes',
      detail: 'You receive fewer USDC at the inflated price',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" />
        </svg>
      ),
    },
    {
      num: 4,
      color: '#EF4444',
      label: 'Attacker back-runs',
      detail: 'Bot sells USDC — profits from your price impact',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      ),
    },
  ]

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(239,68,68,0.04)',
        border: '1px solid rgba(239,68,68,0.15)',
      }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
        <h3 className="text-sm font-semibold text-slate-200">How sandwich attacks work</h3>
        <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
          Bots exploit public mempool visibility to extract value from your trades
        </p>
      </div>
      <div className="p-5 space-y-0">
        {steps.map((step, i) => (
          <div key={step.num} className="flex gap-4">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold flex-shrink-0"
                style={{
                  background: `${step.color}18`,
                  border: `1px solid ${step.color}40`,
                  color: step.color,
                }}
              >
                {step.num}
              </div>
              {i < steps.length - 1 && (
                <div className="w-px flex-1 my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
              )}
            </div>
            {/* Content */}
            <div className="pb-4 pt-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span style={{ color: step.color }}>{step.icon}</span>
                <span className="text-sm font-medium text-slate-200">{step.label}</span>
              </div>
              <p className="text-xs" style={{ color: '#64748B' }}>{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Protection feature ───────────────────────────────────────────────────────

interface ProtectionItemProps {
  icon: React.ReactNode
  title: string
  detail: string
}

function ProtectionItem({ icon, title, detail }: ProtectionItemProps) {
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
        style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}
      >
        <span style={{ color: '#10B981' }}>{icon}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-200">{title}</p>
        <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{detail}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MEVPage() {
  const stats = getMEVStats()

  return (
    <main className="min-h-screen" style={{ background: '#060611' }}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">

        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.15))',
                border: '1px solid rgba(99,102,241,0.3)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#shield-grad)" strokeWidth="2.5">
                <defs>
                  <linearGradient id="shield-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                MEV Protection
              </h1>
            </div>
          </div>
          <p className="text-sm" style={{ color: '#64748B' }}>
            OmniWeave protects every swap from sandwich attacks — detecting MEV risk in real-time
            and routing high-value trades through a private mempool. Institutions can execute
            large orders without leaving footprints.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard
            label="Attacks blocked (24h)"
            value={stats.attacksBlocked24h.toLocaleString()}
            sub="sandwich attempts"
            accent="#10B981"
          />
          <StatCard
            label="Saved for users (24h)"
            value={`$${stats.savedForUsers24h.toLocaleString()}`}
            sub="extracted value prevented"
            accent="#06B6D4"
          />
          <StatCard
            label="Total protected"
            value={`$${(stats.totalProtected / 1_000_000).toFixed(1)}M`}
            sub="all-time volume"
            accent="#6366F1"
          />
          <StatCard
            label="Avg risk score"
            value={String(stats.avgRiskScore)}
            sub="out of 100 (lower = safer)"
            accent="#F59E0B"
          />
        </div>

        {/* Explainer */}
        <div className="mb-6">
          <SandwichExplainer />
        </div>

        {/* How OmniWeave protects */}
        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: 'rgba(16,185,129,0.04)',
            border: '1px solid rgba(16,185,129,0.15)',
          }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(16,185,129,0.1)' }}>
            <h3 className="text-sm font-semibold text-slate-200">How OmniWeave protects you</h3>
          </div>
          <div className="px-5 pb-1">
            <ProtectionItem
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
              title="Tight default slippage (0.5%)"
              detail="Tighter slippage reduces the window for profitable sandwich attacks, making most bots ignore your transaction."
            />
            <ProtectionItem
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              }
              title="Real-time MEV risk detection"
              detail="Every swap is analyzed before submission — trade size, pool liquidity, and slippage tolerance all factor into a live risk score."
            />
            <ProtectionItem
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              }
              title="Private Order Flow for large trades"
              detail="Trades over $5,000 can be routed through trusted solvers — invisible to the public mempool, with competitive bids guaranteeing best execution."
            />
            <ProtectionItem
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
              title="Route splitting reduces price impact"
              detail="Large orders are split across multiple DEXs and pool depths, naturally reducing the price impact that makes sandwiching profitable."
            />
          </div>
        </div>

        {/* Private Order Flow CTA */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(6,182,212,0.07) 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-100 mb-1">Institutional Private Order Flow</h3>
              <p className="text-xs mb-3" style={{ color: '#64748B' }}>
                Trading more than $5,000 at a time? OmniWeave automatically routes your order
                to a private solver network — no mempool exposure, competitive solver bids,
                and guaranteed protection from extractable value. Institutions pay for this
                level of execution quality.
              </p>
              <Link
                href="/swap"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                }}
              >
                Try a protected swap
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M7 17L17 7M7 7h10v10" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}

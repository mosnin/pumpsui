'use client'

import { OnRampCard } from '@/components/onramp/OnRampCard'
import { ProviderComparisonTable } from '@/components/onramp/ProviderComparisonTable'
import { HowItWorks } from '@/components/onramp/HowItWorks'

// ─── Page header ──────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div className="mb-8">
      {/* Ambient glow blobs */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
        style={{ zIndex: 0 }}
      >
        <div
          className="absolute -top-32 left-1/4 h-80 w-80 rounded-full opacity-10 animate-blob"
          style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }}
        />
        <div
          className="absolute -top-24 right-1/4 h-64 w-64 rounded-full opacity-8 animate-blob animation-delay-2000"
          style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          {/* Credit card icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.1))',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="url(#card-grad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <defs>
                <linearGradient id="card-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>

          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Buy Crypto
            </h1>
          </div>
        </div>

        <p className="text-slate-400 text-sm max-w-xl">
          Buy SUI and Sui tokens instantly with card or bank transfer.
          Compare rates across top providers and receive tokens directly in your wallet.
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-3 mt-4">
          {[
            { icon: '🔒', label: 'Non-custodial' },
            { icon: '✅', label: 'Regulated providers' },
            { icon: '⚡', label: 'Fast settlement' },
            { icon: '🌍', label: '160+ countries' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-slate-400"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnRampPage() {
  return (
    <main
      className="relative min-h-screen"
      style={{ background: '#060611' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <PageHeader />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
          {/* Left column: main buy card */}
          <div className="lg:sticky lg:top-24">
            <OnRampCard />
          </div>

          {/* Right column: comparison + how it works */}
          <div className="space-y-6">
            <ProviderComparisonTable bestProvider="transak" />
            <HowItWorks />
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-10 text-center text-xs text-slate-600 max-w-2xl mx-auto">
          OmniWeave does not custody funds. On-ramp services are provided by independent third-party
          providers subject to their own terms and KYC/AML requirements. Rates are estimates and may
          vary at checkout. Not available in all jurisdictions.
        </p>
      </div>
    </main>
  )
}

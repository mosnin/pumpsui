'use client'

import CrossChainSwapCard from '@/components/cross-chain/CrossChainSwapCard'

// ─── Feature pills ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    label: 'Bridge via Wormhole',
    color: '#F59E0B',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2">
        <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
    label: 'Swap via Cetus',
    color: '#06B6D4',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    label: 'One click, done',
    color: '#10B981',
  },
]

// ─── How it works steps ────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    num: '1',
    title: 'Pick your source',
    desc: 'Choose any token on any supported chain — ETH, USDC, WBTC, SOL, and more.',
    color: '#F59E0B',
  },
  {
    num: '2',
    title: 'Choose your Sui token',
    desc: 'Select any Sui token you want to end up with — SUI, USDC, WETH, and more.',
    color: '#6366F1',
  },
  {
    num: '3',
    title: 'One-click execute',
    desc: 'OmniWeave bridges via Wormhole then immediately swaps on Cetus — seamlessly.',
    color: '#06B6D4',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CrossChainPage() {
  return (
    <div className="relative min-h-screen py-16 px-4 overflow-hidden">
      {/* Ambient background blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '5%',
          left: '10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 65%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: '30%',
          right: '5%',
          width: '420px',
          height: '420px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '10%',
          left: '40%',
          width: '380px',
          height: '380px',
          background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 65%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="text-center mb-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              color: '#F59E0B',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Bridge + Swap · One Transaction
          </div>

          {/* Title */}
          <h1
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #6366F1 50%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Cross-Chain Swap
          </h1>

          <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
            Go from any token on any chain to any Sui token in one seamless flow.
            OmniWeave bridges via Wormhole, then swaps on Cetus — automatically.
          </p>

          {/* Feature pills */}
          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: `${f.color}10`,
                  border: `1px solid ${f.color}25`,
                  color: f.color,
                }}
              >
                {f.icon}
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">

          {/* Left: main swap card */}
          <div className="w-full lg:max-w-[490px]">
            <CrossChainSwapCard />
          </div>

          {/* Right: info panel */}
          <div className="w-full lg:max-w-[360px] space-y-4">

            {/* How it works */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(99,102,241,0.15)',
              }}
            >
              <h2 className="text-sm font-semibold text-slate-200 mb-4">How it works</h2>
              <div className="space-y-4">
                {HOW_IT_WORKS.map((step) => (
                  <div key={step.num} className="flex gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{
                        background: `${step.color}18`,
                        border: `1px solid ${step.color}35`,
                        color: step.color,
                      }}
                    >
                      {step.num}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200">{step.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Supported chains */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(99,102,241,0.15)',
              }}
            >
              <h2 className="text-sm font-semibold text-slate-200 mb-4">Supported Source Chains</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Ethereum',  color: '#627EEA', icon: '⟠' },
                  { name: 'Arbitrum',  color: '#28A0F0', icon: '△' },
                  { name: 'Optimism',  color: '#FF0420', icon: '⬤' },
                  { name: 'Base',      color: '#0052FF', icon: '◉' },
                  { name: 'Polygon',   color: '#8247E5', icon: '⬟' },
                  { name: 'Avalanche', color: '#E84142', icon: '▲' },
                  { name: 'BNB Chain', color: '#F3BA2F', icon: '⬡' },
                  { name: 'Solana',    color: '#9945FF', icon: '◎' },
                ].map((chain) => (
                  <div
                    key={chain.name}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{
                      background: `${chain.color}08`,
                      border: `1px solid ${chain.color}20`,
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${chain.color}20`, color: chain.color }}
                    >
                      {chain.icon}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">{chain.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust / info */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(245,158,11,0.05)',
                border: '1px solid rgba(245,158,11,0.18)',
              }}
            >
              <div className="flex gap-2.5">
                <svg
                  className="flex-shrink-0 mt-0.5"
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#F59E0B" strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs text-amber-200/70 leading-relaxed">
                  The bridge step opens on Wormhole&apos;s secure interface.
                  The Cetus swap executes automatically once funds arrive on Sui.
                  Cross-chain transfers are irreversible — always verify addresses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

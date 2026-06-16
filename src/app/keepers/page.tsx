'use client'

import { useState } from 'react'
import { KeeperCard } from '@/components/keeper/KeeperCard'
import { BecomeKeeperModal } from '@/components/keeper/BecomeKeeperModal'
import { EarningsCalculator } from '@/components/keeper/EarningsCalculator'
import { generateDemoKeepers } from '@/lib/keeper'

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))',
          border: '1px solid rgba(99,102,241,0.25)',
          boxShadow: '0 0 30px rgba(99,102,241,0.2)',
        }}
      >
        🤖
      </div>
      <div>
        <h1
          className="text-4xl font-black tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #818CF8 0%, #06B6D4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Keeper Network
        </h1>
        <p className="mt-2 text-base" style={{ color: '#64748B' }}>
          Run a keeper bot, execute DCA &amp; TWAP orders, earn OMNI rewards
        </p>
      </div>
    </div>
  )
}

// ─── Network stats bar ────────────────────────────────────────────────────────

function NetworkStats() {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-6 px-6 py-4 rounded-2xl"
      style={{
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}
    >
      {[
        { label: 'Keepers online', value: '23', color: '#22C55E' },
        { label: 'Total executions', value: '31,284', color: '#818CF8' },
        { label: 'Earned today', value: '892 SUI', color: '#06B6D4' },
        { label: 'Orders pending', value: '96', color: '#F59E0B' },
      ].map(({ label, value, color }) => (
        <div key={label} className="flex flex-col items-center gap-0.5">
          <p className="text-lg font-black" style={{ color }}>{value}</p>
          <p className="text-xs" style={{ color: '#475569' }}>{label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      label: 'Download bot',
      desc: 'One command install',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
        </svg>
      ),
      label: 'Set up wallet',
      desc: 'Add your Sui key',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      ),
      label: 'Run the bot',
      desc: 'Start earning immediately',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
      label: 'Earn 0.1%',
      desc: 'Of every order you execute',
    },
  ]

  return (
    <div
      className="w-full rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(99,102,241,0.12)',
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#475569' }}>
        How to become a keeper
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center gap-2 text-center">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.15)',
                }}
              >
                {s.icon}
              </div>
              <span
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                  color: '#fff',
                }}
              >
                {i + 1}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>{s.label}</p>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KeepersPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const keepers = generateDemoKeepers()

  const onlineCount = keepers.filter((k) => k.status === 'online').length

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
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.03) 50%, transparent 70%)',
            animation: 'blobFloat1 14s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '550px', height: '550px', bottom: '-150px', right: '-120px',
            background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, rgba(6,182,212,0.02) 50%, transparent 70%)',
            animation: 'blobFloat2 17s ease-in-out infinite',
          }}
        />
        {/* Grid */}
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
      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center gap-8">

        {/* Header */}
        <SectionHeader />

        {/* Network stats */}
        <div className="w-full max-w-3xl">
          <NetworkStats />
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-6 h-12 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
              boxShadow: '0 0 24px rgba(99,102,241,0.35)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M2 12h4M18 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
            Become a Keeper
          </button>
          <button
            className="flex items-center gap-2 px-6 h-12 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(99,102,241,0.2)',
              color: '#818CF8',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6M9 12h6M9 15h4" />
            </svg>
            My Bot Stats
          </button>
        </div>

        {/* How it works */}
        <div className="w-full max-w-3xl">
          <HowItWorks />
        </div>

        {/* Main grid: keeper list + calculator */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6 items-start">

          {/* Left: keeper list */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{ color: '#E2E8F0' }}>Active Keepers</h2>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                  {onlineCount} online · {keepers.length} registered
                </p>
              </div>
              {/* Filter tabs */}
              <div
                className="flex items-center gap-1 rounded-xl p-1"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.12)' }}
              >
                {['All', 'Online', 'Top'].map((label) => (
                  <button
                    key={label}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 first:bg-[rgba(99,102,241,0.15)] first:text-indigo-300"
                    style={{
                      color: label === 'All' ? '#818CF8' : '#64748B',
                      background: label === 'All' ? 'rgba(99,102,241,0.15)' : 'transparent',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {keepers.map((keeper) => (
                <KeeperCard key={keeper.id} keeper={keeper} />
              ))}
            </div>
          </div>

          {/* Right: earnings calculator */}
          <div className="lg:sticky lg:top-24">
            <EarningsCalculator onJoin={() => setModalOpen(true)} />

            {/* Tip info card */}
            <div
              className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs"
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
                The <span style={{ color: '#818CF8' }}>0.1% keeper tip</span> is paid in the
                input token of each order. Keepers are ranked by reputation score which
                reflects uptime and successful execution rate.
              </p>
            </div>
          </div>
        </div>

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

      {/* Become a Keeper modal */}
      <BecomeKeeperModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

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

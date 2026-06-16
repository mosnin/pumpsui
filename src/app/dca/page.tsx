'use client'

import { useState, useCallback } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { CreateDCACard } from '@/components/dca/CreateDCACard'
import { DCAPositionCard } from '@/components/dca/DCAPositionCard'
import { DCAPosition, DCA_STATUS, generateDemoPositions } from '@/lib/dca'

// ─── Tab types ────────────────────────────────────────────────────────────────

type PositionTab = 'active' | 'completed'

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyPositions({ tab }: { tab: PositionTab }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5">
          <path d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="9" />
          {tab === 'completed' && <path d="M9 12l2 2 4-4" stroke="#475569" />}
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium mb-1" style={{ color: '#475569' }}>
          {tab === 'active' ? 'No active DCA positions' : 'No completed positions yet'}
        </p>
        <p className="text-xs" style={{ color: '#334155' }}>
          {tab === 'active'
            ? 'Create your first DCA position above to start accumulating'
            : 'Completed positions will appear here once all cycles run'}
        </p>
      </div>
    </div>
  )
}

// ─── Positions panel ──────────────────────────────────────────────────────────

interface PositionsPanelProps {
  positions: DCAPosition[]
  onUpdated: (id: string, newStatus: number) => void
  onCancelled: (id: string) => void
}

function PositionsPanel({ positions, onUpdated, onCancelled }: PositionsPanelProps) {
  const [activeTab, setActiveTab] = useState<PositionTab>('active')

  const activePositions = positions.filter(
    (p) => p.status === DCA_STATUS.ACTIVE || p.status === DCA_STATUS.PAUSED,
  )
  const completedPositions = positions.filter(
    (p) => p.status === DCA_STATUS.COMPLETED,
  )

  const display = activeTab === 'active' ? activePositions : completedPositions

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(99,102,241,0.12)',
      }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center gap-0 px-4 pt-4"
        style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}
      >
        {(['active', 'completed'] as PositionTab[]).map((tab) => {
          const count = tab === 'active' ? activePositions.length : completedPositions.length
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative px-4 py-2.5 text-sm font-medium capitalize transition-all duration-150"
              style={{ color: isActive ? '#818CF8' : '#64748B' }}
            >
              {tab === 'active' ? 'Active' : 'Completed'}
              {count > 0 && (
                <span
                  className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                    color: isActive ? '#818CF8' : '#64748B',
                  }}
                >
                  {count}
                </span>
              )}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #6366F1, #06B6D4)' }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Position list */}
      <div className="p-4">
        {display.length === 0 ? (
          <EmptyPositions tab={activeTab} />
        ) : (
          <div className="space-y-3">
            {display.map((position) => (
              <DCAPositionCard
                key={position.id}
                position={position}
                onUpdated={onUpdated}
                onCancelled={onCancelled}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DCAPage() {
  const account = useCurrentAccount()

  // When connected, start with an empty list (will be fetched from chain in production).
  // When not connected, show demo positions so the UI is not blank.
  const [positions, setPositions] = useState<DCAPosition[]>(() =>
    generateDemoPositions(),
  )

  const handlePositionCreated = useCallback((_txDigest: string) => {
    // In production, refetch user positions from chain here.
    // For now, just a placeholder — the real object ID won't be known
    // until the transaction is finalized and queried.
  }, [])

  const handleUpdated = useCallback((id: string, newStatus: number) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus as DCAPosition['status'] } : p)),
    )
  }, [])

  const handleCancelled = useCallback((id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id))
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
          className="absolute rounded-full"
          style={{
            width: '400px', height: '400px', top: '40%', right: '20%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
            animation: 'blobFloat3 20s ease-in-out infinite',
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
      <div className="relative z-10 w-full flex flex-col items-center gap-8">

        {/* Brand header */}
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
                <path d="M12 8v4l3 3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2" opacity="0.6" />
                <path d="M3 12h2M19 12h2M12 3v2M12 19v2" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
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
              DCA
            </span>
          </div>
          <p className="text-sm" style={{ color: '#475569' }}>
            Dollar-cost average into any token on a schedule
          </p>
        </div>

        {/* How it works — compact info strip */}
        <div
          className="flex items-center gap-6 px-5 py-3 rounded-2xl flex-wrap justify-center"
          style={{
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.15)',
            maxWidth: 600,
          }}
        >
          {[
            { icon: '📥', text: 'Pre-fund position' },
            { icon: '⏰', text: 'Keeper executes on schedule' },
            { icon: '📈', text: 'Average out price volatility' },
            { icon: '💰', text: 'Withdraw anytime' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <span>{icon}</span>
              <span className="text-xs" style={{ color: '#94A3B8' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Main two-column layout */}
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[420px,1fr] gap-6 items-start">

          {/* Left: Create card */}
          <div className="w-full">
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
                {/* Card header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: '#E2E8F0' }}>
                      Create DCA
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                      Schedule recurring purchases
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
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                    Auto
                  </div>
                </div>

                <CreateDCACard onPositionCreated={handlePositionCreated} />
              </div>
            </div>

            {/* Keeper tip info */}
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
                A <span style={{ color: '#818CF8' }}>0.1% keeper tip</span> is deducted per cycle to incentivise
                the keeper bot that executes your orders on time. Remaining input is
                swapped at the best available price.
              </p>
            </div>
          </div>

          {/* Right: Positions panel */}
          <div className="w-full">
            {/* Demo data notice when not connected */}
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
                Connect your wallet to see your real DCA positions. Showing demo data.
              </div>
            )}

            <PositionsPanel
              positions={positions}
              onUpdated={handleUpdated}
              onCancelled={handleCancelled}
            />
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
        @keyframes blobFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 40px) scale(1.05); }
        }
      `}</style>
    </main>
  )
}

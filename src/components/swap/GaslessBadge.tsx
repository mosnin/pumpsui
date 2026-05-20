'use client'
import { useEffect, useState } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'

interface GaslessBadgeProps {
  gaslessMode: boolean
  onToggle: (enabled: boolean) => void
}

interface SponsorStatus {
  available: boolean
  remainingMist: string
  resetAt: string
}

/** Convert MIST to a human-readable SUI amount (2 decimal places max). */
function mistToSui(mist: string): string {
  const value = Number(BigInt(mist)) / 1e9
  return value.toFixed(value < 0.01 ? 4 : 2)
}

/** Format an ISO timestamp as a human-friendly countdown. */
function formatResetTime(isoDate: string): string {
  const ms = new Date(isoDate).getTime() - Date.now()
  if (ms <= 0) return 'shortly'
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function GaslessBadge({ gaslessMode, onToggle }: GaslessBadgeProps) {
  const account = useCurrentAccount()
  const [sponsorStatus, setSponsorStatus] = useState<SponsorStatus | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!account?.address) {
      setSponsorStatus(null)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(`/api/sponsor/status?address=${encodeURIComponent(account.address)}`)
      .then((r) => r.json() as Promise<SponsorStatus>)
      .then((data) => {
        if (!cancelled) setSponsorStatus(data)
      })
      .catch(() => {
        if (!cancelled) setSponsorStatus(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [account?.address])

  const limitExceeded = sponsorStatus !== null && !sponsorStatus.available

  return (
    <div
      className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}
    >
      {/* Top row: label + toggle buttons */}
      <div className="flex items-center gap-2">
        {/* Fuel icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={gaslessMode ? '#06B6D4' : '#64748B'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <path d="M3 22V6a2 2 0 012-2h8a2 2 0 012 2v16" />
          <path d="M3 22h12" />
          <path d="M15 6h1a2 2 0 012 2v3a2 2 0 002 2h0" />
          <path d="M20 16v2a2 2 0 01-2 2h-1" />
          <line x1="7" y1="10" x2="11" y2="10" />
        </svg>

        <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>
          Gas
        </span>

        {/* Toggle group */}
        <div
          className="flex items-center rounded-lg overflow-hidden ml-1"
          style={{ border: '1px solid rgba(99,102,241,0.25)' }}
        >
          {/* Gasless button */}
          <button
            onClick={() => !limitExceeded && onToggle(true)}
            disabled={limitExceeded}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-all"
            style={{
              background: gaslessMode
                ? 'linear-gradient(90deg, rgba(6,182,212,0.25) 0%, rgba(99,102,241,0.2) 100%)'
                : 'transparent',
              color: gaslessMode ? '#06B6D4' : '#64748B',
              cursor: limitExceeded ? 'not-allowed' : 'pointer',
              borderRight: '1px solid rgba(99,102,241,0.25)',
            }}
            title={limitExceeded ? 'Daily gas limit reached' : 'Use OmniWeave sponsored gas'}
          >
            Gasless
            {gaslessMode && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          {/* Pay own gas button */}
          <button
            onClick={() => onToggle(false)}
            className="flex items-center px-2.5 py-1 text-xs font-medium transition-all"
            style={{
              background: !gaslessMode ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: !gaslessMode ? '#E2E8F0' : '#64748B',
              cursor: 'pointer',
            }}
          >
            Pay own gas
          </button>
        </div>

        {/* Loading indicator */}
        {loading && (
          <svg
            className="animate-spin ml-auto"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6366F1"
            strokeWidth="2.5"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        )}
      </div>

      {/* Status line */}
      {account && !loading && (
        <p className="text-xs leading-snug" style={{ color: '#475569' }}>
          {limitExceeded ? (
            <span style={{ color: '#F59E0B' }}>
              Daily limit reached · resets in {sponsorStatus ? formatResetTime(sponsorStatus.resetAt) : '—'}
            </span>
          ) : gaslessMode ? (
            <span>
              <span style={{ color: '#06B6D4' }}>Sponsored by OmniWeave</span>
              {sponsorStatus && (
                <span>
                  {' '}
                  · {mistToSui(sponsorStatus.remainingMist)} SUI remaining today
                </span>
              )}
              <span style={{ color: '#475569' }}> · 0.1 SUI/day limit</span>
            </span>
          ) : (
            <span>You pay network gas fees · switch to Gasless to save</span>
          )}
        </p>
      )}

      {!account && (
        <p className="text-xs" style={{ color: '#475569' }}>
          Connect wallet to use gasless swaps
        </p>
      )}
    </div>
  )
}

export default GaslessBadge

'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  generateDemoProjects,
  fillPercent,
  formatSui,
  formatTimeRemaining,
  formatTimeUntil,
} from '@/lib/launchpad'
import { ContributeModal } from '@/components/launch/ContributeModal'

// ─── Back button ──────────────────────────────────────────────────────────────

function BackButton() {
  return (
    <Link
      href="/launch"
      className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      Back to Launchpad
    </Link>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
    live: { label: 'LIVE', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#F87171', dot: '#EF4444' },
    upcoming: { label: 'UPCOMING', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#FCD34D', dot: '#F59E0B' },
    ended_success: { label: 'SUCCESS', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#34D399', dot: '#10B981' },
    ended_failed: { label: 'FAILED', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', text: '#9CA3AF', dot: '#6B7280' },
  }
  const c = config[status] ?? config['ended_failed']
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold tracking-wide"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-1"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
        border: '1px solid rgba(42,42,90,0.5)',
      }}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-600">{sub}</p>}
    </div>
  )
}

// ─── Tokenomics section ───────────────────────────────────────────────────────

function TokenomicsSection({
  tgePercent,
  cliffMonths,
  vestingMonths,
  symbol,
  totalForSale,
  pricePerTokenSui,
}: {
  tgePercent: number
  cliffMonths: number
  vestingMonths: number
  symbol: string
  totalForSale: number
  pricePerTokenSui: number
}) {
  const rows = [
    { label: 'Total for Sale', value: totalForSale.toLocaleString() + ' ' + symbol },
    { label: 'Token Price', value: `${pricePerTokenSui} SUI` },
    { label: 'TGE Unlock', value: `${tgePercent}%` },
    { label: 'Cliff', value: cliffMonths > 0 ? `${cliffMonths} months` : 'None' },
    { label: 'Linear Vesting', value: `${vestingMonths} months` },
  ]

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
        border: '1px solid rgba(42,42,90,0.5)',
      }}
    >
      <h3 className="text-base font-bold text-white mb-4">Tokenomics</h3>
      <div className="flex flex-col divide-y" style={{ borderColor: 'rgba(42,42,90,0.4)' }}>
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-3">
            <span className="text-sm text-slate-400">{row.label}</span>
            <span className="text-sm font-semibold text-white">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Visual vesting bar */}
      <div className="mt-4">
        <p className="text-xs text-slate-500 mb-2">Unlock schedule</p>
        <div className="flex h-6 overflow-hidden rounded-lg">
          <div
            className="flex items-center justify-center text-xs font-bold text-white"
            style={{
              width: `${tgePercent}%`,
              background: 'linear-gradient(90deg, #6366F1, #818CF8)',
              minWidth: tgePercent > 0 ? '32px' : '0',
            }}
          >
            {tgePercent > 5 ? `${tgePercent}%` : ''}
          </div>
          {cliffMonths > 0 && (
            <div
              className="flex items-center justify-center text-xs text-slate-500"
              style={{
                width: '15%',
                background: 'rgba(107,114,128,0.2)',
                borderLeft: '1px solid rgba(42,42,90,0.5)',
              }}
            >
              cliff
            </div>
          )}
          <div
            className="flex-1 flex items-center justify-center text-xs font-medium"
            style={{
              background: 'linear-gradient(90deg, rgba(6,182,212,0.3), rgba(6,182,212,0.15))',
              borderLeft: '1px solid rgba(42,42,90,0.5)',
              color: '#22D3EE',
            }}
          >
            {100 - tgePercent}% linear
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Apply section ────────────────────────────────────────────────────────────

function ApplySection() {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.05))',
        border: '1px solid rgba(99,102,241,0.2)',
      }}
    >
      <div
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-xl"
        style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}
      >
        &#128640;
      </div>
      <h3 className="text-base font-bold text-white mb-1">Launch your token on OmniWeave</h3>
      <p className="text-sm text-slate-400 mb-4 max-w-sm mx-auto">
        Get access to OmniWeave&#39;s liquidity network, OMNI staker community, and fair launch infrastructure.
      </p>
      <Link
        href="/launch/apply"
        className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90"
        style={{
          background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
          color: '#fff',
        }}
      >
        Apply to Launch
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}

// ─── Not found ────────────────────────────────────────────────────────────────

function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#060611' }}>
      <div className="text-center">
        <p className="text-5xl mb-4">&#128640;</p>
        <h1 className="text-xl font-bold text-white mb-2">Launch not found</h1>
        <p className="text-slate-400 mb-6">This project does not exist or has been removed.</p>
        <Link
          href="/launch"
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}
        >
          Back to Launchpad
        </Link>
      </div>
    </main>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LaunchDetailPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''
  const projects = useMemo(() => generateDemoProjects(), [])
  const project = projects.find((p) => p.id === id)

  const [modalOpen, setModalOpen] = useState(false)

  if (!project) return <NotFound />

  const pct = fillPercent(project)
  const isLive = project.status === 'live'
  const isUpcoming = project.status === 'upcoming'

  const timeLabel = isLive
    ? formatTimeRemaining(project.endDate)
    : isUpcoming
      ? formatTimeUntil(project.startDate)
      : project.status === 'ended_success'
        ? 'Sale ended'
        : 'Failed'

  return (
    <main className="min-h-screen" style={{ background: '#060611' }}>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <BackButton />

        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-start gap-5 flex-wrap">
            {/* Logo */}
            <div
              className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${project.logoGradient[0]}, ${project.logoGradient[1]})`,
              }}
            >
              {project.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-black text-white">{project.name}</h1>
                <span className="text-slate-500 font-mono text-sm">{project.symbol}</span>
                <StatusBadge status={project.status} />
              </div>
              <p className="text-slate-400 text-sm max-w-xl mb-3">{project.description}</p>
              <div className="flex flex-wrap gap-3">
                {project.website && (
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20" />
                    </svg>
                    Website
                  </a>
                )}
                {project.twitter && (
                  <a
                    href={`https://twitter.com/${project.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.733-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63z" />
                    </svg>
                    {project.twitter}
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: main info */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Progress card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
                border: '1px solid rgba(42,42,90,0.5)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white">Sale Progress</h2>
                <span className="text-sm font-bold" style={{ color: project.logoGradient[0] }}>
                  {pct}%
                </span>
              </div>

              {/* Large progress bar */}
              <div
                className="h-4 w-full overflow-hidden rounded-full mb-3"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${project.logoGradient[0]}, ${project.logoGradient[1]})`,
                  }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-500 mb-6">
                <span>
                  Raised:{' '}
                  <span className="text-white font-semibold">
                    {formatSui(project.raisedSui)} SUI
                  </span>
                </span>
                <span>
                  Hard cap:{' '}
                  <span className="text-white font-semibold">
                    {formatSui(project.hardCapSui)} SUI
                  </span>
                </span>
              </div>

              {/* Soft cap marker */}
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    background:
                      project.raisedSui >= project.softCapSui ? '#10B981' : '#64748b',
                  }}
                />
                <span>
                  Soft cap: {formatSui(project.softCapSui)} SUI
                  {project.raisedSui >= project.softCapSui && (
                    <span style={{ color: '#34D399' }}> — reached</span>
                  )}
                </span>
              </div>
            </motion.div>

            {/* Stats grid */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-4"
            >
              <StatCard
                label="Contributors"
                value={project.contributors.toLocaleString()}
                sub="unique wallets"
              />
              <StatCard
                label="Token Price"
                value={`${project.pricePerTokenSui} SUI`}
                sub={`per ${project.symbol}`}
              />
              <StatCard
                label={isLive ? 'Time Remaining' : isUpcoming ? 'Starts In' : 'Status'}
                value={timeLabel}
              />
              <StatCard
                label="Min / Max"
                value={`${project.minContributionSui}–${project.maxContributionSui}`}
                sub="SUI per wallet"
              />
            </motion.div>

            {/* Tokenomics */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <TokenomicsSection
                tgePercent={project.tgePercent}
                cliffMonths={project.cliffMonths}
                vestingMonths={project.vestingMonths}
                symbol={project.symbol}
                totalForSale={project.totalForSale}
                pricePerTokenSui={project.pricePerTokenSui}
              />
            </motion.div>
          </div>

          {/* Right: contribute sidebar */}
          <div className="flex flex-col gap-5">
            {/* CTA card */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="sticky top-20 flex flex-col gap-4 rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(22,22,48,0.95), rgba(13,13,31,0.98))',
                border: '1px solid rgba(99,102,241,0.25)',
              }}
            >
              <div>
                <p className="text-xs text-slate-500 mb-1">Total for sale</p>
                <p className="text-lg font-bold text-white">
                  {project.totalForSale.toLocaleString()} {project.symbol}
                </p>
              </div>

              {/* Mini progress */}
              <div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${project.logoGradient[0]}, ${project.logoGradient[1]})`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  <span>{formatSui(project.raisedSui)} raised</span>
                  <span>{pct}%</span>
                </div>
              </div>

              {/* Whitelist */}
              {project.whitelistRequired && (
                <div
                  className="rounded-xl p-3 flex items-center gap-2"
                  style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.18)',
                  }}
                >
                  <span style={{ color: '#818CF8', fontSize: '16px' }}>&#9651;</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Whitelist gated</p>
                    <p className="text-xs text-slate-500">
                      Min {project.minOmniStake.toLocaleString()} OMNI staked
                    </p>
                  </div>
                </div>
              )}

              {isLive && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${project.logoGradient[0]}, ${project.logoGradient[1]})`,
                  }}
                >
                  Contribute SUI
                </button>
              )}

              {isUpcoming && (
                <button
                  className="w-full rounded-xl py-3 text-sm font-semibold transition-all"
                  style={{
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    color: '#818CF8',
                  }}
                >
                  Notify Me
                </button>
              )}

              {!isLive && !isUpcoming && (
                <div
                  className="w-full rounded-xl py-3 text-center text-sm font-semibold"
                  style={{
                    background: 'rgba(107,114,128,0.08)',
                    border: '1px solid rgba(107,114,128,0.2)',
                    color: '#6B7280',
                  }}
                >
                  {project.status === 'ended_success' ? 'Sale Completed' : 'Sale Failed'}
                </div>
              )}

              <p className="text-xs text-center text-slate-600">
                2% platform fee on all contributions
              </p>
            </motion.div>

            {/* Apply section */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <ApplySection />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Contribute modal */}
      <ContributeModal
        project={project}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </main>
  )
}

'use client'

import Link from 'next/link'
import {
  type LaunchProject,
  fillPercent,
  formatSui,
  formatTimeRemaining,
  formatTimeUntil,
} from '@/lib/launchpad'

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LaunchProject['status'] }) {
  const config = {
    live: {
      label: 'LIVE',
      dot: '#EF4444',
      bg: 'rgba(239,68,68,0.12)',
      border: 'rgba(239,68,68,0.3)',
      text: '#F87171',
      pulse: true,
    },
    upcoming: {
      label: 'UPCOMING',
      dot: '#F59E0B',
      bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.3)',
      text: '#FCD34D',
      pulse: false,
    },
    ended_success: {
      label: 'SUCCESS',
      dot: '#10B981',
      bg: 'rgba(16,185,129,0.12)',
      border: 'rgba(16,185,129,0.3)',
      text: '#34D399',
      pulse: false,
    },
    ended_failed: {
      label: 'FAILED',
      dot: '#6B7280',
      bg: 'rgba(107,114,128,0.12)',
      border: 'rgba(107,114,128,0.3)',
      text: '#9CA3AF',
      pulse: false,
    },
  }[status]

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide"
      style={{ background: config.bg, border: `1px solid ${config.border}`, color: config.text }}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.pulse && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: config.dot }}
          />
        )}
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ background: config.dot }}
        />
      </span>
      {config.label}
    </span>
  )
}

// ─── Category badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: LaunchProject['category'] }) {
  const colors: Record<LaunchProject['category'], { bg: string; text: string }> = {
    DeFi:           { bg: 'rgba(99,102,241,0.15)',  text: '#818CF8' },
    Gaming:         { bg: 'rgba(16,185,129,0.15)',  text: '#34D399' },
    Infrastructure: { bg: 'rgba(6,182,212,0.15)',   text: '#22D3EE' },
    Social:         { bg: 'rgba(236,72,153,0.15)',  text: '#F472B6' },
    Meme:           { bg: 'rgba(245,158,11,0.15)',  text: '#FCD34D' },
  }
  const c = colors[category]
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      {category}
    </span>
  )
}

// ─── Logo placeholder ─────────────────────────────────────────────────────────

function LogoPlaceholder({ name, gradient }: { name: string; gradient: string[] }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      }}
    >
      {initials}
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  percent,
  gradient,
}: {
  percent: number
  gradient: string[]
}) {
  return (
    <div className="relative">
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`,
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>{percent}% filled</span>
        <span>Hard cap</span>
      </div>
    </div>
  )
}

// ─── OMNI stake badge ─────────────────────────────────────────────────────────

function OmniRequirement({ required, minStake }: { required: boolean; minStake: number }) {
  if (!required) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
        <span style={{ color: '#34D399' }}>&#10003;</span> Public sale
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        background: 'rgba(99,102,241,0.12)',
        border: '1px solid rgba(99,102,241,0.2)',
        color: '#818CF8',
      }}
    >
      &#9651; {minStake.toLocaleString()} OMNI required
    </span>
  )
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: LaunchProject
  onContribute?: (project: LaunchProject) => void
}

export function ProjectCard({ project, onContribute }: ProjectCardProps) {
  const pct = fillPercent(project)
  const isLive = project.status === 'live'
  const isUpcoming = project.status === 'upcoming'
  const isEndedSuccess = project.status === 'ended_success'

  const timeLabel = isLive
    ? formatTimeRemaining(project.endDate)
    : isUpcoming
      ? formatTimeUntil(project.startDate)
      : isEndedSuccess
        ? 'Sale ended'
        : 'Failed'

  return (
    <div
      className="group flex flex-col gap-4 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
        border: '1px solid rgba(42,42,90,0.5)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <LogoPlaceholder name={project.name} gradient={project.logoGradient} />
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/launch/${project.id}`}
                className="text-base font-bold text-white hover:text-indigo-300 transition-colors"
              >
                {project.name}
              </Link>
              <span className="text-xs text-slate-500 font-mono">{project.symbol}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <CategoryBadge category={project.category} />
              <OmniRequirement
                required={project.whitelistRequired}
                minStake={project.minOmniStake}
              />
            </div>
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Description */}
      <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{project.description}</p>

      {/* Progress */}
      {(isLive || isEndedSuccess || project.status === 'ended_failed') && (
        <ProgressBar percent={pct} gradient={project.logoGradient} />
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-xs text-slate-500">Raised</p>
          <p className="mt-0.5 text-sm font-bold text-white">
            {formatSui(project.raisedSui)} SUI
          </p>
          <p className="text-xs text-slate-600">of {formatSui(project.hardCapSui)} hard cap</p>
        </div>
        <div
          className="rounded-xl p-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-xs text-slate-500">
            {isUpcoming ? 'Time until start' : 'Contributors'}
          </p>
          <p className="mt-0.5 text-sm font-bold text-white">
            {isUpcoming ? timeLabel : project.contributors.toLocaleString()}
          </p>
          {!isUpcoming && (
            <p className="text-xs text-slate-600">{timeLabel}</p>
          )}
        </div>
      </div>

      {/* Price row */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Price: <span className="text-slate-300 font-medium">{project.pricePerTokenSui} SUI</span>
          {' '}/{' '}{project.symbol}
        </span>
        <span>
          TGE: <span className="text-slate-300 font-medium">{project.tgePercent}%</span>
        </span>
      </div>

      {/* CTA */}
      <div className="mt-auto">
        {isLive ? (
          <button
            onClick={() => onContribute?.(project)}
            className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${project.logoGradient[0]}, ${project.logoGradient[1]})`,
            }}
          >
            Contribute
          </button>
        ) : isUpcoming ? (
          <button
            className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all duration-200"
            style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              color: '#818CF8',
            }}
          >
            Notify Me
          </button>
        ) : isEndedSuccess ? (
          <Link
            href={`/launch/${project.id}`}
            className="block w-full rounded-xl py-2.5 text-center text-sm font-semibold"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
              color: '#34D399',
            }}
          >
            View Results
          </Link>
        ) : (
          <div
            className="w-full rounded-xl py-2.5 text-center text-sm font-semibold"
            style={{
              background: 'rgba(107,114,128,0.08)',
              border: '1px solid rgba(107,114,128,0.2)',
              color: '#6B7280',
            }}
          >
            Sale Failed
          </div>
        )}
      </div>
    </div>
  )
}

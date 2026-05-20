'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { generateDemoProjects, type LaunchProject } from '@/lib/launchpad'
import { ProjectCard } from '@/components/launch/ProjectCard'
import { ContributeModal } from '@/components/launch/ContributeModal'

// ─── Platform stats bar ───────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { label: 'Total Launches', value: '12' },
    { label: 'Total Raised', value: '$4.2M' },
    { label: 'Participants', value: '23K' },
    { label: 'Avg Fill Rate', value: '94%' },
  ]

  return (
    <div
      className="rounded-2xl px-6 py-4"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.8), rgba(13,13,31,0.9))',
        border: '1px solid rgba(42,42,90,0.5)',
      }}
    >
      <div className="flex flex-wrap items-center gap-6 sm:gap-10">
        {stats.map((stat, i) => (
          <div key={stat.label} className="flex items-center gap-6">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="text-sm font-bold text-white">{stat.value}</p>
            </div>
            {i < stats.length - 1 && (
              <div
                className="hidden sm:block h-8 w-px"
                style={{ background: 'rgba(42,42,90,0.7)' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Filter tab ───────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'live' | 'upcoming' | 'ended'

function FilterTabs({
  active,
  onChange,
  counts,
}: {
  active: FilterTab
  onChange: (f: FilterTab) => void
  counts: Record<FilterTab, number>
}) {
  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'live', label: 'Live' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'ended', label: 'Ended' },
  ]

  return (
    <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id
        const count = counts[tab.id]
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
            style={{
              background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: isActive ? '#818CF8' : '#64748b',
              border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
            }}
          >
            {tab.label}
            {count > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-xs font-bold leading-none"
                style={{
                  background: isActive ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#818CF8' : '#64748b',
                }}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Apply CTA ────────────────────────────────────────────────────────────────

function ApplyCTA() {
  return (
    <Link
      href="/launch/apply"
      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.15))',
        border: '1px solid rgba(99,102,241,0.35)',
        color: '#818CF8',
      }}
    >
      Apply to Launch
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterTab }) {
  const messages: Record<FilterTab, string> = {
    all: 'No launches found.',
    live: 'No live launches right now. Check back soon.',
    upcoming: 'No upcoming launches scheduled.',
    ended: 'No ended launches yet.',
  }
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full text-2xl"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        &#128640;
      </div>
      <p className="text-slate-400">{messages[filter]}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LaunchPage() {
  const projects = useMemo(() => generateDemoProjects(), [])
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [modalProject, setModalProject] = useState<LaunchProject | null>(null)

  const counts = useMemo<Record<FilterTab, number>>(() => {
    return {
      all: projects.length,
      live: projects.filter((p) => p.status === 'live').length,
      upcoming: projects.filter((p) => p.status === 'upcoming').length,
      ended: projects.filter((p) => p.status === 'ended_success' || p.status === 'ended_failed').length,
    }
  }, [projects])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return projects
    if (activeFilter === 'live') return projects.filter((p) => p.status === 'live')
    if (activeFilter === 'upcoming') return projects.filter((p) => p.status === 'upcoming')
    return projects.filter((p) => p.status === 'ended_success' || p.status === 'ended_failed')
  }, [projects, activeFilter])

  return (
    <main className="min-h-screen" style={{ background: '#060611' }}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(6,182,212,0.2))',
                    border: '1px solid rgba(99,102,241,0.3)',
                  }}
                >
                  &#128640;
                </div>
                <h1
                  className="text-3xl font-black tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, #fff 30%, #818CF8 70%, #06B6D4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  OmniWeave Launchpad
                </h1>
              </div>
              <p className="text-slate-400 text-sm max-w-xl">
                Fair token launches on Sui. OMNI stakers get whitelist access to new projects before anyone else.
              </p>
            </div>
            <ApplyCTA />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6"
        >
          <StatsBar />
        </motion.div>

        {/* OMNI staker callout */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-6 flex items-center gap-3 rounded-2xl px-5 py-4"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.06))',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8' }}
          >
            &#9651;
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              Stake OMNI for guaranteed whitelist access
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              OMNI stakers get priority allocation on all whitelist-gated launches. The more you stake, the higher your tier.
            </p>
          </div>
          <Link
            href="/staking"
            className="flex-shrink-0 rounded-lg px-4 py-2 text-xs font-bold transition-all hover:opacity-90"
            style={{
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#818CF8',
            }}
          >
            Stake OMNI
          </Link>
        </motion.div>

        {/* Filter row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-6 flex items-center justify-between gap-4 flex-wrap"
        >
          <FilterTabs active={activeFilter} onChange={setActiveFilter} counts={counts} />
          <p className="text-xs text-slate-500">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <EmptyState filter={activeFilter} />
          ) : (
            filtered.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
              >
                <ProjectCard project={project} onContribute={setModalProject} />
              </motion.div>
            ))
          )}
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16"
        >
          <h2 className="text-lg font-bold text-white mb-6">How it works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Project applies',
                desc: 'Project teams apply to launch on OmniWeave. Our team reviews and curates quality launches.',
                color: '#6366F1',
              },
              {
                step: '02',
                title: 'OMNI stakers get access',
                desc: 'Whitelist spots go to verified OMNI stakers first. Higher stake = higher allocation.',
                color: '#06B6D4',
              },
              {
                step: '03',
                title: 'Liquidity bootstrapped',
                desc: 'Raised SUI pairs with project tokens to seed DEX liquidity. OmniWeave earns 2% launch fee.',
                color: '#8B5CF6',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl p-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
                  border: '1px solid rgba(42,42,90,0.5)',
                }}
              >
                <div
                  className="mb-3 inline-flex items-center justify-center h-8 w-8 rounded-lg text-xs font-black"
                  style={{ background: `${item.color}20`, color: item.color }}
                >
                  {item.step}
                </div>
                <p className="text-sm font-bold text-white mb-1">{item.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Contribute modal */}
      {modalProject && (
        <ContributeModal
          project={modalProject}
          isOpen
          onClose={() => setModalProject(null)}
        />
      )}
    </main>
  )
}

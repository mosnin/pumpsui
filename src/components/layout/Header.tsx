'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { WalletButton } from '@/components/wallet/WalletButton'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { AlertBell } from '@/components/alerts/AlertBell'

const MotionLink = motion(Link)

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'AI', href: '/ai' },
  { label: 'Explore', href: '/explore' },
  { label: 'Swap', href: '/swap' },
  { label: 'Limit', href: '/limit' },
  { label: 'DCA', href: '/dca' },
  { label: 'Advanced', href: '/advanced' },
  { label: 'Bridge', href: '/bridge' },
  { label: 'Buy Crypto', href: '/onramp' },
  { label: 'Cross-Chain', href: '/cross-chain' },
  { label: 'Pools', href: '/pools' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Social', href: '/social' },
  { label: 'Referral', href: '/referral' },
  { label: 'Rewards', href: '/rewards' },
  { label: 'Staking', href: '/staking' },
  { label: 'Governance', href: '/governance' },
  { label: 'NFTs', href: '/nft' },
  { label: 'Token', href: '/token' },
  { label: 'Launch', href: '/launch' },
  { label: 'MEV Shield', href: '/mev' },
  { label: 'Keepers', href: '/keepers' },
  { label: 'Alerts', href: '/alerts' },
  { label: 'Deploy', href: '/deploy' },
  { label: 'Docs', href: '/docs' },
]

// ─── OmniWeave SVG Logo ───────────────────────────────────────────────────────
// Two overlapping hexagons (left: indigo, right: cyan) + gradient text

function OmniWeaveLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group" aria-label="OmniWeave home">
      {/* Interlocked hexagons */}
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        aria-hidden="true"
        className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="hex-left-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
          <linearGradient id="hex-right-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
          <linearGradient id="hex-overlap-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>

        {/* Left hexagon (indigo) */}
        <polygon
          points="10,2 20,2 25,11 20,20 10,20 5,11"
          fill="url(#hex-left-grad)"
          opacity="0.92"
        />
        {/* Right hexagon (cyan) — offset to create overlap */}
        <polygon
          points="16,16 26,16 31,25 26,34 16,34 11,25"
          fill="url(#hex-right-grad)"
          opacity="0.92"
        />
        {/* Overlap region highlight */}
        <polygon
          points="16,16 20,20 16,20 11,25 16,16"
          fill="url(#hex-overlap-grad)"
          opacity="0.6"
        />
      </svg>

      {/* Wordmark */}
      <span
        className="text-lg font-bold tracking-tight hidden sm:block"
        style={{
          background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        OmniWeave
      </span>
    </Link>
  )
}

// ─── Network indicator ────────────────────────────────────────────────────────

function NetworkIndicator() {
  return (
    <div
      className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-3 py-1.5"
      title="Connected to Sui Mainnet"
    >
      {/* Animated pulse dot */}
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      <span className="text-xs font-medium text-emerald-400">Sui Mainnet</span>
    </div>
  )
}

// ─── Hamburger button ─────────────────────────────────────────────────────────

function HamburgerButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200 lg:hidden"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        {open ? (
          <>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </>
        ) : (
          <>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </>
        )}
      </svg>
    </button>
  )
}

// ─── Desktop navigation ───────────────────────────────────────────────────────

function DesktopNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
      {NAV_ITEMS.map(({ label, href }) => {
        const active = pathname === href
        return (
          <MotionLink
            key={href}
            href={href}
            className={[
              'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
              active
                ? 'text-indigo-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
            ].join(' ')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {label}

            {/* Active indicator bar with shared layoutId for smooth transitions */}
            {active && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full"
                style={{ background: 'linear-gradient(90deg, #6366F1, #06B6D4)' }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </MotionLink>
        )
      })}
    </nav>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header
        className="sticky top-0 z-20 w-full"
        style={{
          background: 'rgba(6, 6, 17, 0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(99, 102, 241, 0.15)',
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: logo + hamburger (mobile) */}
          <div className="flex items-center gap-3">
            <HamburgerButton open={mobileOpen} onClick={() => setMobileOpen((o) => !o)} />
            <OmniWeaveLogo />
          </div>

          {/* Center: desktop nav */}
          <DesktopNav />

          {/* Right: network indicator + alert bell + wallet */}
          <div className="flex items-center gap-3">
            <NetworkIndicator />
            <AlertBell />
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Mobile slide-in menu */}
      <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}

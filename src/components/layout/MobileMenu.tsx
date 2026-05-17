'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { WalletButton } from '@/components/wallet/WalletButton'

interface NavItem {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Swap', href: '/swap' },
  { label: 'Limit', href: '/limit' },
  { label: 'DCA', href: '/dca' },
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
  { label: 'Token', href: '/token' },
  { label: 'Alerts', href: '/alerts' },
  { label: 'Docs', href: '/docs' },
]

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname()

  // Close on route change
  useEffect(() => { onClose() }, [pathname, onClose])

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <motion.nav
            key="mobile-sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            aria-label="Mobile navigation"
            className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#060611] shadow-2xl shadow-black/60 lg:hidden"
            style={{ borderRight: '1px solid rgba(99,102,241,0.15)' }}
          >
            {/* Top bar */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}
            >
              {/* Logo mark */}
              <div className="flex items-center gap-2.5">
                <OmniWeaveLogo size={28} />
                <span
                  className="text-base font-bold tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg,#6366F1,#06B6D4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  OmniWeave
                </span>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <ul className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {NAV_ITEMS.map(({ label, href }) => {
                const active = pathname === href
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className={[
                        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                        active
                          ? 'bg-indigo-500/15 text-indigo-300'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                      ].join(' ')}
                    >
                      <NavIcon label={label} active={active} />
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Bottom wallet section */}
            <div
              className="px-4 py-4"
              style={{ borderTop: '1px solid rgba(99,102,241,0.12)' }}
            >
              <WalletButton />
            </div>

            {/* Network badge */}
            <div className="px-4 pb-5">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs text-emerald-400">Sui Mainnet</span>
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Inline logo (same as Header) ────────────────────────────────────────────

function OmniWeaveLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="mob-hex-left" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
        <linearGradient id="mob-hex-right" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <polygon
        points="9,3 17,3 21,10 17,17 9,17 5,10"
        fill="url(#mob-hex-left)"
        opacity="0.9"
      />
      <polygon
        points="15,15 23,15 27,22 23,29 15,29 11,22"
        fill="url(#mob-hex-right)"
        opacity="0.9"
      />
    </svg>
  )
}

// ─── Nav icons ────────────────────────────────────────────────────────────────

function NavIcon({ label, active }: { label: string; active: boolean }) {
  const color = active ? '#818CF8' : '#64748b'
  const icons: Record<string, React.ReactNode> = {
    Swap: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M7 16V4m0 0L3 8m4-4l4 4" />
        <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
    Limit: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <line x1="3" y1="8" x2="21" y2="8" />
        <line x1="3" y1="16" x2="21" y2="16" />
        <circle cx="8" cy="8" r="2" fill={color} stroke="none" />
        <circle cx="16" cy="16" r="2" fill={color} stroke="none" />
      </svg>
    ),
    DCA: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    Bridge: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
      </svg>
    ),
    'Buy Crypto': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    'Cross-Chain': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    Pools: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
        <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
      </svg>
    ),
    Analytics: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    Portfolio: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      </svg>
    ),
    Leaderboard: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M8 6H5a1 1 0 00-1 1v10a1 1 0 001 1h3" />
        <path d="M16 6h3a1 1 0 011 1v10a1 1 0 01-1 1h-3" />
        <rect x="8" y="2" width="8" height="20" rx="1" />
        <path d="M12 6v4l2 2" />
      </svg>
    ),
    Social: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    Referral: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="9" cy="8" r="3" />
        <path d="M6.5 21C6.5 17.96 7.41 15.5 9 15.5" />
        <circle cx="17" cy="15" r="3" />
        <path d="M14.5 21C14.5 18.52 15.57 16.5 17 16.5" />
        <path d="M14 9l2-2-2-2" />
        <path d="M12 7h4" />
      </svg>
    ),
    Rewards: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    Staking: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    Governance: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    Token: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 12h6m-3-3v6" />
      </svg>
    ),
    Alerts: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  }
  return <>{icons[label] ?? null}</>
}

import Link from 'next/link'

// ─── Inline logo (server-renderable, no 'use client' needed) ─────────────────

function FooterLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="footer-hex-left" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
          <linearGradient id="footer-hex-right" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
        </defs>
        <polygon points="10,2 20,2 25,11 20,20 10,20 5,11" fill="url(#footer-hex-left)" opacity="0.85" />
        <polygon points="16,16 26,16 31,25 26,34 16,34 11,25" fill="url(#footer-hex-right)" opacity="0.85" />
      </svg>
      <span
        className="text-base font-bold tracking-tight"
        style={{
          background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        OmniWeave
      </span>
    </div>
  )
}

// ─── "Built on Sui" badge ─────────────────────────────────────────────────────

function BuiltOnSuiBadge() {
  return (
    <a
      href="https://sui.io"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/8 px-3 py-1 text-xs font-medium text-cyan-400 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
    >
      {/* Sui logo mark — simplified drop shape */}
      <svg width="12" height="14" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true">
        <path d="M10 0C10 0 3 8.5 3 14a7 7 0 0014 0C17 8.5 10 0 10 0zm0 18a4 4 0 01-4-4c0-3 4-9 4-9s4 6 4 9a4 4 0 01-4 4z" />
      </svg>
      Built on Sui
    </a>
  )
}

// ─── Link groups ──────────────────────────────────────────────────────────────

const EXTERNAL_LINKS = [
  {
    label: 'Docs',
    href: 'https://docs.omniweave.xyz',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/omniweave',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58l-.01-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.08 1.84 2.82 1.31 3.51 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22l-.01 3.29c0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com/omniweave_xyz',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Discord',
    href: 'https://discord.gg/omniweave',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
]

// ─── Footer ───────────────────────────────────────────────────────────────────

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="w-full"
      style={{ borderTop: '1px solid rgba(99, 102, 241, 0.12)' }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: logo + tagline */}
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <FooterLogo />
            <p className="text-xs text-slate-500">
              The ultimate liquidity layer on Sui
            </p>
          </div>

          {/* Center: nav links */}
          <nav aria-label="Footer navigation">
            <ul className="flex items-center gap-1">
              {EXTERNAL_LINKS.map(({ label, href, icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
                  >
                    {icon}
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right: Built on Sui + copyright */}
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <BuiltOnSuiBadge />
            <p className="text-xs text-slate-600">
              &copy; {year} OmniWeave. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

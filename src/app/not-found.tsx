'use client'

import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="relative flex flex-col flex-1 items-center justify-center min-h-screen px-4 overflow-hidden">
      {/* Ambient orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Content */}
      <div className="relative text-center max-w-lg">
        {/* 404 number */}
        <div
          className="text-[10rem] font-bold leading-none gradient-text select-none"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          404
        </div>

        {/* Divider */}
        <div
          className="h-px w-32 mx-auto mb-8"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)' }}
        />

        {/* Heading */}
        <h1
          className="text-3xl font-bold mb-4"
          style={{ fontFamily: 'var(--font-display)', color: '#E2E8F0' }}
        >
          Page not found
        </h1>

        <p className="mb-10 leading-relaxed" style={{ color: '#64748B' }}>
          Looks like this route vanished into deep space. The page you&apos;re
          looking for doesn&apos;t exist or may have been moved.
        </p>

        {/* CTAs */}
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
              color: '#fff',
              boxShadow: '0 0 20px rgba(99,102,241,0.35)',
            }}
          >
            <Home size={16} />
            Back home
          </Link>
          <Link
            href="/swap"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(99,102,241,0.25)',
              color: '#94A3B8',
            }}
          >
            <Search size={16} />
            Go to swap
          </Link>
        </div>

        {/* Suggestion list */}
        <div className="mt-12">
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#475569' }}>
            You might be looking for
          </p>
          <div className="flex flex-col gap-2 items-center">
            {[
              { href: '/swap', label: 'Swap tokens' },
              { href: '/pools', label: 'Explore liquidity pools' },
              { href: '/portfolio', label: 'Your portfolio' },
              { href: '/analytics', label: 'Analytics dashboard' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 text-sm transition-colors duration-150"
                style={{ color: '#64748B' }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.color = '#818CF8'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.color = '#64748B'
                }}
              >
                <ArrowLeft size={12} />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

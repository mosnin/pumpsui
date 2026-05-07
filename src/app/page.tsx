import Link from 'next/link'
import { ArrowRight, Zap, Shield, BarChart3, Layers, TrendingUp, ChevronRight } from 'lucide-react'
import { SwapCard } from '@/components/swap/SwapCard'

const STATS = [
  { label: '24h Volume', value: '$124M' },
  { label: 'Integrated DEXes', value: '6+' },
  { label: 'Tokens', value: '500+' },
  { label: 'Avg Savings', value: '0.3%' },
] as const

const FEATURES = [
  {
    icon: <Zap className="w-7 h-7" style={{ color: '#22D3EE' }} />,
    title: 'Best Rates',
    desc: 'Smart routing across 6+ DEXes finds optimal paths and splits large orders for maximum output on every trade.',
    accent: 'rgba(6,182,212,0.15)',
    border: 'rgba(6,182,212,0.3)',
  },
  {
    icon: <Shield className="w-7 h-7" style={{ color: '#818CF8' }} />,
    title: 'MEV Protected',
    desc: 'Slippage tolerance, deadline enforcement, and private mempools keep your trades safe from front-running.',
    accent: 'rgba(99,102,241,0.15)',
    border: 'rgba(99,102,241,0.3)',
  },
  {
    icon: <BarChart3 className="w-7 h-7" style={{ color: '#C084FC' }} />,
    title: 'Multi-Hop',
    desc: 'Route through intermediate tokens to unlock liquidity when direct trading pairs are thin or non-existent.',
    accent: 'rgba(192,132,252,0.15)',
    border: 'rgba(192,132,252,0.3)',
  },
  {
    icon: <Layers className="w-7 h-7" style={{ color: '#34D399' }} />,
    title: 'Split Routes',
    desc: 'Distribute large orders across multiple pools simultaneously to minimize price impact on every execution.',
    accent: 'rgba(52,211,153,0.15)',
    border: 'rgba(52,211,153,0.3)',
  },
] as const

const DEX_LIST = [
  { name: 'Cetus', color: '#00D4AA' },
  { name: 'Turbos', color: '#3B82F6' },
  { name: 'DeepBook', color: '#F59E0B' },
  { name: 'Aftermath', color: '#8B5CF6' },
  { name: 'FlowX', color: '#EF4444' },
  { name: 'Kriya', color: '#10B981' },
] as const

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Select tokens',
    desc: 'Choose what you want to swap from 500+ tokens listed on Sui.',
  },
  {
    step: '02',
    title: 'We find the best route',
    desc: 'OmniWeave scans all DEXes and runs split-route optimisation in milliseconds.',
  },
  {
    step: '03',
    title: 'One-click execution',
    desc: 'Confirm the trade. Your tokens arrive in a single atomic transaction.',
  },
] as const

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* ── Ambient background orbs ── */}
      <div
        className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none animate-blob"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute top-20 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none animate-blob animation-delay-2000"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute top-[600px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none animate-blob animation-delay-4000"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 text-center px-4">
        {/* Live badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8"
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#818CF8',
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#34D399' }}
          />
          Now live on Sui Mainnet
        </div>

        {/* Headline */}
        <h1
          className="text-6xl md:text-8xl font-bold mb-6 tracking-tight"
          style={{
            fontFamily: 'var(--font-display)',
            lineHeight: 1.05,
            color: '#E2E8F0',
          }}
        >
          <span className="gradient-text">Trade Smarter</span>
          <br />
          <span style={{ color: '#E2E8F0' }}>on Sui</span>
        </h1>

        <p
          className="text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
          style={{ color: '#94A3B8' }}
        >
          OmniWeave aggregates liquidity from every major Sui DEX to find you
          the best rates. Multi-hop routing, split orders, MEV protection —
          all in one seamless interface.
        </p>

        {/* Stats bar */}
        <div className="flex justify-center gap-8 md:gap-16 mb-16 flex-wrap">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm mt-0.5" style={{ color: '#64748B' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Swap card — hero centrepiece */}
        <div className="flex justify-center mb-10">
          <SwapCard />
        </div>

        {/* Secondary CTAs */}
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            href="/swap"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
              color: '#fff',
              boxShadow: '0 0 20px rgba(99,102,241,0.35)',
            }}
          >
            Open full app <ArrowRight size={16} />
          </Link>
          <Link
            href="/pools"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(99,102,241,0.25)',
              color: '#94A3B8',
            }}
          >
            Explore pools <TrendingUp size={16} />
          </Link>
        </div>
      </section>

      {/* ── DEX strip ── */}
      <section
        className="py-12"
        style={{
          borderTop: '1px solid rgba(99,102,241,0.1)',
          borderBottom: '1px solid rgba(99,102,241,0.1)',
        }}
      >
        <p
          className="text-center text-xs font-semibold uppercase tracking-widest mb-8"
          style={{ color: '#64748B' }}
        >
          Aggregating liquidity from
        </p>
        <div className="flex justify-center items-center gap-8 md:gap-14 flex-wrap px-8">
          {DEX_LIST.map((dex) => (
            <span
              key={dex.name}
              className="text-lg font-bold cursor-default transition-all duration-200"
              style={{ color: '#475569' }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.color = dex.color
                el.style.filter = `drop-shadow(0 0 8px ${dex.color}80)`
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.color = '#475569'
                el.style.filter = 'none'
              }}
            >
              {dex.name}
            </span>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <p
            className="text-center text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#6366F1' }}
          >
            Why OmniWeave
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold text-center mb-4 tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: '#E2E8F0' }}
          >
            The most advanced DEX
            <br />
            <span className="gradient-text">aggregator on Sui</span>
          </h2>
          <p className="text-center mb-16 max-w-xl mx-auto" style={{ color: '#64748B' }}>
            Every trade is automatically optimised across all available liquidity
            sources so you never leave money on the table.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="glass-card p-6 transition-all duration-300 cursor-default"
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = feature.border
                  el.style.boxShadow = `0 0 24px ${feature.accent}, 0 8px 32px rgba(0,0,0,0.3)`
                  el.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'rgba(99,102,241,0.2)'
                  el.style.boxShadow = 'none'
                  el.style.transform = 'translateY(0)'
                }}
              >
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-xl mb-5"
                  style={{
                    background: feature.accent,
                    border: `1px solid ${feature.border}`,
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: '#E2E8F0' }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-28 px-4" style={{ background: 'rgba(13,13,31,0.6)' }}>
        <div className="max-w-4xl mx-auto">
          <p
            className="text-center text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#06B6D4' }}
          >
            How it works
          </p>
          <h2
            className="text-4xl font-bold text-center mb-16 tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: '#E2E8F0' }}
          >
            Simple as <span className="gradient-text">one, two, three</span>
          </h2>

          <div className="flex flex-col md:flex-row gap-10 md:gap-6 items-start">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="flex md:flex-col gap-5 md:gap-0 flex-1 items-start md:items-center md:text-center">
                {/* Step number */}
                <div
                  className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full text-sm font-bold md:mb-6"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                    boxShadow: '0 0 20px rgba(99,102,241,0.35)',
                    color: '#fff',
                  }}
                >
                  {item.step}
                </div>
                <div className="md:px-4">
                  <h3 className="font-semibold mb-2" style={{ color: '#E2E8F0' }}>
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-28 px-4">
        <div
          className="max-w-3xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.1) 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
            boxShadow: '0 0 60px rgba(99,102,241,0.12)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.2) 0%, transparent 70%)',
            }}
          />
          <h2
            className="relative text-4xl font-bold mb-4 tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: '#E2E8F0' }}
          >
            Ready to trade smarter?
          </h2>
          <p className="relative mb-8 text-lg" style={{ color: '#94A3B8' }}>
            Join thousands of traders already saving on every swap.
            No account needed — just connect your wallet.
          </p>
          <div className="relative flex justify-center gap-4 flex-wrap">
            <Link
              href="/swap"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                color: '#fff',
                boxShadow: '0 0 24px rgba(99,102,241,0.4)',
              }}
            >
              Start swapping <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

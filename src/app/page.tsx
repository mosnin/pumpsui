'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  motion,
  useInView,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'

// ─── Design tokens ────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#060611',
  surface: '#0D0D1F',
  primary: '#6366F1',
  accent: '#06B6D4',
  text: '#E2E8F0',
  sub: '#94A3B8',
  muted: '#64748B',
  cardBg: 'rgba(13,13,31,0.85)',
  cardBorder: 'rgba(99,102,241,0.2)',
}

// ─── Animated count-up hook ───────────────────────────────────────────────────

function useCountUp(target: number, inView: boolean, decimals = 0) {
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 60, damping: 25, mass: 1 })
  const display = useTransform(spring, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString(),
  )
  useEffect(() => {
    if (inView) mv.set(target)
  }, [inView, target, mv])
  return display
}

// ─── Stat counter component ───────────────────────────────────────────────────

function StatCounter({
  prefix = '',
  suffix = '',
  value,
  decimals = 0,
  inView,
}: {
  prefix?: string
  suffix?: string
  value: number
  decimals?: number
  inView: boolean
}) {
  const display = useCountUp(value, inView, decimals)
  return (
    <span>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const HERO_STATS = [
  { label: 'Total Volume', prefix: '$', value: 847, suffix: 'M+', decimals: 0 },
  { label: 'DEXes Integrated', prefix: '', value: 6, suffix: '', decimals: 0 },
  { label: 'Tokens', prefix: '', value: 500, suffix: '+', decimals: 0 },
  { label: 'Protocol Fee', prefix: '', value: 0.05, suffix: '%', decimals: 2 },
] as const

const DEX_LIST = [
  { name: 'Cetus', color: '#00D4AA' },
  { name: 'Turbos', color: '#3B82F6' },
  { name: 'DeepBook', color: '#F59E0B' },
  { name: 'Aftermath', color: '#8B5CF6' },
  { name: 'FlowX', color: '#EF4444' },
  { name: 'Kriya', color: '#10B981' },
  { name: 'BlueMove', color: '#60A5FA', soon: true },
  { name: 'Scallop', color: '#F472B6', soon: true },
] as const

const HOW_IT_WORKS = [
  {
    num: '01',
    title: 'Connect',
    desc: 'Connect your Sui wallet in one click. OmniWeave reads your balances and token holdings automatically.',
  },
  {
    num: '02',
    title: 'Route',
    desc: 'Our AI engine scans all 6 DEXes in milliseconds and splits your order across pools for the best rate.',
  },
  {
    num: '03',
    title: 'Execute',
    desc: 'A single Programmable Transaction Block executes atomically on Sui. You receive the best output — guaranteed.',
  },
] as const

const FEATURES = [
  {
    icon: '⚡',
    title: 'Best Execution',
    desc: 'Smart split routing across 6 DEXes finds optimal paths for every order size.',
    glow: 'rgba(99,102,241,0.35)',
    border: 'rgba(99,102,241,0.6)',
  },
  {
    icon: '🛡️',
    title: 'MEV Protection',
    desc: 'Private order flow, slippage limits, and deadline enforcement keep your trades safe.',
    glow: 'rgba(6,182,212,0.35)',
    border: 'rgba(6,182,212,0.6)',
  },
  {
    icon: '💧',
    title: 'Deep Liquidity',
    desc: 'CLMM + AMM + CLOB pools unified into a single routing layer for minimal price impact.',
    glow: 'rgba(52,211,153,0.35)',
    border: 'rgba(52,211,153,0.6)',
  },
  {
    icon: '🔗',
    title: 'Cross-Chain',
    desc: 'Bridge from Ethereum, Solana, and Avalanche directly into Sui swaps in one flow.',
    glow: 'rgba(251,146,60,0.35)',
    border: 'rgba(251,146,60,0.6)',
  },
  {
    icon: '📈',
    title: 'Analytics',
    desc: 'Real-time charts, portfolio tracking, and DEX-level breakdown for every trade.',
    glow: 'rgba(192,132,252,0.35)',
    border: 'rgba(192,132,252,0.6)',
  },
  {
    icon: '🚀',
    title: 'Token Launch',
    desc: 'Deploy verified Sui coins in minutes with built-in liquidity bootstrapping.',
    glow: 'rgba(251,191,36,0.35)',
    border: 'rgba(251,191,36,0.6)',
  },
] as const

const PROTOCOL_STATS = [
  { label: 'Total Value Locked', value: '$124M' },
  { label: 'Daily Active Users', value: '8,400+' },
  { label: 'Transactions', value: '2.1M+' },
  { label: 'Avg Price Improvement', value: '0.3%' },
] as const

const GRANT_CARDS = [
  {
    audience: 'For Traders',
    color: COLORS.primary,
    glow: 'rgba(99,102,241,0.25)',
    points: [
      'Best rates across every Sui DEX',
      'Gasless swaps via fee abstraction',
      'MEV protection on every order',
      'Multi-hop & split-route execution',
    ],
  },
  {
    audience: 'For LPs',
    color: COLORS.accent,
    glow: 'rgba(6,182,212,0.25)',
    points: [
      'Provide liquidity to Cetus & Turbos in one UI',
      'Unified position dashboard',
      'Auto-compound fee earnings',
      'IL analytics and range suggestions',
    ],
  },
  {
    audience: 'For Builders',
    color: '#A78BFA',
    glow: 'rgba(167,139,250,0.25)',
    points: [
      'Open REST & WebSocket API',
      'Composable Programmable Transaction Blocks',
      'On-chain quoter contract',
      'SDK with TypeScript typings',
    ],
  },
] as const

// ─── Animation variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

// ─── Section wrapper with scroll trigger ─────────────────────────────────────

function InViewSection({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Blob background ──────────────────────────────────────────────────────────

function BlobBackground() {
  return (
    <>
      <style>{`
        @keyframes blob1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.12); }
          66% { transform: translate(-30px, 30px) scale(0.88); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-50px, 40px) scale(0.92); }
          66% { transform: translate(35px, -25px) scale(1.08); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(20px, -40px) scale(1.1); }
        }
        .blob1 { animation: blob1 9s ease-in-out infinite; }
        .blob2 { animation: blob2 11s ease-in-out infinite; animation-delay: 2s; }
        .blob3 { animation: blob3 13s ease-in-out infinite; animation-delay: 4s; }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track { animation: marquee 28s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>

      {/* Blob 1 — indigo top-left */}
      <div
        className="blob1 pointer-events-none absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)',
          filter: 'blur(72px)',
        }}
      />
      {/* Blob 2 — cyan top-right */}
      <div
        className="blob2 pointer-events-none absolute right-1/5 top-24 h-[480px] w-[480px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
          filter: 'blur(72px)',
        }}
      />
      {/* Blob 3 — purple center */}
      <div
        className="blob3 pointer-events-none absolute left-1/2 top-[700px] h-[400px] w-[700px] -translate-x-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />

      {/* Dot-grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(99,102,241,0.07) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
        }}
      />
    </>
  )
}

// ─── Hero section ─────────────────────────────────────────────────────────────

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef, { once: true })

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-16 text-center"
    >
      <BlobBackground />

      <div className="relative z-10 flex flex-col items-center">
        {/* Live badge */}
        <motion.div
          variants={fadeUp}
          custom={0}
          initial="hidden"
          animate="visible"
          className="mb-8 inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium"
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#818CF8',
          }}
        >
          <span
            className="h-2 w-2 animate-pulse rounded-full"
            style={{ background: '#34D399' }}
          />
          Now live on Sui Mainnet
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="visible"
          className="mb-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl md:text-8xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 40%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            The Liquidity Layer
          </span>
          <br />
          <span style={{ color: COLORS.text }}>for Sui</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="visible"
          className="mb-10 max-w-2xl text-lg leading-relaxed sm:text-xl"
          style={{ color: COLORS.sub }}
        >
          OmniWeave aggregates every DEX on Sui into a single interface. Best
          prices, split routes, MEV protection, and cross-chain bridges &mdash; all
          in one place.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={fadeUp}
          custom={3}
          initial="hidden"
          animate="visible"
          className="mb-16 flex flex-wrap justify-center gap-4"
        >
          <Link
            href="/swap"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white transition-all duration-200 hover:scale-105 hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
              boxShadow: '0 0 32px rgba(99,102,241,0.45), 0 4px 24px rgba(0,0,0,0.4)',
            }}
          >
            Launch App
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold transition-all duration-200 hover:scale-105"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: COLORS.sub,
            }}
          >
            Read Docs
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </Link>
        </motion.div>

        {/* Stats row — count-up */}
        <div ref={statsRef} className="flex flex-wrap justify-center gap-8 md:gap-16">
          {HERO_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              custom={4 + i}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center"
            >
              <div
                className="mb-1 text-3xl font-extrabold sm:text-4xl"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                <StatCounter
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  value={stat.value}
                  decimals={stat.decimals}
                  inView={statsInView}
                />
              </div>
              <div className="text-sm" style={{ color: COLORS.muted }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(99,102,241,0.5)"
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </motion.div>
    </section>
  )
}

// ─── Marquee strip ────────────────────────────────────────────────────────────

function MarqueeStrip() {
  const items = [...DEX_LIST, ...DEX_LIST] // duplicate for seamless loop

  return (
    <section
      style={{
        background: 'rgba(13,13,31,0.7)',
        borderTop: '1px solid rgba(99,102,241,0.15)',
        borderBottom: '1px solid rgba(99,102,241,0.15)',
      }}
      className="overflow-hidden py-5"
    >
      <div className="marquee-track flex w-max items-center gap-12 px-8">
        {items.map((dex, i) => (
          <div key={`${dex.name}-${i}`} className="flex items-center gap-2.5 whitespace-nowrap">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <circle
                cx="5"
                cy="5"
                r="5"
                fill={dex.color}
                opacity={'soon' in dex && dex.soon ? 0.4 : 1}
              />
            </svg>
            <span
              className="text-sm font-semibold"
              style={{
                color: 'soon' in dex && dex.soon ? COLORS.muted : COLORS.sub,
                opacity: 'soon' in dex && dex.soon ? 0.55 : 1,
              }}
            >
              {dex.name}
              {'soon' in dex && dex.soon && (
                <span
                  className="ml-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    color: '#818CF8',
                    border: '1px solid rgba(99,102,241,0.25)',
                  }}
                >
                  soon
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  return (
    <section className="px-4 py-28">
      <div className="mx-auto max-w-5xl">
        <InViewSection className="mb-16 flex flex-col items-center text-center">
          <motion.p
            variants={fadeUp}
            custom={0}
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: COLORS.accent }}
          >
            How it works
          </motion.p>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-4xl font-extrabold tracking-tight md:text-5xl"
            style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
          >
            Smart Routing in{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              3 Steps
            </span>
          </motion.h2>
        </InViewSection>

        <InViewSection className="grid gap-8 md:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div
              key={step.num}
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative flex flex-col items-center rounded-2xl p-8 text-center"
              style={{
                background: COLORS.cardBg,
                border: `1px solid ${COLORS.cardBorder}`,
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Connector line */}
              {i < 2 && (
                <div
                  className="absolute right-0 top-12 hidden h-px w-8 translate-x-full md:block"
                  style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.4), rgba(6,182,212,0.4))' }}
                />
              )}

              {/* Step number circle */}
              <div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-full text-xl font-extrabold text-white"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                  boxShadow: '0 0 28px rgba(99,102,241,0.45)',
                }}
              >
                {step.num}
              </div>
              <h3
                className="mb-3 text-lg font-bold"
                style={{ color: COLORS.text }}
              >
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: COLORS.muted }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </InViewSection>
      </div>
    </section>
  )
}

// ─── Feature Cards ────────────────────────────────────────────────────────────

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[number]
  index: number
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative flex flex-col rounded-2xl p-6 transition-all duration-300"
      style={{
        background: COLORS.cardBg,
        border: `1px solid ${hovered ? feature.border : COLORS.cardBorder}`,
        boxShadow: hovered ? `0 0 32px ${feature.glow}` : 'none',
        backdropFilter: 'blur(20px)',
        cursor: 'default',
      }}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background: `radial-gradient(ellipse at 50% 0%, ${feature.glow} 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      <div
        className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
        style={{
          background: `rgba(${feature.glow
            .replace('rgba(', '')
            .replace('0.35)', '0.15)')}`,
          border: `1px solid ${feature.glow.replace('0.35)', '0.25)')}`,
        }}
      >
        {feature.icon}
      </div>
      <h3 className="relative mb-2 text-base font-bold" style={{ color: COLORS.text }}>
        {feature.title}
      </h3>
      <p className="relative text-sm leading-relaxed" style={{ color: COLORS.muted }}>
        {feature.desc}
      </p>
    </motion.div>
  )
}

function FeaturesSection() {
  return (
    <section
      className="px-4 py-28"
      style={{ background: 'rgba(13,13,31,0.5)' }}
    >
      <div className="mx-auto max-w-6xl">
        <InViewSection className="mb-16 flex flex-col items-center text-center">
          <motion.p
            variants={fadeUp}
            custom={0}
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: COLORS.primary }}
          >
            Built different
          </motion.p>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl"
            style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
          >
            Everything you need,{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              nothing you don&apos;t
            </span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={2}
            className="max-w-lg text-base"
            style={{ color: COLORS.muted }}
          >
            Every trade is automatically optimised across all available liquidity
            sources so you never leave money on the table.
          </motion.p>
        </InViewSection>

        <InViewSection className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </InViewSection>
      </div>
    </section>
  )
}

// ─── Protocol Stats ───────────────────────────────────────────────────────────

function ProtocolStatsSection() {
  return (
    <section className="px-4 py-28">
      <div className="mx-auto max-w-5xl">
        <InViewSection>
          <motion.div
            variants={fadeUp}
            custom={0}
            className="relative overflow-hidden rounded-3xl p-8 sm:p-12"
            style={{
              background: 'rgba(13,13,31,0.9)',
              border: '1px solid rgba(99,102,241,0.25)',
              backdropFilter: 'blur(32px)',
              boxShadow: '0 0 60px rgba(99,102,241,0.12)',
            }}
          >
            {/* Glow top */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)',
              }}
            />

            <div className="relative text-center mb-10">
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-widest"
                style={{ color: COLORS.accent }}
              >
                Protocol metrics
              </p>
              <h2
                className="mb-3 text-3xl font-extrabold tracking-tight md:text-4xl"
                style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
              >
                Built to Last
              </h2>
              <p className="mx-auto max-w-lg text-sm" style={{ color: COLORS.muted }}>
                OmniWeave is designed for institutional-grade reliability on Sui mainnet.
              </p>
            </div>

            <div className="relative grid grid-cols-2 gap-8 md:grid-cols-4">
              {PROTOCOL_STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  variants={fadeUp}
                  custom={i + 1}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className="mb-1 text-3xl font-extrabold sm:text-4xl"
                    style={{
                      background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {s.value}
                  </div>
                  <div className="text-xs font-medium" style={{ color: COLORS.muted }}>
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </InViewSection>
      </div>
    </section>
  )
}

// ─── Why OmniWeave / Grant pitch ─────────────────────────────────────────────

function WhySection() {
  return (
    <section
      className="px-4 py-28"
      style={{ background: 'rgba(13,13,31,0.5)' }}
    >
      <div className="mx-auto max-w-5xl">
        <InViewSection className="mb-16 flex flex-col items-center text-center">
          <motion.p
            variants={fadeUp}
            custom={0}
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: COLORS.primary }}
          >
            Why OmniWeave?
          </motion.p>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-4xl font-extrabold tracking-tight md:text-5xl"
            style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
          >
            One platform,{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              every use case
            </span>
          </motion.h2>
        </InViewSection>

        <InViewSection className="grid gap-6 md:grid-cols-3">
          {GRANT_CARDS.map((card, i) => (
            <motion.div
              key={card.audience}
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="flex flex-col rounded-2xl p-8"
              style={{
                background: COLORS.cardBg,
                border: `1px solid rgba(${card.color
                  .replace('#', '')
                  .match(/.{2}/g)
                  ?.map((x) => parseInt(x, 16))
                  .join(',')},0.2)`,
                backdropFilter: 'blur(20px)',
                cursor: 'default',
              }}
            >
              <div
                className="mb-2 text-xs font-bold uppercase tracking-widest"
                style={{ color: card.color }}
              >
                {card.audience}
              </div>
              <div
                className="mb-6 h-0.5 w-8 rounded-full"
                style={{ background: card.color }}
              />
              <ul className="flex flex-col gap-3">
                {card.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <circle cx="8" cy="8" r="8" fill={card.color} opacity="0.15" />
                      <path
                        d="M5 8l2 2 4-4"
                        stroke={card.color}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span style={{ color: COLORS.sub }}>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </InViewSection>
      </div>
    </section>
  )
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="px-4 py-28">
      <div className="mx-auto max-w-4xl">
        <InViewSection>
          <motion.div
            variants={fadeUp}
            custom={0}
            className="relative overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-16"
            style={{
              background:
                'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(6,182,212,0.12) 100%)',
              border: '1px solid rgba(99,102,241,0.3)',
              boxShadow: '0 0 80px rgba(99,102,241,0.15)',
            }}
          >
            {/* Top glow */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.25) 0%, transparent 70%)',
              }}
            />

            {/* Decorative circles */}
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
            <div
              className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />

            <div className="relative">
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl"
                style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
              >
                Ready to trade on Sui?
              </motion.h2>
              <motion.p
                variants={fadeUp}
                custom={2}
                className="mx-auto mb-10 max-w-lg text-lg"
                style={{ color: COLORS.sub }}
              >
                Join thousands of traders already getting the best rates on every
                swap. No account needed &mdash; just connect your wallet.
              </motion.p>
              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-wrap justify-center gap-4"
              >
                <Link
                  href="/swap"
                  className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white transition-all duration-200 hover:scale-105 hover:brightness-110"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
                    boxShadow: '0 0 32px rgba(99,102,241,0.5)',
                  }}
                >
                  Launch App
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <a
                  href="https://github.com/omniweave"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-bold transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    color: COLORS.sub,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58l-.01-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.08 1.84 2.82 1.31 3.51 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22l-.01 3.29c0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              </motion.div>
            </div>
          </motion.div>
        </InViewSection>
      </div>
    </section>
  )
}

// ─── Page footer ──────────────────────────────────────────────────────────────

function PageFooter() {
  const NAV_LINKS = [
    { label: 'Swap', href: '/swap' },
    { label: 'Explore', href: '/analytics' },
    { label: 'Pools', href: '/pools' },
    { label: 'Bridge', href: '/bridge' },
    { label: 'Docs', href: '/docs' },
    { label: 'GitHub', href: 'https://github.com/omniweave', external: true },
  ] as const

  return (
    <footer
      className="px-4 py-12"
      style={{ borderTop: '1px solid rgba(99,102,241,0.12)' }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <div className="flex items-center gap-2.5">
              <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="pg-hex-left" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#818CF8" />
                  </linearGradient>
                  <linearGradient id="pg-hex-right" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#0EA5E9" />
                  </linearGradient>
                </defs>
                <polygon
                  points="10,2 20,2 25,11 20,20 10,20 5,11"
                  fill="url(#pg-hex-left)"
                  opacity="0.9"
                />
                <polygon
                  points="16,16 26,16 31,25 26,34 16,34 11,25"
                  fill="url(#pg-hex-right)"
                  opacity="0.9"
                />
              </svg>
              <span
                className="text-lg font-extrabold tracking-tight"
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
            <p className="max-w-xs text-xs" style={{ color: COLORS.muted }}>
              The ultimate liquidity layer on Sui &mdash; aggregating every DEX into
              a single interface for the best rates, split routes, and MEV
              protection.
            </p>
          </div>

          {/* Nav links */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-1 md:justify-end">
              {NAV_LINKS.map(({ label, href, ...rest }) => {
                const external = 'external' in rest && rest.external
                return (
                  <li key={label}>
                    {external ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-white/5"
                        style={{ color: COLORS.muted }}
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-white/5"
                        style={{ color: COLORS.muted }}
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="relative overflow-x-hidden" style={{ background: COLORS.bg }}>
      <HeroSection />
      <MarqueeStrip />
      <HowItWorksSection />
      <FeaturesSection />
      <ProtocolStatsSection />
      <WhySection />
      <CTABanner />
      <PageFooter />
    </div>
  )
}

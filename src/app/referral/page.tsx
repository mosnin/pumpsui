'use client'

import { Suspense, useState } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { Users, DollarSign, BarChart2, Gift, ExternalLink, TrendingUp } from 'lucide-react'
import { ReferralCard } from '@/components/referral/ReferralCard'
import { useReferral } from '@/hooks/useReferral'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReferredUser {
  address: string
  joinedAt: string
  volume: number
  feesGenerated: number
  yourEarnings: number
}

interface EarningEntry {
  date: string
  amount: number
  fromAddress: string
  txHash: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_REFERRED: ReferredUser[] = [
  { address: '0x7b2c…5b4a', joinedAt: '2d ago',  volume: 48_200,  feesGenerated: 144.60,  yourEarnings: 28.92 },
  { address: '0xa1d3…f3e2', joinedAt: '4d ago',  volume: 21_800,  feesGenerated: 65.40,   yourEarnings: 13.08 },
  { address: '0x2e9f…a2f1', joinedAt: '6d ago',  volume: 93_500,  feesGenerated: 280.50,  yourEarnings: 56.10 },
  { address: '0xd4b7…8d7c', joinedAt: '8d ago',  volume: 12_100,  feesGenerated: 36.30,   yourEarnings: 7.26  },
  { address: '0x5c3a…b8a7', joinedAt: '12d ago', volume: 5_400,   feesGenerated: 16.20,   yourEarnings: 3.24  },
]

const MOCK_EARNINGS: EarningEntry[] = [
  { date: 'Today',     amount: 18.42,  fromAddress: '0x7b2c…5b4a', txHash: '0x1a2b3c' },
  { date: 'Yesterday', amount: 10.50,  fromAddress: '0x2e9f…a2f1', txHash: '0x4d5e6f' },
  { date: 'Yesterday', amount: 24.80,  fromAddress: '0x2e9f…a2f1', txHash: '0x7a8b9c' },
  { date: 'May 5',     amount: 5.26,   fromAddress: '0xa1d3…f3e2', txHash: '0xd0e1f2' },
  { date: 'May 4',     amount: 7.80,   fromAddress: '0xd4b7…8d7c', txHash: '0x3f4a5b' },
  { date: 'May 3',     amount: 3.24,   fromAddress: '0x5c3a…b8a7', txHash: '0x6c7d8e' },
  { date: 'May 2',     amount: 38.58,  fromAddress: '0x2e9f…a2f1', txHash: '0x9f0a1b' },
]

// ─── Formatting ───────────────────────────────────────────────────────────────

function fmtUSD(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toFixed(2)}`
}

// ─── Stats card ───────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'rgba(13, 13, 31, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.15)', color: accent ?? '#6366F1' }}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold mb-1" style={{ color: '#E2E8F0' }}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

// ─── Connect CTA ─────────────────────────────────────────────────────────────

function ConnectCTA() {
  return (
    <div
      className="rounded-2xl flex flex-col items-center justify-center py-24 px-8 text-center"
      style={{
        background: 'rgba(13, 13, 31, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          color: '#6366F1',
        }}
      >
        <Gift size={36} />
      </div>
      <h2 className="text-2xl font-bold mb-3" style={{ color: '#E2E8F0' }}>
        Connect Wallet to Start Earning
      </h2>
      <p className="text-slate-400 max-w-sm mb-4 text-sm leading-relaxed">
        Share your unique referral link and earn{' '}
        <span className="font-semibold text-indigo-300">20% of protocol fees</span> from every swap
        your referrals make — forever.
      </p>
      <div
        className="flex flex-col sm:flex-row gap-4 text-sm text-slate-400 mb-8 p-4 rounded-xl"
        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-indigo-400">1.</span> Share your referral link
        </div>
        <div className="flex items-center gap-2">
          <span className="text-indigo-400">2.</span> Friend swaps on OmniWeave
        </div>
        <div className="flex items-center gap-2">
          <span className="text-indigo-400">3.</span> You earn 20% of their fees
        </div>
      </div>
      <button
        className="px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
          color: '#fff',
        }}
      >
        Connect Wallet
      </button>
    </div>
  )
}

// ─── Inner page (wallet connected) ───────────────────────────────────────────

function ReferralPageInner({ address }: { address: string }) {
  const [activeTab, setActiveTab] = useState<'users' | 'earnings'>('users')
  const referralLink = `https://omniweave.xyz/swap?ref=${address}`

  const totalReferred = MOCK_REFERRED.length
  const totalVolume = MOCK_REFERRED.reduce((s, u) => s + u.volume, 0)
  const totalEarnings = MOCK_REFERRED.reduce((s, u) => s + u.yourEarnings, 0)
  const pendingEarnings = totalEarnings * 0.31 // mock pending

  return (
    <div className="flex flex-col gap-8">

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={15} />}
          label="Referred Users"
          value={totalReferred.toString()}
          sub="Active traders"
          accent="#6366F1"
        />
        <StatCard
          icon={<BarChart2 size={15} />}
          label="Volume Referred"
          value={fmtUSD(totalVolume)}
          sub="All-time"
          accent="#06B6D4"
        />
        <StatCard
          icon={<DollarSign size={15} />}
          label="Fees Earned"
          value={fmtUSD(totalEarnings)}
          sub="20% of protocol fees"
          accent="#10B981"
        />
        <StatCard
          icon={<TrendingUp size={15} />}
          label="Pending Earnings"
          value={fmtUSD(pendingEarnings)}
          sub="Next distribution: 3d"
          accent="#F59E0B"
        />
      </div>

      {/* Referral card */}
      <ReferralCard referralLink={referralLink} />

      {/* How it works */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'rgba(13, 13, 31, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
        }}
      >
        <h3 className="font-semibold text-base mb-4" style={{ color: '#E2E8F0' }}>
          How the Referral Program Works
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              title: 'Share Your Link',
              desc: 'Send your unique referral URL to friends, on Twitter, or in DeFi communities.',
              color: '#6366F1',
            },
            {
              step: '02',
              title: 'They Swap',
              desc: 'When they visit via your link, their wallet is linked to yours. Every swap they make counts.',
              color: '#06B6D4',
            },
            {
              step: '03',
              title: 'You Earn',
              desc: '20% of every protocol fee they generate flows directly to your wallet. No expiry.',
              color: '#10B981',
            },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="flex gap-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: `${color}22`, color }}
              >
                {step}
              </div>
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: '#E2E8F0' }}>
                  {title}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referred users + earnings tabs */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(13, 13, 31, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
        }}
      >
        {/* Tab header */}
        <div
          className="px-6 py-4 flex items-center gap-2 border-b"
          style={{ borderColor: 'rgba(99,102,241,0.15)' }}
        >
          {(['users', 'earnings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-all"
              style={
                activeTab === tab
                  ? { background: '#6366F1', color: '#fff' }
                  : { background: 'rgba(99,102,241,0.1)', color: '#94A3B8' }
              }
            >
              {tab === 'users' ? 'Referred Users' : 'Earnings History'}
            </button>
          ))}
        </div>

        {/* Referred users table */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                  {['Wallet', 'Joined', 'Their Volume', 'Fees Generated', 'Your Earnings'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 ${
                        i === 0 || i === 1 ? 'text-left' : 'text-right'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_REFERRED.map((user, i) => (
                  <tr
                    key={user.address}
                    className="hover:bg-white/[0.025] transition-colors"
                    style={{
                      borderBottom:
                        i < MOCK_REFERRED.length - 1 ? '1px solid rgba(99,102,241,0.07)' : 'none',
                    }}
                  >
                    <td className="px-5 py-3.5 font-mono text-sm" style={{ color: '#A5B4FC' }}>
                      {user.address}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{user.joinedAt}</td>
                    <td className="px-5 py-3.5 text-right font-mono" style={{ color: '#E2E8F0' }}>
                      {fmtUSD(user.volume)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-400">
                      {fmtUSD(user.feesGenerated)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold font-mono text-emerald-400">
                      +{fmtUSD(user.yourEarnings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Earnings history */}
        {activeTab === 'earnings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                  {['Date', 'From', 'Amount', 'Tx'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 ${
                        i < 2 ? 'text-left' : i === 2 ? 'text-right' : 'text-center'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_EARNINGS.map((entry, i) => (
                  <tr
                    key={entry.txHash}
                    className="hover:bg-white/[0.025] transition-colors"
                    style={{
                      borderBottom:
                        i < MOCK_EARNINGS.length - 1 ? '1px solid rgba(99,102,241,0.07)' : 'none',
                    }}
                  >
                    <td className="px-5 py-3.5 text-xs text-slate-500">{entry.date}</td>
                    <td className="px-5 py-3.5 font-mono text-sm" style={{ color: '#A5B4FC' }}>
                      {entry.fromAddress}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold font-mono text-emerald-400">
                      +{fmtUSD(entry.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <a
                        href={`https://suiexplorer.com/txblock/${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {entry.txHash.slice(0, 10)}…
                        <ExternalLink size={11} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page wrapper (handles referral capture + wallet gate) ────────────────────

function ReferralPageContent() {
  // Capture any incoming ?ref= param
  useReferral()

  const account = useCurrentAccount()
  const address = account?.address ?? null

  return (
    <div className="min-h-screen font-sans" style={{ background: '#060611', color: '#E2E8F0' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.2)', color: '#6366F1' }}
          >
            <Gift size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#E2E8F0' }}>
              Referral Program
            </h1>
            <p className="text-slate-400 text-sm">
              Earn 20% of fees from every swap your referrals make
            </p>
          </div>
        </div>

        {address ? (
          <ReferralPageInner address={address} />
        ) : (
          <ConnectCTA />
        )}
      </div>
    </div>
  )
}

export default function ReferralPage() {
  return (
    <Suspense>
      <ReferralPageContent />
    </Suspense>
  )
}

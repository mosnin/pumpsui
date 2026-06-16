'use client'

import { useState } from 'react'
import { Compass } from 'lucide-react'
import { TokensTable } from '@/components/explore/TokensTable'
import { PoolsTable } from '@/components/explore/PoolsTable'
import { TransactionsTable } from '@/components/explore/TransactionsTable'
import { SearchBar } from '@/components/explore/SearchBar'
import {
  generateTokenRows,
  generatePoolRows,
  generateTransactions,
} from '@/lib/explore'
import { PageTransition } from '@/components/layout/PageTransition'

// ─── Static data (generated once at module level, stable across renders) ───────

const TOKEN_ROWS = generateTokenRows()
const POOL_ROWS = generatePoolRows()
const TRANSACTIONS = generateTransactions()

// ─── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'tokens' | 'pools' | 'transactions'

const TABS: { key: Tab; label: string }[] = [
  { key: 'tokens',       label: 'Tokens'       },
  { key: 'pools',        label: 'Pools'        },
  { key: 'transactions', label: 'Transactions' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<Tab>('tokens')

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: '#060611', color: '#E2E8F0' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.2)', color: '#6366F1' }}
            >
              <Compass size={18} aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#E2E8F0' }}>
              Explore
            </h1>
          </div>
          <p className="text-slate-400 text-sm ml-11">
            Discover tokens, liquidity pools, and live transactions across Sui DEXes
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <SearchBar />
        </div>

        {/* Tab bar + content card */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(13,13,31,0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          {/* Tab strip */}
          <div
            className="flex items-center gap-1 px-4 pt-4 pb-0 border-b"
            style={{ borderColor: 'rgba(99,102,241,0.15)' }}
          >
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all relative"
                style={
                  activeTab === key
                    ? { color: '#E2E8F0', background: 'rgba(99,102,241,0.12)' }
                    : { color: '#64748b' }
                }
              >
                {label}
                {activeTab === key && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg,#6366F1,#06B6D4)' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'tokens'       && <TokensTable rows={TOKEN_ROWS} />}
            {activeTab === 'pools'        && <PoolsTable rows={POOL_ROWS} />}
            {activeTab === 'transactions' && <TransactionsTable initialRows={TRANSACTIONS} />}
          </div>
        </div>
      </div>
    </div>
  )
}

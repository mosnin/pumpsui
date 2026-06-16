'use client'

import { useState, useMemo } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useNFTs } from '@/hooks/useNFTs'
import { NFTCollection } from '@/components/nft/NFTCollection'
import { NFTPerkBanner } from '@/components/nft/NFTPerkBanner'
import type { SuiNFT } from '@/lib/nft'

// ─── View toggle ──────────────────────────────────────────────────────────────

function ViewToggle({
  view,
  onChange,
}: {
  view: 'grid' | 'list'
  onChange: (v: 'grid' | 'list') => void
}) {
  return (
    <div className="flex rounded-lg border border-[#2A2A5A] overflow-hidden" role="group" aria-label="View mode">
      <button
        onClick={() => onChange('grid')}
        aria-pressed={view === 'grid'}
        aria-label="Grid view"
        className={[
          'flex items-center justify-center w-9 h-9 transition-colors',
          view === 'grid'
            ? 'bg-indigo-500/20 text-indigo-300'
            : 'bg-transparent text-slate-500 hover:text-slate-300',
        ].join(' ')}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="1" />
          <rect x="13" y="3" width="8" height="8" rx="1" />
          <rect x="3" y="13" width="8" height="8" rx="1" />
          <rect x="13" y="13" width="8" height="8" rx="1" />
        </svg>
      </button>
      <button
        onClick={() => onChange('list')}
        aria-pressed={view === 'list'}
        aria-label="List view"
        className={[
          'flex items-center justify-center w-9 h-9 transition-colors',
          view === 'list'
            ? 'bg-indigo-500/20 text-indigo-300'
            : 'bg-transparent text-slate-500 hover:text-slate-300',
        ].join(' ')}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </div>
  )
}

// ─── Filter select ────────────────────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="rounded-lg border border-[#2A2A5A] bg-[#161630] px-3 py-2 text-sm text-slate-300 focus:border-indigo-500/60 focus:outline-none cursor-pointer transition-colors hover:border-indigo-500/40"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ─── Connect prompt ───────────────────────────────────────────────────────────

function ConnectPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.08))' }}
        aria-hidden="true"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <div>
        <p className="text-lg font-semibold text-slate-200 mb-2">Connect your wallet</p>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          Connect your Sui wallet to view your NFTs and unlock holder perks.
        </p>
      </div>
    </div>
  )
}

// ─── Sorting & filtering helpers ──────────────────────────────────────────────

const RARITY_ORDER: Record<string, number> = {
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
}

function applyFiltersAndSort(
  nfts: SuiNFT[],
  filterRarity: string,
  sortBy: string,
): SuiNFT[] {
  let result = [...nfts]

  if (filterRarity !== 'all') {
    result = result.filter((n) => n.rarity === filterRarity)
  }

  switch (sortBy) {
    case 'value_desc':
      result.sort((a, b) => (b.estimatedValueSui ?? 0) - (a.estimatedValueSui ?? 0))
      break
    case 'value_asc':
      result.sort((a, b) => (a.estimatedValueSui ?? 0) - (b.estimatedValueSui ?? 0))
      break
    case 'rarity':
      result.sort(
        (a, b) =>
          (RARITY_ORDER[b.rarity ?? ''] ?? 0) - (RARITY_ORDER[a.rarity ?? ''] ?? 0),
      )
      break
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name))
      break
    default:
      break
  }

  return result
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NFTPage() {
  const account = useCurrentAccount()
  const { nfts, isLoading, perk } = useNFTs()

  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filterRarity, setFilterRarity] = useState('all')
  const [sortBy, setSortBy] = useState('value_desc')

  const filteredNfts = useMemo(
    () => applyFiltersAndSort(nfts, filterRarity, sortBy),
    [nfts, filterRarity, sortBy],
  )

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span aria-hidden="true">🖼</span> My NFTs
            {!isLoading && account && (
              <span className="text-base font-medium text-slate-500 ml-1">
                [{nfts.length} NFT{nfts.length !== 1 ? 's' : ''}]
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View your Sui NFTs and unlock holder perks on every swap
          </p>
        </div>
      </div>

      {/* Connect prompt */}
      {!account && <ConnectPrompt />}

      {account && (
        <div className="space-y-6">
          {/* Perk banner */}
          {perk.hasNFT && (
            <NFTPerkBanner label={perk.label} feeDiscount={perk.feeDiscount} />
          )}

          {/* Filters + view toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect
              label="Filter by rarity"
              value={filterRarity}
              onChange={setFilterRarity}
              options={[
                { value: 'all', label: 'All Rarities' },
                { value: 'legendary', label: 'Legendary' },
                { value: 'epic', label: 'Epic' },
                { value: 'rare', label: 'Rare' },
                { value: 'uncommon', label: 'Uncommon' },
                { value: 'common', label: 'Common' },
              ]}
            />
            <FilterSelect
              label="Sort by"
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'value_desc', label: 'Highest Value' },
                { value: 'value_asc', label: 'Lowest Value' },
                { value: 'rarity', label: 'Rarity' },
                { value: 'name', label: 'Name' },
              ]}
            />
            <div className="ml-auto">
              <ViewToggle view={view} onChange={setView} />
            </div>
          </div>

          {/* Gallery */}
          <NFTCollection nfts={filteredNfts} isLoading={isLoading} view={view} />
        </div>
      )}
    </main>
  )
}

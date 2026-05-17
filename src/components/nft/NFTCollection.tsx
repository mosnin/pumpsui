'use client'

import Link from 'next/link'
import type { SuiNFT } from '@/lib/nft'
import { NFTCard, NFTListRow } from '@/components/nft/NFTCard'

// ─── Skeleton cards ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#161630] to-[#0D0D1F] border border-[#2A2A5A] animate-pulse">
      <div className="aspect-square w-full bg-[#1E1E45]/60" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3.5 w-3/4 rounded bg-[#2A2A5A]" />
        <div className="h-3 w-1/2 rounded bg-[#1E1E45]" />
        <div className="h-5 w-1/3 rounded-full bg-[#1E1E45]" />
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <tr className="border-b border-[#2A2A5A]/50 animate-pulse">
      <td className="py-3 pl-4 pr-3"><div className="w-10 h-10 rounded-lg bg-[#1E1E45]" /></td>
      <td className="py-3 pr-4"><div className="h-3.5 w-28 rounded bg-[#2A2A5A]" /></td>
      <td className="py-3 pr-4 hidden sm:table-cell"><div className="h-3 w-20 rounded bg-[#1E1E45]" /></td>
      <td className="py-3 pr-4 hidden md:table-cell"><div className="h-5 w-16 rounded-full bg-[#1E1E45]" /></td>
      <td className="py-3 pr-4 text-right"><div className="h-3 w-14 ml-auto rounded bg-[#1E1E45]" /></td>
    </tr>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.08))' }}
        aria-hidden="true"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
      <div>
        <p className="text-lg font-semibold text-slate-200 mb-1">No NFTs found</p>
        <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
          Connect your wallet or explore popular Sui NFT marketplaces to get started.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="https://clutchy.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#2A2A5A] bg-[#161630] px-4 py-2 text-sm font-medium text-slate-300 hover:border-indigo-500/50 hover:text-slate-100 transition-all"
          >
            <span aria-hidden="true">🛒</span> Clutchy
          </Link>
          <Link
            href="https://www.tradeport.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#2A2A5A] bg-[#161630] px-4 py-2 text-sm font-medium text-slate-300 hover:border-indigo-500/50 hover:text-slate-100 transition-all"
          >
            <span aria-hidden="true">🖼</span> TradePort
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── NFTCollection ────────────────────────────────────────────────────────────

interface NFTCollectionProps {
  nfts: SuiNFT[]
  isLoading: boolean
  view: 'grid' | 'list'
}

export function NFTCollection({ nfts, isLoading, view }: NFTCollectionProps) {
  if (view === 'list') {
    return (
      <div className="overflow-x-auto rounded-2xl border border-[#2A2A5A] bg-gradient-to-br from-[#161630] to-[#0D0D1F]">
        <table className="w-full text-left" aria-label="NFT collection list">
          <thead>
            <tr
              className="text-xs text-slate-500 uppercase tracking-wider"
              style={{ borderBottom: '1px solid rgba(42,42,90,0.8)' }}
            >
              <th scope="col" className="py-3 pl-4 pr-3 font-medium">Image</th>
              <th scope="col" className="py-3 pr-4 font-medium">Name</th>
              <th scope="col" className="py-3 pr-4 font-medium hidden sm:table-cell">Collection</th>
              <th scope="col" className="py-3 pr-4 font-medium hidden md:table-cell">Rarity</th>
              <th scope="col" className="py-3 pr-4 font-medium text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonList key={i} />)
              : nfts.length === 0
                ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState />
                    </td>
                  </tr>
                )
                : nfts.map((nft) => <NFTListRow key={nft.objectId} nft={nft} />)
            }
          </tbody>
        </table>
      </div>
    )
  }

  // Grid view
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" aria-label="NFT gallery loading">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (nfts.length === 0) {
    return <EmptyState />
  }

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
      aria-label="NFT gallery"
    >
      {nfts.map((nft) => (
        <NFTCard key={nft.objectId} nft={nft} />
      ))}
    </div>
  )
}

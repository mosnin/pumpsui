'use client'

import { useState } from 'react'
import type { SuiNFT } from '@/lib/nft'
import { objectIdToHue } from '@/lib/nft'

// ─── Rarity config ────────────────────────────────────────────────────────────

const RARITY_CONFIG = {
  legendary: {
    label: 'Legendary',
    badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    glow: 'hover:shadow-[0_0_24px_rgba(245,158,11,0.2)]',
    star: '★',
  },
  epic: {
    label: 'Epic',
    badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
    glow: 'hover:shadow-[0_0_24px_rgba(168,85,247,0.2)]',
    star: '★',
  },
  rare: {
    label: 'Rare',
    badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
    glow: 'hover:shadow-[0_0_24px_rgba(59,130,246,0.2)]',
    star: '★',
  },
  uncommon: {
    label: 'Uncommon',
    badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    glow: 'hover:shadow-[0_0_16px_rgba(16,185,129,0.15)]',
    star: '◆',
  },
  common: {
    label: 'Common',
    badge: 'bg-slate-500/20 text-slate-400 border border-slate-500/40',
    glow: '',
    star: '',
  },
} as const

// ─── Gradient placeholder ─────────────────────────────────────────────────────

function GradientPlaceholder({ objectId, name }: { objectId: string; name: string }) {
  const hue = objectIdToHue(objectId)
  const hue2 = (hue + 60) % 360

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, hsl(${hue},70%,25%) 0%, hsl(${hue2},80%,20%) 100%)`,
      }}
      aria-hidden="true"
    >
      <span
        className="text-4xl font-bold opacity-40 select-none"
        style={{ color: `hsl(${hue},90%,80%)` }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

// ─── Rarity badge ─────────────────────────────────────────────────────────────

function RarityBadge({ rarity }: { rarity: SuiNFT['rarity'] }) {
  if (!rarity) return null
  const config = RARITY_CONFIG[rarity]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${config.badge}`}>
      {config.star && <span aria-hidden="true">{config.star}</span>}
      {config.label}
    </span>
  )
}

// ─── Attributes overlay ───────────────────────────────────────────────────────

function AttributesOverlay({ attributes }: { attributes: Record<string, string> }) {
  const entries = Object.entries(attributes)
  if (entries.length === 0) return null

  return (
    <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 rounded-t-xl"
        style={{ background: 'linear-gradient(to top, rgba(6,6,17,0.95) 60%, transparent)' }}
        aria-hidden="true"
      />
      <div className="relative z-10 grid grid-cols-2 gap-1">
        {entries.slice(0, 6).map(([k, v]) => (
          <div key={k} className="rounded bg-white/10 px-1.5 py-0.5">
            <p className="text-[10px] text-slate-400 leading-none">{k}</p>
            <p className="text-[11px] font-semibold text-slate-200 truncate">{v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── NFTCard ──────────────────────────────────────────────────────────────────

interface NFTCardProps {
  nft: SuiNFT
}

export function NFTCard({ nft }: NFTCardProps) {
  const [imgError, setImgError] = useState(false)
  const rarityConfig = nft.rarity ? RARITY_CONFIG[nft.rarity] : null

  return (
    <article
      className={[
        'group relative flex flex-col rounded-2xl overflow-hidden',
        'bg-gradient-to-br from-[#161630] to-[#0D0D1F]',
        'border border-[#2A2A5A] transition-all duration-300',
        'hover:border-indigo-500/50 hover:-translate-y-0.5',
        rarityConfig?.glow ?? '',
      ].join(' ')}
      aria-label={`NFT: ${nft.name}`}
    >
      {/* Image area */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#0D0D1F]">
        {nft.imageUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={nft.imageUrl}
            alt={`NFT artwork for ${nft.name}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <GradientPlaceholder objectId={nft.objectId} name={nft.name} />
        )}

        {/* Hover attributes overlay */}
        <AttributesOverlay attributes={nft.attributes} />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3">
        <p className="text-sm font-semibold text-slate-100 truncate" title={nft.name}>
          {nft.name}
        </p>
        <p className="text-xs text-slate-400 truncate" title={nft.collection}>
          {nft.collection}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <RarityBadge rarity={nft.rarity} />
          {nft.estimatedValueSui !== undefined && (
            <span className="text-xs text-slate-400">
              ~<span className="font-semibold text-slate-200">{nft.estimatedValueSui}</span> SUI
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── NFTListRow ───────────────────────────────────────────────────────────────

interface NFTListRowProps {
  nft: SuiNFT
}

export function NFTListRow({ nft }: NFTListRowProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <tr className="border-b border-[#2A2A5A]/50 hover:bg-white/3 transition-colors">
      {/* Image */}
      <td className="py-3 pl-4 pr-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#0D0D1F]">
          {nft.imageUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={nft.imageUrl}
              alt={`Thumbnail for ${nft.name}`}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <GradientPlaceholder objectId={nft.objectId} name={nft.name} />
          )}
        </div>
      </td>
      {/* Name */}
      <td className="py-3 pr-4">
        <p className="text-sm font-medium text-slate-100">{nft.name}</p>
        <p className="text-xs text-slate-500 font-mono truncate max-w-[140px]" title={nft.objectId}>
          {nft.objectId.slice(0, 10)}…{nft.objectId.slice(-6)}
        </p>
      </td>
      {/* Collection */}
      <td className="py-3 pr-4 text-sm text-slate-300 hidden sm:table-cell">
        {nft.collection}
      </td>
      {/* Rarity */}
      <td className="py-3 pr-4 hidden md:table-cell">
        <RarityBadge rarity={nft.rarity} />
      </td>
      {/* Value */}
      <td className="py-3 pr-4 text-sm text-slate-300 text-right">
        {nft.estimatedValueSui !== undefined
          ? <span>~{nft.estimatedValueSui} <span className="text-slate-500">SUI</span></span>
          : <span className="text-slate-500">—</span>
        }
      </td>
    </tr>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { SUPPORTED_CHAINS, CHAIN_IDS } from '@/lib/bridges/types'
import type { Chain } from '@/lib/bridges/types'

interface ChainSelectorProps {
  value: number                   // selected chain ID
  onChange: (chainId: number) => void
  exclude?: number                // chain ID to exclude (e.g. the destination when picking source)
  label?: string
  className?: string
}

/** Fallback monogram when a chain logo fails to load */
function ChainMonogram({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ background: color }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}

/** A single chain logo with fallback */
function ChainLogo({ chain, size = 28 }: { chain: Chain; size?: number }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <ChainMonogram name={chain.shortName} color={chain.color} />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={chain.logoUrl}
      alt={chain.name}
      width={size}
      height={size}
      className="rounded-full flex-shrink-0 object-contain"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}

/** Modal overlay for chain selection */
function ChainModal({
  isOpen,
  onClose,
  onSelect,
  exclude,
  currentId,
}: {
  isOpen: boolean
  onClose: () => void
  onSelect: (chainId: number) => void
  exclude?: number
  currentId: number
}) {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setSearch('')
      // Focus input after paint
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const chains = SUPPORTED_CHAINS.filter((c) => {
    if (c.id === exclude) return false
    if (c.id === CHAIN_IDS.SUI) return false  // Sui is always destination in this UI
    if (!search) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
  })

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, #0d0d1f 0%, #080814 100%)',
          border: '1px solid rgba(99,102,241,0.25)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.1)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Select source chain"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}
        >
          <h2 className="text-base font-semibold text-slate-100">Select Chain</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-colors"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chains…"
              className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>

        {/* Chain grid */}
        <div className="max-h-72 overflow-y-auto px-3 pb-4 space-y-1">
          {chains.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-8">No chains match your search</p>
          ) : (
            chains.map((chain) => {
              const isSelected = chain.id === currentId
              return (
                <button
                  key={chain.id}
                  onClick={() => { onSelect(chain.id); onClose() }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                  style={{
                    background: isSelected
                      ? `${chain.color}18`
                      : 'transparent',
                    border: isSelected
                      ? `1px solid ${chain.color}40`
                      : '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <ChainLogo chain={chain} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200">{chain.name}</div>
                    <div className="text-xs text-slate-500">{chain.symbol}</div>
                  </div>
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke={chain.color} strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

/** Compact chain pill shown in the bridge form */
export function ChainSelector({ value, onChange, exclude, label, className = '' }: ChainSelectorProps) {
  const [open, setOpen] = useState(false)
  const chain = SUPPORTED_CHAINS.find((c) => c.id === value)

  return (
    <>
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && (
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        )}
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all w-full text-left"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          }}
        >
          {chain ? (
            <>
              <ChainLogo chain={chain} size={24} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-100 truncate">{chain.name}</div>
                <div className="text-xs text-slate-500">{chain.symbol}</div>
              </div>
            </>
          ) : (
            <span className="text-sm text-slate-500 flex-1">Select chain</span>
          )}
          {/* Chevron */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#64748b" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      <ChainModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSelect={onChange}
        exclude={exclude}
        currentId={value}
      />
    </>
  )
}

/** Sui destination badge — always shows Sui as the destination */
export function SuiDestinationBadge() {
  const sui = SUPPORTED_CHAINS.find((c) => c.id === CHAIN_IDS.SUI)!
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
      style={{
        background: 'rgba(111,188,240,0.08)',
        border: '1px solid rgba(111,188,240,0.25)',
      }}
    >
      <ChainLogo chain={sui} size={24} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-100">{sui.name}</div>
        <div className="text-xs text-slate-500">{sui.symbol}</div>
      </div>
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(111,188,240,0.15)', color: '#6FBCF0' }}
      >
        Destination
      </span>
    </div>
  )
}

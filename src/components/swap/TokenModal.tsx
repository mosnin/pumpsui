'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Token, SUI_TOKENS, POPULAR_TOKENS } from '@/lib/tokens'

interface TokenModalProps {
  open: boolean
  onClose: () => void
  onSelect: (token: Token) => void
  excludeAddress?: string
  balances?: Record<string, string>
}

export default function TokenModal({
  open,
  onClose,
  onSelect,
  excludeAddress,
  balances = {},
}: TokenModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = SUI_TOKENS.filter((t) => {
    if (t.address === excludeAddress) return false
    if (!query) return true
    const q = query.toLowerCase()
    return (
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q)
    )
  })

  const handleSelect = useCallback(
    (token: Token) => {
      onSelect(token)
      onClose()
    },
    [onSelect, onClose],
  )

  const handleBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={handleBackdrop}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border flex flex-col"
        style={{
          background: 'linear-gradient(135deg, #0f0f23 0%, #0a0a1a 100%)',
          borderColor: 'rgba(99,102,241,0.3)',
          maxHeight: '80vh',
          boxShadow: '0 0 60px rgba(99,102,241,0.15), 0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(99,102,241,0.15)' }}>
          <h2 className="text-lg font-semibold" style={{ color: '#E2E8F0' }}>
            Select Token
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ color: '#64748B' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.15)'
              e.currentTarget.style.color = '#E2E8F0'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#64748B'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2"
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#64748B" strokeWidth="2" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name, symbol, or address"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-150"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: '#E2E8F0',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>

        {/* Popular tokens */}
        {!query && (
          <div className="px-4 pb-3">
            <p className="text-xs mb-2" style={{ color: '#64748B' }}>Popular</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TOKENS.filter((t) => t.address !== excludeAddress).map((token) => (
                <button
                  key={token.address}
                  onClick={() => handleSelect(token)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#E2E8F0',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.15)'
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'
                  }}
                >
                  <img
                    src={token.logoURI}
                    alt={token.symbol}
                    width={16}
                    height={16}
                    className="rounded-full"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                  {token.symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="mx-4 mb-1 border-t" style={{ borderColor: 'rgba(99,102,241,0.1)' }} />

        {/* Token list */}
        <div className="overflow-y-auto flex-1 px-2 pb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.3) transparent' }}>
          {filtered.length === 0 ? (
            <div className="py-12 text-center" style={{ color: '#64748B' }}>
              <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <p className="text-sm">No tokens found</p>
            </div>
          ) : (
            filtered.map((token) => {
              const balance = balances[token.address]
              return (
                <button
                  key={token.address}
                  onClick={() => handleSelect(token)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-left"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={token.logoURI}
                      alt={token.symbol}
                      width={36}
                      height={36}
                      className="rounded-full"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                      onError={(e) => {
                        e.currentTarget.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36'><rect width='36' height='36' rx='18' fill='%23312e81'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='14' font-weight='bold'>${token.symbol[0]}</text></svg>`
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm" style={{ color: '#E2E8F0' }}>
                        {token.symbol}
                      </span>
                      {balance && (
                        <span className="text-sm font-medium" style={{ color: '#E2E8F0' }}>
                          {parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs truncate" style={{ color: '#64748B' }}>
                        {token.name}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

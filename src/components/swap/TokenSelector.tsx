'use client'

import { useCallback } from 'react'
import { Token } from '@/lib/tokens'

interface TokenSelectorProps {
  token: Token | null
  amount: string
  onAmountChange: (amount: string) => void
  onTokenClick: () => void
  usdValue?: number | null
  balance?: string | null
  onMax?: () => void
  label?: string
  readOnly?: boolean
  loading?: boolean
}

export default function TokenSelector({
  token,
  amount,
  onAmountChange,
  onTokenClick,
  usdValue,
  balance,
  onMax,
  label,
  readOnly = false,
  loading = false,
}: TokenSelectorProps) {
  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (val === '' || /^\d*\.?\d*$/.test(val)) {
        onAmountChange(val)
      }
    },
    [onAmountChange],
  )

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}
    >
      {/* Top row: label + balance */}
      <div className="flex items-center justify-between mb-2">
        {label && (
          <span className="text-xs font-medium" style={{ color: '#64748B' }}>
            {label}
          </span>
        )}
        {balance !== null && balance !== undefined && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs" style={{ color: '#64748B' }}>
              Balance: {parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })} {token?.symbol}
            </span>
            {onMax && (
              <button
                onClick={onMax}
                className="text-xs font-semibold px-1.5 py-0.5 rounded-md transition-all duration-150"
                style={{ color: '#6366F1' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.15)'
                  e.currentTarget.style.color = '#818CF8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#6366F1'
                }}
              >
                MAX
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main row: token button + amount input */}
      <div className="flex items-center gap-3">
        {/* Token selector button */}
        <button
          onClick={onTokenClick}
          className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-150 flex-shrink-0"
          style={{
            background: token ? 'rgba(99,102,241,0.12)' : 'linear-gradient(135deg, #6366F1, #06B6D4)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: '#E2E8F0',
            minWidth: '120px',
          }}
          onMouseEnter={(e) => {
            if (token) {
              e.currentTarget.style.background = 'rgba(99,102,241,0.2)'
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (token) {
              e.currentTarget.style.background = 'rgba(99,102,241,0.12)'
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'
            }
          }}
        >
          {token ? (
            <>
              <img
                src={token.logoURI}
                alt={token.symbol}
                width={22}
                height={22}
                className="rounded-full flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22'><rect width='22' height='22' rx='11' fill='%23312e81'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='11' font-weight='bold'>${token.symbol[0]}</text></svg>`
                }}
              />
              <span>{token.symbol}</span>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ color: '#64748B', flexShrink: 0 }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </>
          ) : (
            <>
              <span>Select token</span>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </>
          )}
        </button>

        {/* Amount input */}
        <div className="flex-1 text-right">
          {loading ? (
            <div className="flex items-center justify-end">
              <div
                className="h-8 w-24 rounded-lg animate-pulse"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              />
            </div>
          ) : (
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={amount}
              onChange={handleAmountChange}
              readOnly={readOnly}
              className="w-full text-right text-2xl font-semibold bg-transparent outline-none transition-all duration-150 placeholder-opacity-30"
              style={{
                color: '#E2E8F0',
                caretColor: '#6366F1',
              }}
            />
          )}
          {usdValue !== null && usdValue !== undefined && !loading && amount && parseFloat(amount) > 0 && (
            <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
              ≈ ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

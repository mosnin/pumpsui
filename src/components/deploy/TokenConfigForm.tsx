'use client'

import { useState, useEffect } from 'react'
import type { TokenConfig } from '@/lib/tokenDeployer'
import { DECIMAL_PRESETS, validateTokenConfig } from '@/lib/tokenDeployer'

// ─── Props ────────────────────────────────────────────────────────────────────

interface TokenConfigFormProps {
  config: Partial<TokenConfig>
  onChange: (config: Partial<TokenConfig>) => void
  onNext: () => void
}

// ─── Token Preview Card ───────────────────────────────────────────────────────

function TokenPreviewCard({ config }: { config: Partial<TokenConfig> }) {
  const symbol = config.symbol || 'TKN'
  const name = config.name || 'My Token'
  const hasIcon = !!config.iconUrl

  // Deterministic gradient based on symbol
  const gradients = [
    'from-indigo-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-blue-500 to-indigo-500',
  ]
  const gradientIndex = symbol.charCodeAt(0) % gradients.length
  const gradient = gradients[gradientIndex]

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'rgba(99,102,241,0.07)',
        border: '1px solid rgba(99,102,241,0.2)',
      }}
    >
      <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">
        Token Preview
      </p>
      <div className="flex items-center gap-3">
        {/* Token icon */}
        <div className="relative w-10 h-10 flex-shrink-0">
          {hasIcon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.iconUrl}
              alt={symbol}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
            >
              <span className="text-white font-bold text-sm">
                {symbol.slice(0, 2)}
              </span>
            </div>
          )}
        </div>

        {/* Token info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">{symbol}</span>
            <span className="text-xs text-slate-500 truncate">{name}</span>
          </div>
          {config.description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{config.description}</p>
          )}
        </div>

        {/* Decimals badge */}
        <div
          className="flex-shrink-0 text-xs px-2 py-1 rounded-full"
          style={{
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.25)',
            color: '#06B6D4',
          }}
        >
          {config.decimals ?? 9} dec
        </div>
      </div>

      {/* OmniWeave compatibility note */}
      <div className="mt-3 flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="text-xs text-emerald-400">Compatible with OmniWeave DEX</span>
      </div>
    </div>
  )
}

// ─── TokenConfigForm ──────────────────────────────────────────────────────────

export function TokenConfigForm({ config, onChange, onNext }: TokenConfigFormProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [touched, setTouched] = useState(false)
  const [supplyDisplay, setSupplyDisplay] = useState(
    config.initialSupply ? config.initialSupply.toLocaleString() : ''
  )

  // Validate on changes after first submit attempt
  useEffect(() => {
    if (touched) {
      setErrors(validateTokenConfig(config))
    }
  }, [config, touched])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    const errs = validateTokenConfig(config)
    setErrors(errs)
    if (errs.length === 0) {
      onNext()
    }
  }

  function handleSymbolChange(raw: string) {
    // Auto-uppercase, strip invalid chars
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
    onChange({ ...config, symbol: cleaned })
  }

  function handleSupplyChange(raw: string) {
    const digits = raw.replace(/[^0-9]/g, '')
    const num = digits ? Number(digits) : 0
    setSupplyDisplay(digits ? Number(digits).toLocaleString() : '')
    onChange({ ...config, initialSupply: num })
  }

  const descLen = config.description?.length ?? 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error banner */}
      {errors.length > 0 && touched && (
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
        >
          <ul className="space-y-1">
            {errors.map((err) => (
              <li key={err} className="text-sm text-red-400 flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Name + Symbol row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Token Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Token Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={config.name ?? ''}
            onChange={(e) => onChange({ ...config, name: e.target.value })}
            placeholder="e.g. My Awesome Token"
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Symbol */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Symbol <span className="text-red-400">*</span>
            <span className="ml-2 text-xs text-slate-500">(2-10 chars)</span>
          </label>
          <input
            type="text"
            value={config.symbol ?? ''}
            onChange={(e) => handleSymbolChange(e.target.value)}
            placeholder="e.g. MAT"
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all font-mono uppercase"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
          {config.symbol && config.symbol.length < 2 && (
            <p className="mt-1 text-xs text-amber-400">At least 2 characters required</p>
          )}
        </div>
      </div>

      {/* Decimals */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Decimals
        </label>
        <div className="flex flex-wrap gap-3">
          {DECIMAL_PRESETS.map((preset) => {
            const selected = (config.decimals ?? 9) === preset.value
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => onChange({ ...config, decimals: preset.value })}
                className="flex-1 min-w-[140px] rounded-xl px-4 py-3 text-left transition-all"
                style={{
                  background: selected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                  border: selected ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="text-sm font-semibold"
                  style={{ color: selected ? '#818CF8' : '#CBD5E1' }}
                >
                  {preset.label}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{preset.description}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Description
          <span className="ml-2 text-xs" style={{ color: descLen > 200 ? '#F87171' : '#475569' }}>
            {descLen}/200
          </span>
        </label>
        <textarea
          value={config.description ?? ''}
          onChange={(e) => onChange({ ...config, description: e.target.value })}
          placeholder="Brief description of your token and its use case..."
          rows={3}
          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none resize-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${descLen > 200 ? 'rgba(248,113,113,0.5)' : 'rgba(99,102,241,0.2)'}`,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.1)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = descLen > 200 ? 'rgba(248,113,113,0.5)' : 'rgba(99,102,241,0.2)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
      </div>

      {/* Icon URL */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Icon URL
          <span className="ml-2 text-xs text-slate-500">(optional, IPFS or https)</span>
        </label>
        <div className="flex items-center gap-3">
          {/* Preview */}
          <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            {config.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.iconUrl}
                alt="icon preview"
                className="w-10 h-10 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M9 12h6m-3-3v6" />
              </svg>
            )}
          </div>
          <input
            type="url"
            value={config.iconUrl ?? ''}
            onChange={(e) => onChange({ ...config, iconUrl: e.target.value })}
            placeholder="https://example.com/token-logo.png"
            className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>
      </div>

      {/* Initial Supply */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Initial Supply
          <span className="ml-2 text-xs text-slate-500">(0 = no initial mint)</span>
        </label>
        <input
          type="text"
          value={supplyDisplay}
          onChange={(e) => handleSupplyChange(e.target.value)}
          placeholder="e.g. 1,000,000"
          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.1)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'
            e.currentTarget.style.boxShadow = 'none'
            // reformat on blur
            if (config.initialSupply) {
              setSupplyDisplay(config.initialSupply.toLocaleString())
            }
          }}
        />
        {(config.initialSupply ?? 0) > 0 && (
          <p className="mt-1 text-xs text-slate-500">
            Will mint {((config.initialSupply ?? 0) / Math.pow(10, config.decimals ?? 9)).toLocaleString()} tokens to your wallet
          </p>
        )}
      </div>

      {/* Preview */}
      <TokenPreviewCard config={config} />

      {/* Submit */}
      <button
        type="submit"
        className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
        style={{
          background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
        }}
      >
        Review Contract
        <span className="ml-2 opacity-70">→</span>
      </button>
    </form>
  )
}


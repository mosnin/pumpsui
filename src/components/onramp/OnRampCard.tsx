'use client'

import { useState, useMemo } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import {
  ONRAMP_PROVIDERS,
  estimateOnRamp,
  buildMoonPayUrl,
  buildTransakUrl,
  buildCoinbasePayUrl,
  type ProviderId,
  type OnRampQuote,
} from '@/lib/onramp'

// ─── Token options for on-ramp ────────────────────────────────────────────────

const ONRAMP_TOKENS = [
  { symbol: 'SUI', name: 'Sui', priceUsd: 1.85, moonpayCode: 'sui', transakCode: 'SUI', coinbaseCode: 'SUI' },
  { symbol: 'USDC', name: 'USD Coin', priceUsd: 1.0, moonpayCode: 'usdc_sui', transakCode: 'USDC', coinbaseCode: 'USDC' },
  { symbol: 'USDT', name: 'Tether USD', priceUsd: 1.0, moonpayCode: 'usdt_sui', transakCode: 'USDT', coinbaseCode: 'USDT' },
] as const

type OnRampTokenSymbol = typeof ONRAMP_TOKENS[number]['symbol']

const FIAT_CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD'] as const
type FiatCurrency = typeof FIAT_CURRENCIES[number]

// ─── Payment method icon mapping ──────────────────────────────────────────────

function paymentLabel(method: string): string {
  const map: Record<string, string> = {
    card: '💳 Card',
    bank: '🏦 Bank',
    apple_pay: ' Apple Pay',
    google_pay: ' Google Pay',
    coinbase_balance: '🔵 Coinbase',
  }
  return map[method] ?? method
}

// ─── Provider radio card ──────────────────────────────────────────────────────

function ProviderCard({
  providerId,
  selected,
  quote,
  onSelect,
}: {
  providerId: ProviderId
  selected: boolean
  quote: OnRampQuote
  onSelect: () => void
}) {
  const provider = ONRAMP_PROVIDERS.find((p) => p.id === providerId)!
  const isBestRate = providerId === 'transak'

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-3.5 rounded-xl transition-all duration-200 relative"
      style={{
        background: selected
          ? `${provider.color}15`
          : 'rgba(255,255,255,0.03)',
        border: selected
          ? `1px solid ${provider.color}50`
          : '1px solid rgba(99,102,241,0.12)',
        boxShadow: selected ? `0 0 18px ${provider.color}12` : 'none',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
          e.currentTarget.style.borderColor = 'rgba(99,102,241,0.12)'
        }
      }}
    >
      {/* Best rate badge */}
      {isBestRate && (
        <span
          className="absolute -top-2.5 right-3 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
            color: '#fff',
            fontSize: '10px',
          }}
        >
          Best Rate
        </span>
      )}

      <div className="flex items-center justify-between gap-2">
        {/* Left: radio + logo + name */}
        <div className="flex items-center gap-2.5">
          {/* Custom radio */}
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              border: selected ? `2px solid ${provider.color}` : '2px solid rgba(99,102,241,0.3)',
              background: selected ? `${provider.color}20` : 'transparent',
            }}
          >
            {selected && (
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: provider.color }}
              />
            )}
          </div>

          {/* Provider logo fallback */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: `${provider.color}20`,
              border: `1px solid ${provider.color}40`,
              color: provider.color,
            }}
          >
            {provider.name.charAt(0)}
          </div>

          <div>
            <div className="text-sm font-medium text-slate-200">{provider.name}</div>
            <div className="text-xs text-slate-500">{provider.estimatedTime}</div>
          </div>
        </div>

        {/* Right: fee */}
        <div className="text-right">
          <div
            className="text-sm font-semibold"
            style={{ color: isBestRate ? '#06B6D4' : '#94a3b8' }}
          >
            ~{quote.feePercent}% fee
          </div>
          <div className="text-xs text-slate-500">≈${quote.fee.toFixed(2)}</div>
        </div>
      </div>
    </button>
  )
}

// ─── Main OnRampCard ──────────────────────────────────────────────────────────

export function OnRampCard() {
  const account = useCurrentAccount()
  const walletAddress = account?.address ?? ''

  const [fiatAmount, setFiatAmount] = useState<string>('100')
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>('USD')
  const [selectedToken, setSelectedToken] = useState<OnRampTokenSymbol>('SUI')
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('transak')
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false)
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false)

  const parsedAmount = parseFloat(fiatAmount) || 0
  const token = ONRAMP_TOKENS.find((t) => t.symbol === selectedToken)!

  // Quotes for all providers
  const quotes = useMemo<Record<ProviderId, OnRampQuote>>(() => {
    const ids: ProviderId[] = ['moonpay', 'transak', 'coinbase_pay']
    return Object.fromEntries(
      ids.map((id) => [id, estimateOnRamp(id, parsedAmount, token.priceUsd)])
    ) as Record<ProviderId, OnRampQuote>
  }, [parsedAmount, token.priceUsd])

  const selectedQuote = quotes[selectedProvider]

  // Build checkout URL on click
  function getCheckoutUrl(): string {
    if (!walletAddress) return ''
    if (selectedProvider === 'moonpay') {
      return buildMoonPayUrl({
        walletAddress,
        currencyCode: token.moonpayCode,
        baseCurrencyAmount: parsedAmount,
        baseCurrencyCode: fiatCurrency.toLowerCase(),
      })
    }
    if (selectedProvider === 'transak') {
      return buildTransakUrl({
        walletAddress,
        cryptoCurrencyCode: token.transakCode,
        fiatAmount: parsedAmount,
        fiatCurrency,
        network: 'sui',
      })
    }
    // coinbase_pay
    return buildCoinbasePayUrl({
      walletAddress,
      asset: token.coinbaseCode,
      amount: parsedAmount,
    })
  }

  function handleBuy() {
    const url = getCheckoutUrl()
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  const providerName = ONRAMP_PROVIDERS.find((p) => p.id === selectedProvider)!.name
  const selectedProviderConfig = ONRAMP_PROVIDERS.find((p) => p.id === selectedProvider)!
  const amountTooLow = parsedAmount > 0 && parsedAmount < selectedProviderConfig.minAmount
  const amountTooHigh = parsedAmount > selectedProviderConfig.maxAmount

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(13, 13, 31, 0.8)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* ── Fiat Amount Input ── */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          I want to spend
        </label>
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <span className="text-slate-400 text-sm">$</span>
          <input
            type="number"
            min={0}
            value={fiatAmount}
            onChange={(e) => setFiatAmount(e.target.value)}
            className="flex-1 bg-transparent text-slate-100 text-base font-semibold outline-none placeholder-slate-600 min-w-0"
            placeholder="100"
          />

          {/* Currency selector */}
          <div className="relative">
            <button
              onClick={() => { setCurrencyDropdownOpen((o) => !o); setTokenDropdownOpen(false) }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium text-slate-300 transition-colors hover:bg-white/8"
              style={{ border: '1px solid rgba(99,102,241,0.2)' }}
            >
              {fiatCurrency}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {currencyDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-24 rounded-xl overflow-hidden z-10"
                style={{
                  background: '#0D0D1F',
                  border: '1px solid rgba(99,102,241,0.25)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                {FIAT_CURRENCIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setFiatCurrency(c); setCurrencyDropdownOpen(false) }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-indigo-500/10 transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Amount validation messages */}
        {amountTooLow && (
          <p className="text-xs text-amber-400 mt-1">
            Minimum is ${selectedProviderConfig.minAmount} for {providerName}
          </p>
        )}
        {amountTooHigh && (
          <p className="text-xs text-amber-400 mt-1">
            Maximum is ${selectedProviderConfig.maxAmount.toLocaleString()} for {providerName}
          </p>
        )}
      </div>

      {/* ── Token Selector ── */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          I want to receive
        </label>
        <div className="relative">
          <button
            onClick={() => { setTokenDropdownOpen((o) => !o); setCurrencyDropdownOpen(false) }}
            className="w-full flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(99,102,241,0.2)', color: '#818CF8' }}
              >
                {selectedToken.charAt(0)}
              </div>
              <div className="text-left">
                <div className="font-semibold">{selectedToken}</div>
                <div className="text-xs text-slate-500">{token.name}</div>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {tokenDropdownOpen && (
            <div
              className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-10"
              style={{
                background: '#0D0D1F',
                border: '1px solid rgba(99,102,241,0.25)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              {ONRAMP_TOKENS.map((t) => (
                <button
                  key={t.symbol}
                  onClick={() => { setSelectedToken(t.symbol); setTokenDropdownOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-indigo-500/10"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8' }}
                  >
                    {t.symbol.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-slate-200">{t.symbol}</div>
                    <div className="text-xs text-slate-500">{t.name}</div>
                  </div>
                  <div className="ml-auto text-xs text-slate-500">${t.priceUsd.toFixed(2)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Provider Selection ── */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-slate-400 mb-2">
          Select provider
        </label>
        <div className="space-y-2">
          {ONRAMP_PROVIDERS.map((provider) => (
            <ProviderCard
              key={provider.id}
              providerId={provider.id}
              selected={selectedProvider === provider.id}
              quote={quotes[provider.id]}
              onSelect={() => setSelectedProvider(provider.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Estimate ── */}
      {parsedAmount > 0 && (
        <div
          className="rounded-xl p-4 mb-5"
          style={{
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.15)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">You receive approximately</div>
              <div className="text-xl font-bold text-slate-100">
                {selectedQuote.cryptoAmount.toFixed(4)}{' '}
                <span className="text-indigo-300">{selectedToken}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1">Network fee</div>
              <div className="text-sm font-semibold text-slate-300">
                ~${selectedQuote.fee.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500">{selectedQuote.feePercent}%</div>
            </div>
          </div>
          <div className="mt-2 pt-2 flex items-center gap-1.5 text-xs text-slate-500" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Estimated. Final amount confirmed on {providerName}.
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      {!walletAddress ? (
        <div
          className="rounded-xl p-4 text-center"
          style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <p className="text-sm text-slate-400">
            Connect your wallet first to receive tokens.
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Use the wallet button in the top-right corner.
          </p>
        </div>
      ) : (
        <button
          onClick={handleBuy}
          disabled={!parsedAmount || amountTooLow || amountTooHigh}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
            boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) e.currentTarget.style.boxShadow = '0 4px 28px rgba(99,102,241,0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.3)'
          }}
        >
          Buy with {providerName} →
        </button>
      )}

      {/* Supported methods */}
      {walletAddress && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {selectedProviderConfig.paymentMethods.map((m) => (
              <span key={m} className="text-xs text-slate-600">
                {paymentLabel(m)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

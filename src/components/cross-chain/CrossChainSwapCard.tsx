'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SUPPORTED_CHAINS, CHAIN_IDS, BRIDGE_TOKENS } from '@/lib/bridges/types'
import type { Chain } from '@/lib/bridges/types'
import { SUI_TOKENS } from '@/lib/tokens'
import { getCrossChainQuote, getBridgeableTokens } from '@/lib/crossChainQuote'
import type { CrossChainQuote } from '@/lib/crossChainQuote'
import { formatEstimatedTime, formatBridgeFee } from '@/lib/bridges'
import { BRIDGE_TOKEN_MAP } from '@/lib/bridges/tokenMap'
import CrossChainRouteDisplay from './CrossChainRouteDisplay'

// ─── Source chains (non-Sui) ──────────────────────────────────────────────────

const SOURCE_CHAINS = SUPPORTED_CHAINS.filter((c) => c.id !== CHAIN_IDS.SUI)
const SUI_CHAIN = SUPPORTED_CHAINS.find((c) => c.id === CHAIN_IDS.SUI)!

// ─── Chain logo with fallback ─────────────────────────────────────────────────

function ChainLogo({ chain, size = 24 }: { chain: Chain; size?: number }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ width: size, height: size, background: chain.color }}
      >
        {chain.shortName.slice(0, 2)}
      </div>
    )
  }
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

// ─── Token logo ───────────────────────────────────────────────────────────────

function TokenLogo({ logoUrl, symbol, size = 20 }: { logoUrl?: string; symbol: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  if (!logoUrl || failed) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ width: size, height: size, background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}
      >
        {symbol.slice(0, 2)}
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={symbol}
      width={size}
      height={size}
      className="rounded-full flex-shrink-0 object-contain"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}

// ─── Chain selector dropdown ──────────────────────────────────────────────────

function ChainDropdown({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (id: number) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  const selected = SOURCE_CHAINS.find((c) => c.id === value) ?? SOURCE_CHAINS[0]

  return (
    <div className="relative">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1.5">
        {label}
      </label>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl w-full text-left transition-all"
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
        <ChainLogo chain={selected} size={22} />
        <span className="flex-1 text-sm font-semibold text-slate-100 truncate">{selected.name}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="absolute left-0 top-full mt-2 z-40 w-56 rounded-2xl py-2 shadow-2xl"
            style={{
              background: '#0D0D1F',
              border: '1px solid rgba(99,102,241,0.25)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            }}
          >
            {SOURCE_CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => { onChange(chain.id); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left"
                style={{
                  background: chain.id === value ? `${chain.color}12` : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (chain.id !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={(e) => {
                  if (chain.id !== value) e.currentTarget.style.background = 'transparent'
                }}
              >
                <ChainLogo chain={chain} size={22} />
                <span className="text-sm text-slate-200 flex-1">{chain.name}</span>
                {chain.id === value && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Transaction tracker ──────────────────────────────────────────────────────

type TxStatus = 'idle' | 'approving' | 'sending' | 'inflight' | 'redeeming' | 'complete' | 'failed'

const TX_STEPS: { status: TxStatus; label: string }[] = [
  { status: 'approving', label: 'Approve token spend' },
  { status: 'sending',   label: 'Send bridge transaction' },
  { status: 'inflight',  label: 'Cross-chain relay (Wormhole)' },
  { status: 'redeeming', label: 'Arrive on Sui' },
  { status: 'complete',  label: 'DEX swap to final token' },
]

function TransactionTracker({
  status,
  onDismiss,
  bridgeName,
}: {
  status: TxStatus
  onDismiss: () => void
  bridgeName: string
}) {
  const currentIdx = TX_STEPS.findIndex((s) => s.status === status)

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(13,13,31,0.9)',
        border: '1px solid rgba(99,102,241,0.2)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Cross-Chain Swap</h3>
          <p className="text-xs text-slate-500 mt-0.5">via {bridgeName} + Cetus</p>
        </div>
        {(status === 'complete' || status === 'failed') && (
          <button
            onClick={onDismiss}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>

      <div className="space-y-3">
        {TX_STEPS.map(({ status: stepStatus, label }, idx) => {
          const isDone   = status === 'complete' || currentIdx > idx
          const isActive = currentIdx === idx && status !== 'complete' && status !== 'failed'
          const isFailed = status === 'failed' && isActive

          return (
            <div key={stepStatus} className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: isDone
                    ? 'rgba(16,185,129,0.2)'
                    : isActive
                    ? isFailed ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)'
                    : 'rgba(255,255,255,0.05)',
                  border: isDone
                    ? '1px solid rgba(16,185,129,0.4)'
                    : isActive
                    ? isFailed ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(99,102,241,0.4)'
                    : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {isDone ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isActive && !isFailed ? (
                  <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="3">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                ) : isFailed ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <span className="text-xs text-slate-600">{idx + 1}</span>
                )}
              </div>
              <span
                className="text-sm"
                style={{
                  color: isDone ? '#10B981' : isActive ? (isFailed ? '#EF4444' : '#E2E8F0') : '#475569',
                }}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main CrossChainSwapCard ──────────────────────────────────────────────────

export interface CrossChainSwapCardProps {
  // empty — all state is internal
}

export default function CrossChainSwapCard(_props: CrossChainSwapCardProps) {
  const router = useRouter()

  // ── Source side ────────────────────────────────────────────────────────────
  const [sourceChainId, setSourceChainId] = useState<number>(CHAIN_IDS.ETHEREUM)
  const [sourceTokenSymbol, setSourceTokenSymbol] = useState<string>('ETH')
  const [amount, setAmount] = useState<string>('')

  // ── Destination side (always Sui) ──────────────────────────────────────────
  const [destToken, setDestToken] = useState(SUI_TOKENS[0]) // SUI by default

  // ── Quote state ────────────────────────────────────────────────────────────
  const [quote, setQuote]         = useState<CrossChainQuote | null>(null)
  const [loading, setLoading]     = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  // ── Transaction state ──────────────────────────────────────────────────────
  const [txStatus, setTxStatus]   = useState<TxStatus>('idle')

  // ── Tokens available on the selected source chain ──────────────────────────
  const bridgeableTokens = getBridgeableTokens(sourceChainId)

  // When chain changes, reset token to first available
  useEffect(() => {
    const available = getBridgeableTokens(sourceChainId)
    const current = available.find((t) => t.symbol === sourceTokenSymbol)
    if (!current && available.length > 0) {
      setSourceTokenSymbol(available[0].symbol)
    }
  }, [sourceChainId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect to /swap when both sides are on Sui
  useEffect(() => {
    // (Source chain is never Sui in this UI; kept for future extensibility)
  }, [sourceChainId])

  const selectedSourceToken = bridgeableTokens.find((t) => t.symbol === sourceTokenSymbol)

  // ── BRIDGE_TOKENS lookup for metadata ─────────────────────────────────────
  const sourceTokenMeta = BRIDGE_TOKENS.find(
    (t) => t.chainId === sourceChainId && t.symbol === sourceTokenSymbol
  )
  const sourceChain = SOURCE_CHAINS.find((c) => c.id === sourceChainId) ?? SOURCE_CHAINS[0]

  // ── Fetch cross-chain quote ────────────────────────────────────────────────
  const fetchQuote = useCallback(async () => {
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0 || !selectedSourceToken) {
      setQuote(null)
      return
    }

    setLoading(true)
    setQuoteError(null)

    try {
      const decimals = sourceTokenMeta?.decimals ?? 18
      const amountBigInt = BigInt(Math.floor(parsed * 10 ** decimals))

      const result = await getCrossChainQuote({
        fromChainId: sourceChainId,
        fromToken: selectedSourceToken.sourceAddress,
        toToken: destToken.address,
        amount: amountBigInt,
        recipient: '0x0000000000000000000000000000000000000001',
      })

      setQuote(result)
      if (!result) {
        setQuoteError('No bridge route found for this token pair.')
      }
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : 'Failed to fetch quote')
      setQuote(null)
    } finally {
      setLoading(false)
    }
  }, [amount, sourceChainId, selectedSourceToken, sourceTokenMeta, destToken])

  useEffect(() => {
    const id = setTimeout(fetchQuote, 800)
    return () => clearTimeout(id)
  }, [fetchQuote])

  // ── Execute ────────────────────────────────────────────────────────────────
  const handleExecute = useCallback(() => {
    if (!quote) return
    // Open the best bridge in a new tab
    window.open(quote.bridgeQuote.url, '_blank', 'noopener,noreferrer')

    // Simulate transaction status progression for UX demo
    setTxStatus('approving')
    const schedule: [TxStatus, number][] = [
      ['sending',   1_500],
      ['inflight',  3_000],
      ['redeeming', 5_000],
      ['complete',  7_000],
    ]
    schedule.forEach(([s, ms]) => {
      setTimeout(() => setTxStatus(s), ms)
    })
  }, [quote])

  const canExecute =
    !!quote &&
    !!amount &&
    parseFloat(amount) > 0 &&
    !loading &&
    txStatus === 'idle'

  // ── Derived display values ─────────────────────────────────────────────────
  const outputNum = quote
    ? Number(quote.estimatedOutput) / 10 ** destToken.decimals
    : null

  // ── CTA label ─────────────────────────────────────────────────────────────
  const ctaLabel =
    loading
      ? 'Fetching quote…'
      : txStatus !== 'idle' && txStatus !== 'failed'
      ? 'In progress…'
      : !amount || parseFloat(amount) <= 0
      ? 'Enter an amount'
      : quoteError || !quote
      ? 'No route found'
      : `Execute Cross-Chain Swap`

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* ── Main card ── */}
      <div
        className="rounded-3xl p-px"
        style={{
          background:
            'linear-gradient(135deg, rgba(245,158,11,0.5) 0%, rgba(99,102,241,0.5) 40%, rgba(6,182,212,0.4) 100%)',
        }}
      >
        <div
          className="rounded-[calc(1.5rem-1px)] p-5 space-y-4"
          style={{ background: 'linear-gradient(145deg, #0d0d1f 0%, #080814 100%)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-100">Cross-Chain Swap</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Bridge + swap in one click
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.25)',
                color: '#F59E0B',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Magic Route
            </div>
          </div>

          {/* FROM section */}
          <div>
            <ChainDropdown
              value={sourceChainId}
              onChange={(id) => { setSourceChainId(id); setQuote(null) }}
              label="From Chain"
            />

            {/* Token + amount row */}
            <div className="mt-2.5">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                You send
              </span>
              <div
                className="flex gap-0 mt-1.5 rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(99,102,241,0.2)' }}
              >
                {/* Token select */}
                <div className="relative">
                  <select
                    value={sourceTokenSymbol}
                    onChange={(e) => { setSourceTokenSymbol(e.target.value); setQuote(null) }}
                    className="h-full px-3 py-3 text-sm font-semibold text-slate-100 appearance-none pr-7 bg-transparent cursor-pointer outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderRight: '1px solid rgba(99,102,241,0.2)',
                      minWidth: '90px',
                    }}
                  >
                    {bridgeableTokens.length > 0 ? (
                      bridgeableTokens.map((t) => (
                        <option key={t.symbol} value={t.symbol}
                          style={{ background: '#0D0D1F', color: '#E2E8F0' }}>
                          {t.symbol}
                        </option>
                      ))
                    ) : (
                      <option value="USDC" style={{ background: '#0D0D1F', color: '#E2E8F0' }}>USDC</option>
                    )}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                    width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="#64748b" strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                {/* Amount input */}
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  className="flex-1 px-4 py-3 text-lg font-bold text-slate-100 placeholder-slate-600 bg-transparent outline-none"
                />

                {/* Source logo */}
                <div className="flex items-center pr-3">
                  <TokenLogo logoUrl={sourceTokenMeta?.logoUrl} symbol={sourceTokenSymbol} size={22} />
                </div>
              </div>
            </div>
          </div>

          {/* Direction arrow */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(245,158,11,0.15)' }} />
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #1e1e3a 0%, #12122a 100%)',
                border: '1px solid rgba(245,158,11,0.3)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </div>
            <div className="flex-1 h-px" style={{ background: 'rgba(6,182,212,0.15)' }} />
          </div>

          {/* TO section */}
          <div>
            {/* Destination chain — always Sui */}
            <div className="mb-2.5">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1.5">
                To Chain
              </label>
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{
                  background: 'rgba(111,188,240,0.06)',
                  border: '1px solid rgba(111,188,240,0.25)',
                }}
              >
                <ChainLogo chain={SUI_CHAIN} size={22} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-100">Sui</div>
                  <div className="text-xs text-slate-500">Mainnet</div>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(111,188,240,0.12)', color: '#6FBCF0' }}
                >
                  Destination
                </span>
              </div>
            </div>

            {/* Destination token selector */}
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              You receive
            </span>
            <div
              className="flex gap-0 mt-1.5 rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(6,182,212,0.2)' }}
            >
              {/* Token selector */}
              <div className="relative">
                <select
                  value={destToken.address}
                  onChange={(e) => {
                    const t = SUI_TOKENS.find((tok) => tok.address === e.target.value)
                    if (t) { setDestToken(t); setQuote(null) }
                  }}
                  className="h-full px-3 py-3 text-sm font-semibold text-slate-100 appearance-none pr-7 bg-transparent cursor-pointer outline-none"
                  style={{
                    background: 'rgba(6,182,212,0.05)',
                    borderRight: '1px solid rgba(6,182,212,0.2)',
                    minWidth: '100px',
                  }}
                >
                  {SUI_TOKENS.map((t) => (
                    <option key={t.address} value={t.address}
                      style={{ background: '#0D0D1F', color: '#E2E8F0' }}>
                      {t.symbol}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                  width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="#64748b" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Estimated output */}
              <div className="flex-1 px-4 py-3 flex items-center justify-between">
                {loading ? (
                  <span className="flex items-center gap-2 text-slate-500">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    <span className="text-sm">Calculating…</span>
                  </span>
                ) : outputNum !== null && outputNum > 0 ? (
                  <span className="text-lg font-bold" style={{ color: '#06B6D4' }}>
                    {outputNum.toFixed(4)}
                  </span>
                ) : (
                  <span className="text-lg font-bold text-slate-600">—</span>
                )}
              </div>

              {/* Dest token logo */}
              <div className="flex items-center pr-3">
                <TokenLogo logoUrl={destToken.logoURI} symbol={destToken.symbol} size={22} />
              </div>
            </div>
          </div>

          {/* Quote error */}
          {quoteError && !loading && (
            <div
              className="px-3 py-2.5 rounded-xl text-xs"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#FCA5A5',
              }}
            >
              {quoteError}
            </div>
          )}

          {/* Quote summary strip */}
          {quote && !loading && (
            <div
              className="grid grid-cols-3 gap-2 px-1 py-2 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(99,102,241,0.1)',
              }}
            >
              <div className="text-center">
                <div className="text-xs text-slate-600">Time</div>
                <div className="text-xs font-semibold text-amber-400 mt-0.5">
                  {formatEstimatedTime(quote.totalTimeSeconds)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-600">Fees</div>
                <div className="text-xs font-semibold text-slate-300 mt-0.5">
                  {formatBridgeFee(quote.totalFeeUSD)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-600">Bridge</div>
                <div
                  className="text-xs font-semibold mt-0.5"
                  style={{ color: quote.bridgeQuote.bridgeColor }}
                >
                  {quote.bridgeQuote.bridgeName}
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={canExecute ? handleExecute : undefined}
            disabled={!canExecute}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 relative overflow-hidden"
            style={{
              background: canExecute
                ? 'linear-gradient(135deg, #F59E0B 0%, #6366F1 50%, #06B6D4 100%)'
                : 'rgba(255,255,255,0.06)',
              color: canExecute ? '#fff' : '#475569',
              cursor: canExecute ? 'pointer' : 'not-allowed',
              border: canExecute ? 'none' : '1px solid rgba(99,102,241,0.1)',
              boxShadow: canExecute
                ? '0 4px 20px rgba(245,158,11,0.3), 0 4px 20px rgba(99,102,241,0.3), 0 0 40px rgba(6,182,212,0.15)'
                : 'none',
            }}
            onMouseEnter={(e) => {
              if (!canExecute) return
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow =
                '0 8px 30px rgba(245,158,11,0.4), 0 8px 30px rgba(99,102,241,0.4), 0 0 50px rgba(6,182,212,0.2)'
            }}
            onMouseLeave={(e) => {
              if (!canExecute) return
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow =
                '0 4px 20px rgba(245,158,11,0.3), 0 4px 20px rgba(99,102,241,0.3), 0 0 40px rgba(6,182,212,0.15)'
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                {ctaLabel}
              </span>
            ) : (
              ctaLabel
            )}
          </button>
        </div>
      </div>

      {/* ── Route breakdown ── */}
      {quote && !loading && (
        <CrossChainRouteDisplay
          quote={quote}
          sourceSymbol={sourceTokenSymbol}
          sourceChainName={sourceChain.name}
          sourceAddress={selectedSourceToken?.sourceAddress ?? ''}
          outputSymbol={destToken.symbol}
          outputDecimals={destToken.decimals}
          outputAddress={destToken.address}
        />
      )}

      {/* ── Transaction tracker ── */}
      {txStatus !== 'idle' && quote && (
        <TransactionTracker
          status={txStatus}
          bridgeName={quote.bridgeQuote.bridgeName}
          onDismiss={() => setTxStatus('idle')}
        />
      )}
    </div>
  )
}

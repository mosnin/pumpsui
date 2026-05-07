'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChainSelector, SuiDestinationBadge } from './ChainSelector'
import { CHAIN_IDS, BRIDGE_TOKENS, SUPPORTED_CHAINS } from '@/lib/bridges/types'
import type { BridgeQuote, BridgeTx, BridgeTxStatus } from '@/lib/bridges/types'
import { getAllBridgeQuotes, formatEstimatedTime, formatBridgeFee } from '@/lib/bridges'

// ─── Helper: time formatting ──────────────────────────────────────────────────

function formatTimeAgo(startedAt: number): string {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000)
  if (elapsed < 60) return `${elapsed}s ago`
  return `${Math.floor(elapsed / 60)}m ago`
}

// ─── Bridge Quote Card ────────────────────────────────────────────────────────

function BridgeQuoteItem({
  quote,
  selected,
  isBest,
  onSelect,
}: {
  quote: BridgeQuote
  selected: boolean
  isBest: boolean
  onSelect: () => void
}) {
  const pct = quote.fromAmount > 0n
    ? Number((quote.toAmount * 10000n) / quote.fromAmount) / 100
    : 100

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 rounded-2xl transition-all duration-200 relative"
      style={{
        background: selected
          ? `${quote.bridgeColor}12`
          : 'rgba(255,255,255,0.03)',
        border: selected
          ? `1px solid ${quote.bridgeColor}50`
          : '1px solid rgba(99,102,241,0.12)',
        boxShadow: selected
          ? `0 0 20px ${quote.bridgeColor}15`
          : 'none',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
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
      {isBest && (
        <span
          className="absolute -top-2.5 left-4 text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
            color: '#fff',
          }}
        >
          Best Rate
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Bridge info */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: `${quote.bridgeColor}20`, border: `1px solid ${quote.bridgeColor}40` }}
          >
            <span style={{ color: quote.bridgeColor }}>
              {quote.bridgeName.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-100">{quote.bridgeName}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {quote.route.map((step, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">{step}</span>
                  {i < quote.route.length - 1 && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="#475569" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Rate info */}
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-bold text-slate-100">
            {pct.toFixed(2)}%
          </div>
          <div className="text-xs text-slate-500">received</div>
        </div>
      </div>

      {/* Fee / time row */}
      <div
        className="flex items-center gap-4 mt-3 pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="text-xs text-slate-400">
            {formatEstimatedTime(quote.estimatedTime)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-xs text-slate-400">
            Fee: {formatBridgeFee(quote.totalCostUSD)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          {selected ? (
            <span className="text-xs font-medium" style={{ color: quote.bridgeColor }}>Selected</span>
          ) : (
            <span className="text-xs text-slate-600">Click to select</span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Transaction Status Tracker ───────────────────────────────────────────────

const STATUS_STEPS: { status: BridgeTxStatus; label: string }[] = [
  { status: 'approving', label: 'Approve token' },
  { status: 'sending', label: 'Send transaction' },
  { status: 'inflight', label: 'Cross-chain relay' },
  { status: 'redeeming', label: 'Claim on Sui' },
  { status: 'complete', label: 'Complete' },
]

function TransactionStatus({ tx, onDismiss }: { tx: BridgeTx; onDismiss: () => void }) {
  const stepOrder = STATUS_STEPS.map((s) => s.status)
  const currentIdx = stepOrder.indexOf(tx.status)

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
          <h3 className="text-sm font-semibold text-slate-100">Bridge Transaction</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            via {tx.quote.bridgeName} · started {formatTimeAgo(tx.startedAt)}
          </p>
        </div>
        {(tx.status === 'complete' || tx.status === 'failed') && (
          <button
            onClick={onDismiss}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STATUS_STEPS.map(({ status, label }, idx) => {
          const isDone = currentIdx > idx || tx.status === 'complete'
          const isActive = stepOrder[currentIdx] === status && tx.status !== 'complete' && tx.status !== 'failed'
          const isFailed = tx.status === 'failed' && isActive

          return (
            <div key={status} className="flex items-center gap-3">
              {/* Step indicator */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: isDone
                    ? 'rgba(16,185,129,0.2)'
                    : isActive
                    ? isFailed
                      ? 'rgba(239,68,68,0.2)'
                      : 'rgba(99,102,241,0.2)'
                    : 'rgba(255,255,255,0.05)',
                  border: isDone
                    ? '1px solid rgba(16,185,129,0.4)'
                    : isActive
                    ? isFailed
                      ? '1px solid rgba(239,68,68,0.4)'
                      : '1px solid rgba(99,102,241,0.4)'
                    : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {isDone ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isActive && !isFailed ? (
                  <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24"
                    fill="none" stroke="#6366F1" strokeWidth="3">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                ) : isFailed ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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

              {/* Tx hash links */}
              {idx === 1 && tx.sourceTxHash && (
                <a
                  href="#"
                  className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  {tx.sourceTxHash.slice(0, 8)}…
                </a>
              )}
              {idx === 4 && tx.destTxHash && (
                <a
                  href="#"
                  className="ml-auto text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  {tx.destTxHash.slice(0, 8)}…
                </a>
              )}
            </div>
          )
        })}
      </div>

      {/* Error message */}
      {tx.status === 'failed' && tx.errorMessage && (
        <div
          className="mt-4 px-3 py-2.5 rounded-xl text-xs"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#FCA5A5',
          }}
        >
          {tx.errorMessage}
        </div>
      )}
    </div>
  )
}

// ─── Main BridgeCard ──────────────────────────────────────────────────────────

export default function BridgeCard() {
  const [fromChainId, setFromChainId] = useState<number>(CHAIN_IDS.ETHEREUM)
  const [fromToken, setFromToken] = useState<string>('USDC')
  const [amount, setAmount] = useState<string>('')
  const [recipient, setRecipient] = useState<string>('')
  const [quotes, setQuotes] = useState<BridgeQuote[]>([])
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [loadingQuotes, setLoadingQuotes] = useState(false)
  const [quotesError, setQuotesError] = useState<string | null>(null)
  const [activeTx, setActiveTx] = useState<BridgeTx | null>(null)

  // Tokens available on the selected source chain
  const sourceTokens = BRIDGE_TOKENS.filter((t) => t.chainId === fromChainId)

  // Auto-pick a token if the current token isn't available on the new chain
  useEffect(() => {
    if (!sourceTokens.find((t) => t.symbol === fromToken)) {
      setFromToken(sourceTokens[0]?.symbol ?? 'USDC')
    }
  }, [fromChainId]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedToken = sourceTokens.find((t) => t.symbol === fromToken)

  const fetchQuotes = useCallback(async () => {
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0 || !selectedToken) {
      setQuotes([])
      return
    }

    setLoadingQuotes(true)
    setQuotesError(null)

    try {
      const amountBigInt = BigInt(Math.floor(parsed * 10 ** selectedToken.decimals))
      const results = await getAllBridgeQuotes({
        fromChainId,
        toChainId: CHAIN_IDS.SUI,
        fromToken: selectedToken.address,
        toToken: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
        amount: amountBigInt,
        recipient: recipient || '0x0000000000000000000000000000000000000001',
      })
      setQuotes(results)
      if (results.length > 0) {
        setSelectedQuoteId(results[0].bridgeId)  // auto-select best rate
      }
    } catch (err) {
      setQuotesError(err instanceof Error ? err.message : 'Failed to fetch quotes')
    } finally {
      setLoadingQuotes(false)
    }
  }, [amount, fromChainId, selectedToken, recipient])

  // Re-fetch on changes (debounced)
  useEffect(() => {
    const id = setTimeout(fetchQuotes, 800)
    return () => clearTimeout(id)
  }, [fetchQuotes])

  const selectedQuote = quotes.find((q) => q.bridgeId === selectedQuoteId) ?? null

  const handleBridge = useCallback(() => {
    if (!selectedQuote) return

    // Open bridge URL in new tab (real integration would build & send tx)
    window.open(selectedQuote.url, '_blank', 'noopener,noreferrer')

    // Simulate a pending transaction for the status tracker demo
    setActiveTx({
      quote: selectedQuote,
      status: 'sending',
      startedAt: Date.now(),
      sourceTxHash: undefined,
      destTxHash: undefined,
    })
  }, [selectedQuote])

  const canBridge =
    !!selectedQuote &&
    !!amount &&
    parseFloat(amount) > 0 &&
    !loadingQuotes

  const fromChain = SUPPORTED_CHAINS.find((c) => c.id === fromChainId)

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* ── Main Card ── */}
      <div
        className="rounded-3xl p-px"
        style={{
          background:
            'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(6,182,212,0.4) 50%, rgba(99,102,241,0.3) 100%)',
        }}
      >
        <div
          className="rounded-[calc(1.5rem-1px)] p-5 space-y-4"
          style={{ background: 'linear-gradient(145deg, #0d0d1f 0%, #080814 100%)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-100">Bridge to Sui</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare rates across 6 bridges
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(111,188,240,0.1)',
                border: '1px solid rgba(111,188,240,0.2)',
                color: '#6FBCF0',
              }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6FBCF0] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#6FBCF0]" />
              </span>
              Sui Mainnet
            </div>
          </div>

          {/* From chain selector */}
          <ChainSelector
            value={fromChainId}
            onChange={(id) => { setFromChainId(id); setQuotes([]) }}
            label="From"
          />

          {/* Token + Amount row */}
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              You send
            </span>
            <div
              className="flex gap-2 mt-1.5 rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(99,102,241,0.2)' }}
            >
              {/* Token selector */}
              <div className="relative">
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="h-full px-3 py-3 text-sm font-semibold text-slate-100 appearance-none pr-7 bg-transparent cursor-pointer outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRight: '1px solid rgba(99,102,241,0.2)',
                    minWidth: '90px',
                  }}
                >
                  {sourceTokens.length > 0 ? (
                    sourceTokens.map((t) => (
                      <option key={t.address} value={t.symbol}
                        style={{ background: '#0D0D1F', color: '#E2E8F0' }}>
                        {t.symbol}
                      </option>
                    ))
                  ) : (
                    <option value="USDC" style={{ background: '#0D0D1F', color: '#E2E8F0' }}>
                      USDC
                    </option>
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
                style={{ background: 'transparent' }}
              />
            </div>
          </div>

          {/* Arrow divider */}
          <div className="flex items-center justify-center">
            <div className="flex-1 h-px" style={{ background: 'rgba(99,102,241,0.1)' }} />
            <div
              className="mx-3 w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #1e1e3a 0%, #12122a 100%)',
                border: '1px solid rgba(99,102,241,0.3)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </div>
            <div className="flex-1 h-px" style={{ background: 'rgba(6,182,212,0.1)' }} />
          </div>

          {/* Destination: always Sui */}
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1.5">
              To
            </span>
            <SuiDestinationBadge />
          </div>

          {/* Recipient address */}
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Recipient address
            </span>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x... (leave blank to use connected wallet)"
              className="w-full mt-1.5 px-4 py-3 rounded-xl text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
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
      </div>

      {/* ── Bridge Quotes ── */}
      <div>
        {loadingQuotes && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl"
            style={{ background: 'rgba(13,13,31,0.6)', border: '1px solid rgba(99,102,241,0.12)' }}>
            <svg className="animate-spin flex-shrink-0" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="#6366F1" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <span className="text-sm text-slate-400">Fetching bridge quotes…</span>
          </div>
        )}

        {quotesError && !loadingQuotes && (
          <div
            className="px-4 py-3 rounded-2xl text-sm"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#FCA5A5',
            }}
          >
            {quotesError}
          </div>
        )}

        {!loadingQuotes && !quotesError && quotes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Available bridges ({quotes.length})
              </span>
              <span className="text-xs text-slate-600">Sorted by best rate</span>
            </div>
            {quotes.map((quote, idx) => (
              <BridgeQuoteItem
                key={quote.bridgeId}
                quote={quote}
                selected={selectedQuoteId === quote.bridgeId}
                isBest={idx === 0}
                onSelect={() => setSelectedQuoteId(quote.bridgeId)}
              />
            ))}
          </div>
        )}

        {!loadingQuotes && !quotesError && quotes.length === 0 && amount && parseFloat(amount) > 0 && (
          <div
            className="px-4 py-6 rounded-2xl text-center"
            style={{
              background: 'rgba(13,13,31,0.6)',
              border: '1px solid rgba(99,102,241,0.12)',
            }}
          >
            <p className="text-sm text-slate-500">
              No bridges available for {fromChain?.name ?? 'this chain'} → Sui
            </p>
          </div>
        )}
      </div>

      {/* ── CTA button ── */}
      <button
        onClick={handleBridge}
        disabled={!canBridge}
        className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-200"
        style={{
          background: canBridge
            ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 40%, #06B6D4 100%)'
            : 'rgba(255,255,255,0.06)',
          color: canBridge ? '#fff' : '#475569',
          cursor: canBridge ? 'pointer' : 'not-allowed',
          border: canBridge ? 'none' : '1px solid rgba(99,102,241,0.1)',
          boxShadow: canBridge
            ? '0 4px 20px rgba(99,102,241,0.4), 0 0 40px rgba(6,182,212,0.15)'
            : 'none',
        }}
        onMouseEnter={(e) => {
          if (!canBridge) return
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.5), 0 0 50px rgba(6,182,212,0.2)'
        }}
        onMouseLeave={(e) => {
          if (!canBridge) return
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4), 0 0 40px rgba(6,182,212,0.15)'
        }}
      >
        {loadingQuotes
          ? 'Fetching quotes…'
          : !amount || parseFloat(amount) <= 0
          ? 'Enter an amount'
          : !selectedQuote
          ? 'Select a bridge'
          : `Bridge via ${selectedQuote.bridgeName}`}
      </button>

      {/* Summary strip */}
      {selectedQuote && (
        <div
          className="rounded-2xl px-4 py-3 space-y-1.5"
          style={{
            background: 'rgba(13,13,31,0.6)',
            border: '1px solid rgba(99,102,241,0.1)',
          }}
        >
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Bridge fee</span>
            <span className="text-slate-300">{formatBridgeFee(selectedQuote.feeUSD)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Gas (estimated)</span>
            <span className="text-slate-300">{formatBridgeFee(selectedQuote.gasCostUSD)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Time estimate</span>
            <span className="text-slate-300">{formatEstimatedTime(selectedQuote.estimatedTime)}</span>
          </div>
          <div
            className="flex justify-between text-xs pt-1.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-slate-400 font-medium">You receive (est.)</span>
            <span className="font-semibold" style={{ color: '#06B6D4' }}>
              {selectedQuote.toAmount > 0n
                ? (Number(selectedQuote.toAmount) / 10 ** (selectedToken?.decimals ?? 6)).toFixed(4)
                : '—'}{' '}
              {fromToken}
            </span>
          </div>
        </div>
      )}

      {/* ── Transaction status (if active) ── */}
      {activeTx && (
        <TransactionStatus
          tx={activeTx}
          onDismiss={() => setActiveTx(null)}
        />
      )}
    </div>
  )
}

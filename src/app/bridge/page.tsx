'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowDown, Clock, Shield, Zap, ChevronDown, ArrowLeftRight, Info,
  History, Flame, Star, TrendingUp,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { CHAIN_IDS, SUPPORTED_CHAINS, BRIDGE_TOKENS } from '@/lib/bridges/types'
import type { BridgeQuote } from '@/lib/bridges/types'
import { getAllBridgeQuotes, formatEstimatedTime, formatBridgeFee } from '@/lib/bridges'
import BridgeTransactionTracker, {
  loadBridgeTxs,
  updateBridgeTx,
  useWormholeStatusPoll,
} from '@/components/bridge/BridgeTransactionTracker'
import type { BridgeTxRecord } from '@/components/bridge/BridgeTransactionTracker'

// ─── Chain icon (uses emoji fallback, robust) ─────────────────────────────────

const CHAIN_ICONS: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM]:  '⟠',
  [CHAIN_IDS.BNB_CHAIN]: '⬡',
  [CHAIN_IDS.ARBITRUM]:  '△',
  [CHAIN_IDS.OPTIMISM]:  '⬤',
  [CHAIN_IDS.POLYGON]:   '⬟',
  [CHAIN_IDS.AVALANCHE]: '▲',
  [CHAIN_IDS.BASE]:      '◉',
  [CHAIN_IDS.SOLANA]:    '◎',
  [CHAIN_IDS.SUI]:       'S',
}

// Source chains (everything except Sui)
const SOURCE_CHAINS = SUPPORTED_CHAINS.filter((c) => c.id !== CHAIN_IDS.SUI)
const SUI_CHAIN = SUPPORTED_CHAINS.find((c) => c.id === CHAIN_IDS.SUI)!

// ─── Chain picker dropdown ─────────────────────────────────────────────────────

function ChainPicker({
  selectedId,
  onSelect,
}: {
  selectedId: number
  onSelect: (id: number) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = SOURCE_CHAINS.find((c) => c.id === selectedId) ?? SOURCE_CHAINS[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-omni-surface2 border border-omni-border hover:border-indigo-500/50 transition-all min-w-[140px]"
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: selected.color + '30', color: selected.color }}
        >
          {CHAIN_ICONS[selected.id]}
        </span>
        <span className="text-white font-medium flex-1 text-left">{selected.name}</span>
        <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="absolute left-0 top-full mt-2 z-40 w-56 rounded-2xl py-2 shadow-2xl"
            style={{
              background: '#0D0D1F',
              border: '1px solid rgba(99,102,241,0.25)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            {SOURCE_CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => { onSelect(chain.id); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: chain.color + '30', color: chain.color }}
                >
                  {CHAIN_ICONS[chain.id]}
                </span>
                <span className="text-sm text-slate-200">{chain.name}</span>
                {chain.id === selectedId && (
                  <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#6366F1" strokeWidth="2.5">
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

// ─── Bridge quote row ─────────────────────────────────────────────────────────

function QuoteRow({
  quote,
  rank,
  selected,
  onSelect,
}: {
  quote: BridgeQuote
  rank: number
  selected: boolean
  onSelect: () => void
}) {
  const receivedPct = quote.fromAmount > 0n
    ? ((Number(quote.toAmount) / Number(quote.fromAmount)) * 100).toFixed(2)
    : '0.00'

  const isBestRate = rank === 0
  const isFastest  = rank === 0  // could be recalculated separately

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left relative"
      style={{
        background: selected ? `${quote.bridgeColor}10` : 'rgba(22,22,48,0.7)',
        borderColor: selected ? `${quote.bridgeColor}50` : '#2A2A5A',
        boxShadow: selected ? `0 0 18px ${quote.bridgeColor}12` : 'none',
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.borderColor = '#2A2A5A'
      }}
    >
      {/* Best badge */}
      {isBestRate && (
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

      {/* Bridge color dot */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: `${quote.bridgeColor}18`, border: `1px solid ${quote.bridgeColor}40` }}
      >
        <span style={{ color: quote.bridgeColor }}>
          {quote.bridgeName.slice(0, 2).toUpperCase()}
        </span>
      </div>

      {/* Name + route */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{quote.bridgeName}</div>
        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
          {/* Estimated arrival */}
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span style={{ color: quote.estimatedTime < 180 ? '#10B981' : '#94A3B8' }}>
            {formatEstimatedTime(quote.estimatedTime)}
          </span>
          <span className="mx-1 text-slate-700">·</span>
          fee {formatBridgeFee(quote.totalCostUSD)}
          {/* Gas cost on destination */}
          {quote.gasCostUSD > 0 && (
            <>
              <span className="mx-1 text-slate-700">·</span>
              <span className="text-slate-600">+{formatBridgeFee(quote.gasCostUSD)} gas</span>
            </>
          )}
        </div>
      </div>

      {/* Received % */}
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-bold text-white">{receivedPct}%</div>
        <div className="text-xs text-slate-500">received</div>
      </div>
    </button>
  )
}

// ─── Best route recommendation pill ──────────────────────────────────────────

function BestRoutePill({ quote }: { quote: BridgeQuote }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{
        background: `${quote.bridgeColor}10`,
        border: `1px solid ${quote.bridgeColor}25`,
      }}
    >
      <Star className="w-3 h-3 flex-shrink-0" style={{ color: quote.bridgeColor }} />
      <span className="text-xs text-slate-400">
        Best route:
      </span>
      <span className="text-xs font-semibold" style={{ color: quote.bridgeColor }}>
        {quote.bridgeName}
      </span>
      <span className="text-slate-700 text-xs">·</span>
      <span className="text-xs text-slate-400">
        arrives in {formatEstimatedTime(quote.estimatedTime)}
      </span>
      <TrendingUp className="w-3 h-3 ml-auto flex-shrink-0 text-emerald-400" />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BridgePage() {
  const [fromChainId, setFromChainId] = useState<number>(CHAIN_IDS.ETHEREUM)
  const [amount, setAmount] = useState('')
  const [selectedBridgeId, setSelectedBridgeId] = useState<string | null>(null)
  const [quotes, setQuotes] = useState<BridgeQuote[]>([])
  const [loadingQuotes, setLoadingQuotes] = useState(false)

  // Recent transactions from localStorage
  const [recentTxs, setRecentTxs] = useState<BridgeTxRecord[]>([])
  const [txsHydrated, setTxsHydrated] = useState(false)

  useEffect(() => {
    setTxsHydrated(true)
    // Newest first; show only the 3 most recent
    const all = loadBridgeTxs()
    setRecentTxs(all.slice().reverse().slice(0, 3))
  }, [])

  // Poll Wormhole scan for in-progress transactions
  const handleTxUpdate = useCallback((id: string, patch: Partial<BridgeTxRecord>) => {
    updateBridgeTx(id, patch)
    setRecentTxs((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  useWormholeStatusPoll(recentTxs, handleTxUpdate)

  // Source tokens for selected chain
  const sourceTokens = BRIDGE_TOKENS.filter((t) => t.chainId === fromChainId)
  const [fromToken, setFromToken] = useState('USDC')
  useEffect(() => {
    if (!sourceTokens.find((t) => t.symbol === fromToken)) {
      setFromToken(sourceTokens[0]?.symbol ?? 'USDC')
    }
  }, [fromChainId]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedToken = sourceTokens.find((t) => t.symbol === fromToken)
  const selectedQuote = quotes.find((q) => q.bridgeId === selectedBridgeId) ?? quotes[0] ?? null
  const fromChain = SOURCE_CHAINS.find((c) => c.id === fromChainId) ?? SOURCE_CHAINS[0]

  const fetchQuotes = useCallback(async () => {
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0 || !selectedToken) { setQuotes([]); return }

    setLoadingQuotes(true)
    try {
      const amountBigInt = BigInt(Math.floor(parsed * 10 ** selectedToken.decimals))
      const results = await getAllBridgeQuotes({
        fromChainId,
        toChainId: CHAIN_IDS.SUI,
        fromToken: selectedToken.address,
        toToken: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
        amount: amountBigInt,
        recipient: '0x0000000000000000000000000000000000000001',
      })
      setQuotes(results)
      setSelectedBridgeId(results[0]?.bridgeId ?? null)
    } catch (err) {
      console.error('Bridge quotes error:', err)
      setQuotes([])
    } finally {
      setLoadingQuotes(false)
    }
  }, [amount, fromChainId, selectedToken])

  useEffect(() => {
    const id = setTimeout(fetchQuotes, 700)
    return () => clearTimeout(id)
  }, [fetchQuotes])

  const canBridge = !!selectedQuote && !!amount && parseFloat(amount) > 0

  const handleBridge = () => {
    if (!selectedQuote) return
    window.open(selectedQuote.url, '_blank', 'noopener,noreferrer')
  }

  const activeTxCount = recentTxs.filter(
    (t) => t.status !== 'complete' && t.status !== 'failed'
  ).length

  return (
    <div className="relative min-h-screen py-16 px-4 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl animate-blob pointer-events-none" />
      <div className="absolute top-60 right-1/4 w-72 h-72 bg-cyan-500/8 rounded-full blur-3xl animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute bottom-32 left-1/2 w-64 h-64 bg-violet-600/6 rounded-full blur-3xl animate-blob animation-delay-4000 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              color: '#818CF8',
            }}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Cross-Chain Bridge Aggregator · 6 bridges
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Bridge to Sui
          </h1>
          <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
            Move assets from any major chain to Sui. We compare live quotes across
            Wormhole, LayerZero, Celer, Mayan, Axelar, and AllBridge.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">

          {/* ── Left: bridge form ── */}
          <div className="w-full lg:max-w-[480px] space-y-4">

            {/* Main card */}
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
                {/* Card header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-100">Bridge Assets</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Best rate auto-selected</p>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      color: '#10B981',
                    }}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                    Live quotes
                  </div>
                </div>

                {/* FROM section */}
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
                    From
                  </label>
                  <div className="flex gap-2">
                    <ChainPicker selectedId={fromChainId} onSelect={(id) => { setFromChainId(id); setQuotes([]) }} />

                    {/* Token + amount */}
                    <div
                      className="flex-1 flex rounded-xl overflow-hidden"
                      style={{ border: '1px solid #2A2A5A' }}
                    >
                      <select
                        value={fromToken}
                        onChange={(e) => setFromToken(e.target.value)}
                        className="px-3 py-3 text-sm font-semibold text-white appearance-none bg-transparent outline-none cursor-pointer"
                        style={{
                          background: 'rgba(22,22,48,0.8)',
                          borderRight: '1px solid #2A2A5A',
                          minWidth: '72px',
                        }}
                      >
                        {sourceTokens.map((t) => (
                          <option key={t.address} value={t.symbol}
                            style={{ background: '#0D0D1F', color: '#E2E8F0' }}>
                            {t.symbol}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="flex-1 px-4 py-3 text-lg font-bold text-white placeholder-slate-700 bg-transparent outline-none text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #1e1e3a 0%, #12122a 100%)',
                      border: '1px solid rgba(99,102,241,0.3)',
                    }}
                  >
                    <ArrowDown className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>

                {/* TO section (always Sui) */}
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">
                    To
                  </label>
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: 'rgba(111,188,240,0.06)',
                      border: '1px solid rgba(111,188,240,0.25)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: `${SUI_CHAIN.color}30`, color: SUI_CHAIN.color }}
                    >
                      {CHAIN_ICONS[CHAIN_IDS.SUI]}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{SUI_CHAIN.name}</div>
                      <div className="text-xs text-slate-500">{SUI_CHAIN.symbol} · Mainnet</div>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(111,188,240,0.12)', color: '#6FBCF0' }}
                    >
                      Destination
                    </span>
                  </div>
                </div>

                {/* Best route recommendation */}
                {selectedQuote && amount && parseFloat(amount) > 0 && (
                  <BestRoutePill quote={selectedQuote} />
                )}

                {/* Best rate summary */}
                {selectedQuote && amount && parseFloat(amount) > 0 && (
                  <div
                    className="p-3 rounded-xl space-y-1.5"
                    style={{
                      background: 'rgba(16,185,129,0.06)',
                      border: '1px solid rgba(16,185,129,0.2)',
                    }}
                  >
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Best via</span>
                      <span className="font-medium" style={{ color: selectedQuote.bridgeColor }}>
                        {selectedQuote.bridgeName}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">You receive</span>
                      <span className="text-white font-semibold">
                        {(Number(selectedQuote.toAmount) / 10 ** (selectedToken?.decimals ?? 6)).toFixed(4)} {fromToken}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Bridge fee</span>
                      <span className="text-slate-300">{formatBridgeFee(selectedQuote.feeUSD)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Gas on Sui (claim)</span>
                      <span className="text-slate-300">
                        {selectedQuote.gasCostUSD > 0 ? formatBridgeFee(selectedQuote.gasCostUSD) : 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs pt-1" style={{ borderTop: '1px solid rgba(16,185,129,0.15)' }}>
                      <span className="text-slate-500">Total cost</span>
                      <span className="text-slate-300">{formatBridgeFee(selectedQuote.totalCostUSD)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Arrives in</span>
                      <span
                        className="font-semibold"
                        style={{ color: selectedQuote.estimatedTime < 180 ? '#10B981' : '#94A3B8' }}
                      >
                        {formatEstimatedTime(selectedQuote.estimatedTime)}
                      </span>
                    </div>
                  </div>
                )}

                {/* CTA */}
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
                    e.currentTarget.style.boxShadow =
                      '0 8px 30px rgba(99,102,241,0.5), 0 0 50px rgba(6,182,212,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    if (!canBridge) return
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow =
                      '0 4px 20px rgba(99,102,241,0.4), 0 0 40px rgba(6,182,212,0.15)'
                  }}
                >
                  {loadingQuotes
                    ? 'Fetching quotes…'
                    : !amount || parseFloat(amount) <= 0
                    ? 'Enter an amount'
                    : !selectedQuote
                    ? 'No routes found'
                    : `Bridge via ${selectedQuote.bridgeName} · ${formatEstimatedTime(selectedQuote.estimatedTime)}`}
                </button>
              </div>
            </div>

            {/* Bridge quotes list */}
            {(quotes.length > 0 || loadingQuotes) && (
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Bridge Providers
                  </h3>
                  {loadingQuotes && (
                    <svg className="animate-spin w-4 h-4 text-indigo-400" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                  )}
                </div>

                {quotes.map((quote, i) => (
                  <QuoteRow
                    key={quote.bridgeId}
                    quote={quote}
                    rank={i}
                    selected={selectedBridgeId === quote.bridgeId}
                    onSelect={() => setSelectedBridgeId(quote.bridgeId)}
                  />
                ))}
              </div>
            )}

            {/* Recent transactions section */}
            {txsHydrated && recentTxs.length > 0 && (
              <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Recent Transactions
                    </h3>
                    {activeTxCount > 0 && (
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8' }}
                      >
                        {activeTxCount} active
                      </span>
                    )}
                  </div>
                  <Link
                    href="/bridge/history"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    View all →
                  </Link>
                </div>

                <BridgeTransactionTracker
                  transactions={recentTxs}
                  onDismiss={(id) => setRecentTxs((prev) => prev.filter((t) => t.id !== id))}
                  activeOnly={false}
                />
              </div>
            )}

            {/* Empty state for bridge transactions */}
            {txsHydrated && recentTxs.length === 0 && (
              <div className="glass-card">
                <EmptyState
                  icon={<ArrowLeftRight size={24} style={{ color: '#6366F1' }} />}
                  title="No bridge transactions"
                  description="Your cross-chain transfers will appear here once you initiate a bridge."
                />
              </div>
            )}

            {/* Warning */}
            <div
              className="flex gap-2.5 p-4 rounded-2xl"
              style={{
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/70">
                OmniWeave shows bridge quotes only — you complete the transaction
                on the bridge&apos;s own UI. Always verify the destination address.
                Cross-chain transfers are irreversible.
              </p>
            </div>
          </div>

          {/* ── Right: info panel ── */}
          <div className="w-full lg:max-w-[360px] space-y-4">

            {/* Supported bridges */}
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-slate-200 mb-4">Supported Bridges</h2>
              <div className="space-y-3">
                {BRIDGE_INFO.map((b) => (
                  <div key={b.id} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: `${b.color}18`,
                        border: `1px solid ${b.color}35`,
                        color: b.color,
                      }}
                    >
                      {b.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200">{b.name}</span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-medium"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
                        >
                          Live
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{b.desc}</p>
                    </div>
                    {/* Estimated time badge */}
                    <div
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8' }}
                    >
                      <Clock className="w-3 h-3" />
                      {b.eta}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-slate-200 mb-4">How it works</h2>
              <div className="space-y-4">
                {HOW_IT_WORKS.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{
                        background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                        color: '#fff',
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200">{step.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust indicators */}
            <div className="glass-card p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    <Shield className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-xs text-slate-400">Audited</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}
                  >
                    <Zap className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-xs text-slate-400">Fast routes</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
                  >
                    <ArrowLeftRight className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-xs text-slate-400">6 bridges</span>
                </div>
              </div>
            </div>

            {/* History shortcut */}
            <Link
              href="/bridge/history"
              className="glass-card p-4 flex items-center gap-3 transition-all hover:border-indigo-500/30 block"
              style={{ textDecoration: 'none' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                <History className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Bridge History</div>
                <div className="text-xs text-slate-500 mt-0.5">Track past & in-progress transfers</div>
              </div>
              <svg className="ml-auto w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Static content ────────────────────────────────────────────────────────────

const BRIDGE_INFO = [
  { id: 'wormhole',   name: 'Wormhole',       color: '#7C3AED', eta: '~15m', desc: 'EVM + Solana → Sui · CCTP USDC · 1-15 min' },
  { id: 'layerzero',  name: 'LayerZero',       color: '#3B82F6', eta: '~2m',  desc: 'EVM → Sui via Stargate V3 OFT · 1-5 min' },
  { id: 'celer',      name: 'Celer cBridge',   color: '#00D395', eta: '~10m', desc: 'EVM → Sui lock-and-mint · ETH, USDC, WBTC' },
  { id: 'mayan',      name: 'Mayan Finance',   color: '#14B8A6', eta: '~3m',  desc: 'Solana + EVM → Sui auction · ~1-10 min' },
  { id: 'axelar',     name: 'Axelar',          color: '#4F46E5', eta: '~5m',  desc: 'EVM → Sui via ITS · live May 2025' },
  { id: 'allbridge',  name: 'AllBridge Core',  color: '#FF6B6B', eta: '~2m',  desc: 'Solana + EVM → Sui · CCTP zero-slippage' },
]

const HOW_IT_WORKS = [
  { title: 'Select chain & token',    desc: 'Choose which chain and asset you want to bridge to Sui.' },
  { title: 'Compare bridge quotes',   desc: 'We fetch live rates from all 6 bridges simultaneously.' },
  { title: 'Pick the best option',    desc: 'We auto-select the best rate — or choose any bridge manually.' },
  { title: 'Complete on bridge UI',   desc: 'Click "Bridge Now" to sign the transaction on the bridge\'s secure interface.' },
]

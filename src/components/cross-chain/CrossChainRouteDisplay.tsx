'use client'

import { formatEstimatedTime, formatBridgeFee } from '@/lib/bridges'
import type { CrossChainQuote, CrossChainStep } from '@/lib/crossChainQuote'
import { SUI_TOKENS } from '@/lib/tokens'
import { BRIDGE_TOKENS } from '@/lib/bridges/types'

// ─── Token logo helper ────────────────────────────────────────────────────────

function TokenLogo({ address, symbol, size = 28 }: { address: string; symbol: string; size?: number }) {
  // Check SUI_TOKENS first, then BRIDGE_TOKENS
  const suiToken = SUI_TOKENS.find(
    (t) => t.address.toLowerCase() === address.toLowerCase() || t.symbol === symbol
  )
  const bridgeToken = BRIDGE_TOKENS.find(
    (t) => t.address.toLowerCase() === address.toLowerCase() || t.symbol === symbol
  )
  const logoURI = suiToken?.logoURI ?? bridgeToken?.logoUrl

  if (!logoURI) {
    return (
      <div
        className="rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
        }}
      >
        {symbol.slice(0, 2)}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoURI}
      alt={symbol}
      width={size}
      height={size}
      className="rounded-full flex-shrink-0 object-contain"
      style={{ width: size, height: size }}
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
  )
}

// ─── Step connector ───────────────────────────────────────────────────────────

function StepConnector({
  label,
  sublabel,
  color,
  icon,
}: {
  label: string
  sublabel: string
  color: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 my-1 pl-3">
      {/* Vertical line + icon */}
      <div className="flex flex-col items-center" style={{ minWidth: 28 }}>
        <div className="w-px flex-1 min-h-[8px]" style={{ background: `${color}40` }} />
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `${color}18`,
            border: `1px solid ${color}40`,
          }}
        >
          {icon}
        </div>
        <div className="w-px flex-1 min-h-[8px]" style={{ background: `${color}40` }} />
      </div>

      {/* Label */}
      <div
        className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl"
        style={{
          background: `${color}08`,
          border: `1px solid ${color}20`,
        }}
      >
        <span className="text-xs font-semibold" style={{ color }}>
          {label}
        </span>
        <span className="text-xs text-slate-500">{sublabel}</span>
      </div>
    </div>
  )
}

// ─── Single token node ────────────────────────────────────────────────────────

function TokenNode({
  symbol,
  address,
  chainLabel,
  highlight,
}: {
  symbol: string
  address: string
  chainLabel?: string
  highlight?: 'indigo' | 'cyan'
}) {
  const borderColor =
    highlight === 'indigo'
      ? 'rgba(99,102,241,0.4)'
      : highlight === 'cyan'
      ? 'rgba(6,182,212,0.4)'
      : 'rgba(255,255,255,0.12)'
  const bg =
    highlight === 'indigo'
      ? 'rgba(99,102,241,0.12)'
      : highlight === 'cyan'
      ? 'rgba(6,182,212,0.12)'
      : 'rgba(255,255,255,0.04)'

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
      style={{ background: bg, border: `1px solid ${borderColor}` }}
    >
      <TokenLogo address={address} symbol={symbol} size={24} />
      <div>
        <div className="text-sm font-semibold text-slate-100">{symbol}</div>
        {chainLabel && <div className="text-xs text-slate-500">{chainLabel}</div>}
      </div>
    </div>
  )
}

// ─── Bridge step ──────────────────────────────────────────────────────────────

function BridgeStep({ step }: { step: Extract<CrossChainStep, { type: 'bridge' }> }) {
  const amberColor = '#F59E0B'
  const time = formatEstimatedTime(step.bridge.estimatedTime)
  const fee  = formatBridgeFee(step.bridge.totalCostUSD)

  return (
    <StepConnector
      color={amberColor}
      label={`${step.bridge.bridgeName} Bridge`}
      sublabel={`${time} · ${fee}`}
      icon={
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={amberColor} strokeWidth="2.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      }
    />
  )
}

// ─── DEX swap step ────────────────────────────────────────────────────────────

function SwapStep({ step }: { step: Extract<CrossChainStep, { type: 'swap' }> }) {
  const cyanColor = '#06B6D4'
  const dexLabel = step.dexId
    ? step.dexId.charAt(0).toUpperCase() + step.dexId.slice(1)
    : 'Cetus'

  return (
    <StepConnector
      color={cyanColor}
      label={`${dexLabel} Swap`}
      sublabel="~2s · 0.05%"
      icon={
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={cyanColor} strokeWidth="2.5">
          <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      }
    />
  )
}

// ─── Summary footer ───────────────────────────────────────────────────────────

function RouteSummary({
  quote,
  outputSymbol,
  outputDecimals,
}: {
  quote: CrossChainQuote
  outputSymbol: string
  outputDecimals: number
}) {
  const timeStr  = formatEstimatedTime(quote.totalTimeSeconds)
  const feeStr   = formatBridgeFee(quote.totalFeeUSD)
  const outputNum = Number(quote.estimatedOutput) / 10 ** outputDecimals

  return (
    <div
      className="mt-3 grid grid-cols-3 gap-2 pt-3"
      style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}
    >
      <div className="text-center">
        <div className="text-xs text-slate-500 mb-1">Total time</div>
        <div className="text-sm font-semibold text-amber-400">{timeStr}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-slate-500 mb-1">Total fees</div>
        <div className="text-sm font-semibold text-slate-300">{feeStr}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-slate-500 mb-1">You receive</div>
        <div className="text-sm font-semibold text-cyan-400">
          {outputNum.toFixed(4)} {outputSymbol}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CrossChainRouteDisplayProps {
  quote: CrossChainQuote
  /** Symbol shown at the top (source chain token) */
  sourceSymbol: string
  /** Readable source chain name, e.g. "Ethereum" */
  sourceChainName: string
  /** Source token address (for logo lookup) */
  sourceAddress: string
  /** Desired output token */
  outputSymbol: string
  outputDecimals: number
  outputAddress: string
}

export default function CrossChainRouteDisplay({
  quote,
  sourceSymbol,
  sourceChainName,
  sourceAddress,
  outputSymbol,
  outputDecimals,
  outputAddress,
}: CrossChainRouteDisplayProps) {
  // Resolve the intermediate (bridge output) token symbol for display
  const intermediateToken = SUI_TOKENS.find(
    (t) => t.address.toLowerCase() === quote.intermediateToken.toLowerCase()
  )
  const intermediateSymbol = intermediateToken?.symbol ?? 'wToken'

  const hasSwapStep = !!quote.swapQuote

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(13,13,31,0.7)',
        border: '1px solid rgba(99,102,241,0.15)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Route Breakdown
        </span>
      </div>

      {/* Route visualization */}
      <div className="space-y-0.5">
        {/* Source token */}
        <TokenNode
          symbol={sourceSymbol}
          address={sourceAddress}
          chainLabel={`on ${sourceChainName}`}
          highlight="indigo"
        />

        {/* Steps */}
        {quote.steps.map((step, idx) => {
          if (step.type === 'bridge') {
            return (
              <BridgeStep key={`bridge-${idx}`} step={step} />
            )
          }
          return (
            <SwapStep key={`swap-${idx}`} step={step} />
          )
        })}

        {/* Intermediate token (shown if there's a subsequent DEX swap) */}
        {hasSwapStep && (
          <>
            <TokenNode
              symbol={intermediateSymbol}
              address={quote.intermediateToken}
              chainLabel="on Sui"
            />
            {/* The swap step arrow is already rendered in the steps loop above */}
          </>
        )}

        {/* Final output token */}
        <TokenNode
          symbol={outputSymbol}
          address={outputAddress}
          chainLabel="on Sui"
          highlight="cyan"
        />
      </div>

      {/* Summary */}
      <RouteSummary
        quote={quote}
        outputSymbol={outputSymbol}
        outputDecimals={outputDecimals}
      />

      {/* Attribution */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="text-xs text-slate-600">Powered by</span>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: '#A78BFA' }}
        >
          Wormhole
        </span>
        <span className="text-xs text-slate-700">+</span>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}
        >
          Cetus
        </span>
      </div>
    </div>
  )
}

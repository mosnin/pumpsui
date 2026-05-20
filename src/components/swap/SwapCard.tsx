'use client'

import { useState, useCallback, useMemo } from 'react'
import { Transaction } from '@mysten/sui/transactions'
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit'
import { useSwap } from '@/hooks/useSwap'
import { useTokenPrice } from '@/hooks/useTokenPrices'
import { Token } from '@/lib/tokens'
import { PRICE_IMPACT_DANGER_THRESHOLD, PRICE_IMPACT_WARNING_THRESHOLD } from '@/lib/constants'
import { buildAggregatedSwapTx } from '@/lib/routing/transactionBuilder'
import { analyzeSandwichRisk, estimateSandwichProfit } from '@/lib/mev'
import { PRIVATE_ORDER_THRESHOLD_USD } from '@/lib/privateOrderFlow'
import TokenSelector from './TokenSelector'
import TokenModal from './TokenModal'
import RouteDisplay from './RouteDisplay'
import SlippageSettings from './SlippageSettings'
import { ConfirmSwapModal } from './ConfirmSwapModal'
import GaslessBadge from './GaslessBadge'
import { MEVProtectionBadge } from './MEVProtectionBadge'
import { PrivateOrderModal } from './PrivateOrderModal'

type ModalTarget = 'in' | 'out' | null

export function SwapCard() {
  const swap = useSwap()
  const account = useCurrentAccount()
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null)
  const [flipping, setFlipping] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [gaslessMode, setGaslessMode] = useState(true)
  const [privateOrderOpen, setPrivateOrderOpen] = useState(false)

  const priceIn = useTokenPrice(swap.tokenIn?.coingeckoId)
  const priceOut = useTokenPrice(swap.tokenOut?.coingeckoId)

  const { data: balanceData } = useSuiClientQuery(
    'getBalance',
    { owner: account?.address ?? '', coinType: swap.tokenIn?.address ?? '0x2::sui::SUI' },
    { enabled: !!account && !!swap.tokenIn }
  )
  const maxBalance = balanceData
    ? Number(balanceData.totalBalance) / 10 ** (swap.tokenIn?.decimals ?? 9)
    : 0

  const usdIn =
    priceIn !== null && swap.amountIn && parseFloat(swap.amountIn) > 0
      ? priceIn * parseFloat(swap.amountIn)
      : null
  const usdOut =
    priceOut !== null && swap.amountOut && parseFloat(swap.amountOut) > 0
      ? priceOut * parseFloat(swap.amountOut)
      : null

  const handleFlip = useCallback(() => {
    if (flipping) return
    setFlipping(true)
    swap.flipTokens()
    setTimeout(() => setFlipping(false), 300)
  }, [flipping, swap])

  const handleTokenSelect = useCallback(
    (token: Token) => {
      if (modalTarget === 'in') swap.setTokenIn(token)
      else if (modalTarget === 'out') swap.setTokenOut(token)
      setModalTarget(null)
    },
    [modalTarget, swap],
  )

  const handleMax = useCallback(() => {
    if (maxBalance > 0) {
      swap.setAmountIn(maxBalance.toString())
    }
  }, [swap, maxBalance])

  const priceImpact = swap.quote?.priceImpact ?? 0
  const isHighImpact = priceImpact >= PRICE_IMPACT_WARNING_THRESHOLD
  const isDangerImpact = priceImpact >= PRICE_IMPACT_DANGER_THRESHOLD

  // MEV risk analysis — only when we have a live quote and USD value
  const mevRisk = useMemo(() => {
    if (!swap.quote || !usdIn || usdIn <= 0) return null
    return analyzeSandwichRisk({
      tokenIn: swap.tokenIn?.address ?? '',
      tokenOut: swap.tokenOut?.address ?? '',
      amountUsd: usdIn,
      // Assume pool liquidity ~500× trade size as a conservative floor; real data
      // would come from the DEX pool response.
      poolLiquidityUsd: Math.max(usdIn * 50, 100_000),
      slippageBps: swap.settings.slippageBps,
      priceImpactBps: Math.round(swap.quote.priceImpact * 100),
    })
  }, [swap.quote, usdIn, swap.tokenIn?.address, swap.tokenOut?.address, swap.settings.slippageBps])

  const showPrivateOrderFlow =
    swap.settings.mevProtection &&
    usdIn !== null &&
    usdIn >= PRIVATE_ORDER_THRESHOLD_USD

  const privateOrder = useMemo(() => {
    if (!swap.tokenIn || !swap.tokenOut || !swap.amountIn || !swap.quote || !account?.address) {
      return null
    }
    const amountInRaw = BigInt(Math.round(parseFloat(swap.amountIn) * 10 ** (swap.tokenIn.decimals ?? 9)))
    const minOut = BigInt(Math.round(parseFloat(swap.quote.amountOut) * 10 ** (swap.tokenOut.decimals ?? 9)))
    return {
      tokenIn: swap.tokenIn.address,
      tokenOut: swap.tokenOut.address,
      amountIn: amountInRaw,
      minAmountOut: minOut,
      deadline: Math.floor(Date.now() / 1000) + 300,
      userAddress: account.address,
    }
  }, [swap.tokenIn, swap.tokenOut, swap.amountIn, swap.quote, account?.address])

  const canSwap =
    swap.tokenIn &&
    swap.tokenOut &&
    swap.amountIn &&
    parseFloat(swap.amountIn) > 0 &&
    swap.quote &&
    !swap.loading &&
    !swap.swapping

  const ctaLabel = swap.swapping
    ? 'Swapping…'
    : swap.loading
    ? 'Fetching quote…'
    : !swap.tokenIn || !swap.tokenOut
    ? 'Select tokens'
    : !swap.amountIn || parseFloat(swap.amountIn) <= 0
    ? 'Enter an amount'
    : swap.error
    ? 'Retry'
    : isDangerImpact
    ? 'Swap anyway'
    : 'Swap'

  return (
    <>
      {/* Gradient border wrapper */}
      <div
        className="w-full max-w-md mx-auto rounded-3xl p-px"
        style={{
          background:
            'linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(6,182,212,0.4) 50%, rgba(99,102,241,0.3) 100%)',
        }}
      >
        <div
          className="rounded-[calc(1.5rem-1px)] p-5"
          style={{
            background: 'linear-gradient(145deg, #0d0d1f 0%, #080814 100%)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-lg font-bold" style={{ color: '#E2E8F0' }}>
                Swap
              </h1>
              {swap.quote && swap.tokenIn && swap.tokenOut && (
                <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                  1&nbsp;{swap.tokenIn.symbol}&nbsp;={' '}
                  {swap.quote.exchangeRate.toFixed(4)}&nbsp;{swap.tokenOut.symbol}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {swap.settings.mevProtection && (
                <span
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    background: 'rgba(16,185,129,0.12)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    color: '#10B981',
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  MEV Shield
                </span>
              )}
              <SlippageSettings settings={swap.settings} onUpdate={swap.updateSettings} />
            </div>
          </div>

          {/* Token In */}
          <TokenSelector
            token={swap.tokenIn}
            amount={swap.amountIn}
            onAmountChange={swap.setAmountIn}
            onTokenClick={() => setModalTarget('in')}
            usdValue={usdIn}
            balance={account ? maxBalance.toFixed(4) : undefined}
            onMax={handleMax}
            label="You pay"
          />

          {/* Flip button */}
          <div className="flex items-center justify-center my-2 relative">
            <div
              className="absolute inset-x-0 h-px"
              style={{ background: 'rgba(99,102,241,0.1)' }}
            />
            <button
              onClick={handleFlip}
              className="relative z-10 w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #1e1e3a 0%, #12122a 100%)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#6366F1',
                transform: flipping ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 300ms ease, box-shadow 150ms',
                boxShadow: '0 2px 12px rgba(99,102,241,0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)'
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(99,102,241,0.2)'
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'
              }}
              title="Flip tokens"
            >
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              >
                <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* Token Out */}
          <TokenSelector
            token={swap.tokenOut}
            amount={swap.amountOut}
            onAmountChange={swap.setAmountOut}
            onTokenClick={() => setModalTarget('out')}
            usdValue={usdOut}
            balance="52.34"
            label="You receive"
            loading={swap.loading}
          />

          {/* Price impact warning */}
          {isHighImpact && swap.quote && (
            <div
              className="mt-3 flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-xs"
              style={{
                background: isDangerImpact
                  ? 'rgba(239,68,68,0.1)'
                  : 'rgba(245,158,11,0.1)',
                border: `1px solid ${isDangerImpact ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                color: isDangerImpact ? '#FCA5A5' : '#FDE68A',
              }}
            >
              <svg
                className="flex-shrink-0 mt-0.5"
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>
                {isDangerImpact
                  ? `High price impact of ${priceImpact.toFixed(2)}%. You may lose a significant portion of your funds.`
                  : `Price impact of ${priceImpact.toFixed(2)}%. Consider trading a smaller amount.`}
              </span>
            </div>
          )}

          {/* Error display */}
          {swap.error && !swap.loading && (
            <div
              className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#FCA5A5',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {swap.error}
            </div>
          )}

          {/* MEV protection badge — shown when MEV protection is on and we have a quote */}
          {swap.settings.mevProtection && mevRisk && usdIn !== null && (
            <MEVProtectionBadge
              risk={mevRisk}
              tradeAmountUsd={usdIn}
              onSwitchToPrivate={() => setPrivateOrderOpen(true)}
            />
          )}

          {/* Gasless badge */}
          <div className="mt-3">
            <GaslessBadge gaslessMode={gaslessMode} onToggle={setGaslessMode} />
          </div>

          {/* CTA Button */}
          <button
            onClick={canSwap ? () => setConfirmOpen(true) : undefined}
            disabled={!canSwap}
            className="w-full mt-4 py-4 rounded-2xl font-bold text-base relative overflow-hidden"
            style={{
              background: !canSwap
                ? 'rgba(255,255,255,0.06)'
                : isDangerImpact
                ? 'linear-gradient(135deg, #DC2626, #EF4444)'
                : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 40%, #06B6D4 100%)',
              color: !canSwap ? '#475569' : '#fff',
              cursor: !canSwap ? 'not-allowed' : 'pointer',
              border: !canSwap ? '1px solid rgba(99,102,241,0.1)' : 'none',
              boxShadow: canSwap
                ? isDangerImpact
                  ? '0 4px 20px rgba(239,68,68,0.4)'
                  : '0 4px 20px rgba(99,102,241,0.4), 0 0 40px rgba(6,182,212,0.15)'
                : 'none',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => {
              if (!canSwap) return
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = isDangerImpact
                ? '0 8px 30px rgba(239,68,68,0.5)'
                : '0 8px 30px rgba(99,102,241,0.5), 0 0 50px rgba(6,182,212,0.2)'
            }}
            onMouseLeave={(e) => {
              if (!canSwap) return
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = isDangerImpact
                ? '0 4px 20px rgba(239,68,68,0.4)'
                : '0 4px 20px rgba(99,102,241,0.4), 0 0 40px rgba(6,182,212,0.15)'
            }}
          >
            {swap.swapping || swap.loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin"
                  width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                >
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

      {/* Route display below the card */}
      {swap.quote && swap.tokenIn && swap.tokenOut && (
        <div className="w-full max-w-md mx-auto mt-3">
          <RouteDisplay
            quote={swap.quote}
            tokenIn={swap.tokenIn}
            tokenOut={swap.tokenOut}
          />
        </div>
      )}

      {/* Token selection modal */}
      <TokenModal
        open={modalTarget !== null}
        onClose={() => setModalTarget(null)}
        onSelect={handleTokenSelect}
        excludeAddress={
          modalTarget === 'in' ? swap.tokenOut?.address : swap.tokenIn?.address
        }
      />

      {/* Confirm swap modal — only mounted when we have the required data */}
      {swap.tokenIn && swap.tokenOut && swap.quote && (
        <ConfirmSwapModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          tokenIn={swap.tokenIn}
          tokenOut={swap.tokenOut}
          amountIn={swap.amountIn}
          amountOut={swap.amountOut}
          priceImpact={swap.quote.priceImpact}
          route={swap.quote}
          slippageBps={swap.settings.slippageBps}
          onBuildTx={() => {
            if (!swap.rawQuote || !account?.address) return new Transaction()
            return buildAggregatedSwapTx(
              swap.rawQuote,
              '', // coinIn object ID — will be resolved from wallet coins
              account.address,
              swap.settings.slippageBps,
              {
                configObjectId: process.env.NEXT_PUBLIC_CONFIG_OBJECT_ID ?? '0x0',
                treasuryObjectId: process.env.NEXT_PUBLIC_TREASURY_OBJECT_ID ?? '0x0',
              },
            )
          }}
          onSwapAgain={() => {
            swap.setAmountIn('')
          }}
        />
      )}
    </>
  )
}

// Default export for `import SwapCard from './SwapCard'` compatibility
export default SwapCard

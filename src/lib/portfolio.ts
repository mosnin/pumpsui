export interface PortfolioSnapshot {
  timestamp: string // ISO date
  totalValueUsd: number
  holdings: Record<string, { amount: number; valueUsd: number }>
}

export interface Trade {
  id: string
  timestamp: string
  tokenIn: string
  tokenOut: string
  amountIn: number
  amountOut: number
  amountInUsd: number
  amountOutUsd: number
  pnlUsd: number // realized P&L (amountOutUsd - amountInUsd)
  pnlPercent: number
  txHash: string
  dex: string
}

export interface PortfolioStats {
  totalValueUsd: number
  totalPnlUsd: number
  totalPnlPercent: number
  dayPnlUsd: number
  weekPnlUsd: number
  monthPnlUsd: number
  bestTrade: Trade | null
  worstTrade: Trade | null
  totalTrades: number
  winRate: number // % trades profitable
  avgTradeSize: number // USD
}

// Seeded pseudo-random for deterministic demo data
function seededRand(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return ((s >>> 0) / 0xffffffff)
  }
}

// Generate 90 days of realistic demo portfolio history
export function generatePortfolioHistory(currentValue: number): PortfolioSnapshot[] {
  const snapshots: PortfolioSnapshot[] = []
  const now = Date.now()
  let value = currentValue * 0.6 // started at 60% of current

  const rand = seededRand(42)

  for (let i = 89; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000)
    // Random walk with slight upward bias
    value *= 1 + (rand() - 0.45) * 0.05
    snapshots.push({
      timestamp: date.toISOString(),
      totalValueUsd: Math.round(value * 100) / 100,
      holdings: {
        SUI: { amount: (value * 0.6) / 1.2, valueUsd: value * 0.6 },
        USDC: { amount: value * 0.25, valueUsd: value * 0.25 },
        CETUS: { amount: (value * 0.15) / 0.05, valueUsd: value * 0.15 },
      },
    })
  }
  return snapshots
}

// Generate demo trade history
export function generateTradeHistory(): Trade[] {
  const pairs: [string, string][] = [
    ['SUI', 'USDC'],
    ['USDC', 'SUI'],
    ['SUI', 'CETUS'],
    ['CETUS', 'SUI'],
    ['USDC', 'WETH'],
    ['WETH', 'SUI'],
  ]

  const dexes = ['Cetus', 'Turbos', 'DeepBook', 'Aftermath', 'FlowX']

  const rand = seededRand(99)

  const now = Date.now()
  const trades: Trade[] = []

  const sizes = [120, 250, 500, 1000, 2500, 5000, 10000]
  // Mix of winning and losing trades — 65% win rate
  const pnlMultipliers = [
    0.03, 0.07, 0.12, 0.22, 0.05, -0.04, 0.15, -0.09, 0.08, 0.19,
    -0.06, 0.11, 0.03, -0.12, 0.25, -0.03, 0.09, 0.04, -0.08, 0.16,
  ]

  for (let i = 0; i < 20; i++) {
    const pair = pairs[Math.floor(rand() * pairs.length)]
    const dex = dexes[Math.floor(rand() * dexes.length)]
    const sizeUsd = sizes[Math.floor(rand() * sizes.length)]
    const pnlPct = pnlMultipliers[i] ?? (rand() - 0.45) * 0.2
    const pnlUsd = Math.round(sizeUsd * pnlPct * 100) / 100
    const amountOutUsd = Math.round((sizeUsd + pnlUsd) * 100) / 100

    // Spread 20 trades over 90 days
    const hoursAgo = Math.floor(rand() * 90 * 24)
    const ts = new Date(now - hoursAgo * 60 * 60 * 1000)

    const txBytes = Array.from({ length: 32 }, () =>
      Math.floor(rand() * 256).toString(16).padStart(2, '0'),
    ).join('')

    trades.push({
      id: `trade-${i}`,
      timestamp: ts.toISOString(),
      tokenIn: pair[0],
      tokenOut: pair[1],
      amountIn: Math.round((sizeUsd / 1.2) * 1000) / 1000,
      amountOut: Math.round((amountOutUsd / 1.1) * 1000) / 1000,
      amountInUsd: sizeUsd,
      amountOutUsd,
      pnlUsd,
      pnlPercent: Math.round(pnlPct * 10000) / 100,
      txHash: `0x${txBytes}`,
      dex,
    })
  }

  // Sort newest first
  return trades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function computeStats(
  trades: Trade[],
  currentValue: number,
  history: PortfolioSnapshot[],
): PortfolioStats {
  const totalPnlUsd = trades.reduce((sum, t) => sum + t.pnlUsd, 0)
  const initialValue = history[0]?.totalValueUsd ?? currentValue
  const totalPnlPercent =
    initialValue > 0 ? ((currentValue - initialValue) / initialValue) * 100 : 0

  const now = Date.now()
  const dayAgo = now - 24 * 60 * 60 * 1000
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000

  function snapValueAt(targetMs: number): number {
    let closest = history[0]
    let minDiff = Infinity
    for (const snap of history) {
      const diff = Math.abs(new Date(snap.timestamp).getTime() - targetMs)
      if (diff < minDiff) {
        minDiff = diff
        closest = snap
      }
    }
    return closest?.totalValueUsd ?? currentValue
  }

  const dayPnlUsd = currentValue - snapValueAt(dayAgo)
  const weekPnlUsd = currentValue - snapValueAt(weekAgo)
  const monthPnlUsd = currentValue - snapValueAt(monthAgo)

  const profitable = trades.filter((t) => t.pnlUsd > 0)
  const winRate = trades.length > 0 ? (profitable.length / trades.length) * 100 : 0
  const avgTradeSize =
    trades.length > 0
      ? trades.reduce((sum, t) => sum + t.amountInUsd, 0) / trades.length
      : 0

  let bestTrade: Trade | null = null
  let worstTrade: Trade | null = null
  for (const t of trades) {
    if (bestTrade === null || t.pnlUsd > bestTrade.pnlUsd) bestTrade = t
    if (worstTrade === null || t.pnlUsd < worstTrade.pnlUsd) worstTrade = t
  }

  return {
    totalValueUsd: currentValue,
    totalPnlUsd: Math.round(totalPnlUsd * 100) / 100,
    totalPnlPercent: Math.round(totalPnlPercent * 100) / 100,
    dayPnlUsd: Math.round(dayPnlUsd * 100) / 100,
    weekPnlUsd: Math.round(weekPnlUsd * 100) / 100,
    monthPnlUsd: Math.round(monthPnlUsd * 100) / 100,
    bestTrade,
    worstTrade,
    totalTrades: trades.length,
    winRate: Math.round(winRate * 10) / 10,
    avgTradeSize: Math.round(avgTradeSize * 100) / 100,
  }
}

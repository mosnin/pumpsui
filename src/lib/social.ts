// ─── Social Trading Types & Helpers ──────────────────────────────────────────

export interface TraderTrade {
  id: string
  timestamp: string
  tokenIn: string
  tokenOut: string
  amountInUsd: number
  amountOutUsd: number
  pnlUsd: number
  pnlPercent: number
  txHash: string
}

export interface TraderProfile {
  address: string
  displayName: string
  avatar: string            // hex color for generated avatar
  followers: number
  following: number
  totalVolume: number       // USD
  pnlPercent: number        // 30-day P&L
  winRate: number           // % of profitable trades
  avgTradeSize: number      // USD
  favoriteTokens: string[]  // top 3 token symbols traded
  isVerified: boolean
  tier: 'bronze' | 'silver' | 'gold' | 'diamond'
  recentTrades: TraderTrade[]
}

export interface CopyTradingConfig {
  followedAddress: string
  maxTradeSize: number      // USD max per copy trade
  maxDailyVolume: number    // USD max daily
  copyRatio: number         // 0.1 = copy 10% of their trade size
  enabled: boolean
  slippageBps: number
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_TRADES: TraderTrade[][] = [
  [
    { id: 't1a', timestamp: '2026-05-17T10:12:00Z', tokenIn: 'USDC', tokenOut: 'SUI', amountInUsd: 50_000, amountOutUsd: 56_200, pnlUsd: 6_200, pnlPercent: 12.4, txHash: '0xabc001' },
    { id: 't1b', timestamp: '2026-05-16T14:30:00Z', tokenIn: 'SUI', tokenOut: 'WBTC', amountInUsd: 40_000, amountOutUsd: 44_800, pnlUsd: 4_800, pnlPercent: 12.0, txHash: '0xabc002' },
    { id: 't1c', timestamp: '2026-05-15T09:05:00Z', tokenIn: 'WBTC', tokenOut: 'ETH', amountInUsd: 35_000, amountOutUsd: 33_250, pnlUsd: -1_750, pnlPercent: -5.0, txHash: '0xabc003' },
  ],
  [
    { id: 't2a', timestamp: '2026-05-17T08:45:00Z', tokenIn: 'SUI', tokenOut: 'CETUS', amountInUsd: 12_000, amountOutUsd: 15_600, pnlUsd: 3_600, pnlPercent: 30.0, txHash: '0xdef001' },
    { id: 't2b', timestamp: '2026-05-16T16:20:00Z', tokenIn: 'CETUS', tokenOut: 'USDC', amountInUsd: 15_600, amountOutUsd: 14_820, pnlUsd: -780, pnlPercent: -5.0, txHash: '0xdef002' },
    { id: 't2c', timestamp: '2026-05-15T11:10:00Z', tokenIn: 'USDC', tokenOut: 'ETH', amountInUsd: 8_000, amountOutUsd: 9_200, pnlUsd: 1_200, pnlPercent: 15.0, txHash: '0xdef003' },
  ],
  [
    { id: 't3a', timestamp: '2026-05-17T07:00:00Z', tokenIn: 'ETH', tokenOut: 'SUI', amountInUsd: 200_000, amountOutUsd: 234_000, pnlUsd: 34_000, pnlPercent: 17.0, txHash: '0xghi001' },
    { id: 't3b', timestamp: '2026-05-16T12:00:00Z', tokenIn: 'SUI', tokenOut: 'USDC', amountInUsd: 180_000, amountOutUsd: 172_800, pnlUsd: -7_200, pnlPercent: -4.0, txHash: '0xghi002' },
    { id: 't3c', timestamp: '2026-05-14T18:30:00Z', tokenIn: 'USDC', tokenOut: 'WBTC', amountInUsd: 150_000, amountOutUsd: 171_000, pnlUsd: 21_000, pnlPercent: 14.0, txHash: '0xghi003' },
  ],
  [
    { id: 't4a', timestamp: '2026-05-17T09:30:00Z', tokenIn: 'USDT', tokenOut: 'SUI', amountInUsd: 5_000, amountOutUsd: 6_750, pnlUsd: 1_750, pnlPercent: 35.0, txHash: '0xjkl001' },
    { id: 't4b', timestamp: '2026-05-16T15:00:00Z', tokenIn: 'SUI', tokenOut: 'DEEP', amountInUsd: 3_200, amountOutUsd: 2_880, pnlUsd: -320, pnlPercent: -10.0, txHash: '0xjkl002' },
    { id: 't4c', timestamp: '2026-05-15T10:15:00Z', tokenIn: 'DEEP', tokenOut: 'USDC', amountInUsd: 2_880, amountOutUsd: 3_168, pnlUsd: 288, pnlPercent: 10.0, txHash: '0xjkl003' },
  ],
  [
    { id: 't5a', timestamp: '2026-05-17T11:00:00Z', tokenIn: 'USDC', tokenOut: 'SUI', amountInUsd: 25_000, amountOutUsd: 26_250, pnlUsd: 1_250, pnlPercent: 5.0, txHash: '0xmno001' },
    { id: 't5b', timestamp: '2026-05-16T09:00:00Z', tokenIn: 'SUI', tokenOut: 'USDC', amountInUsd: 26_250, amountOutUsd: 26_775, pnlUsd: 525, pnlPercent: 2.0, txHash: '0xmno002' },
    { id: 't5c', timestamp: '2026-05-15T14:00:00Z', tokenIn: 'USDC', tokenOut: 'ETH', amountInUsd: 20_000, amountOutUsd: 19_200, pnlUsd: -800, pnlPercent: -4.0, txHash: '0xmno003' },
  ],
  [
    { id: 't6a', timestamp: '2026-05-17T06:45:00Z', tokenIn: 'SUI', tokenOut: 'WBTC', amountInUsd: 80_000, amountOutUsd: 104_000, pnlUsd: 24_000, pnlPercent: 30.0, txHash: '0xpqr001' },
    { id: 't6b', timestamp: '2026-05-16T11:30:00Z', tokenIn: 'WBTC', tokenOut: 'ETH', amountInUsd: 104_000, amountOutUsd: 93_600, pnlUsd: -10_400, pnlPercent: -10.0, txHash: '0xpqr002' },
    { id: 't6c', timestamp: '2026-05-14T20:00:00Z', tokenIn: 'ETH', tokenOut: 'SUI', amountInUsd: 90_000, amountOutUsd: 117_000, pnlUsd: 27_000, pnlPercent: 30.0, txHash: '0xpqr003' },
  ],
  [
    { id: 't7a', timestamp: '2026-05-17T12:15:00Z', tokenIn: 'USDC', tokenOut: 'CETUS', amountInUsd: 1_500, amountOutUsd: 1_800, pnlUsd: 300, pnlPercent: 20.0, txHash: '0xstu001' },
    { id: 't7b', timestamp: '2026-05-16T08:00:00Z', tokenIn: 'CETUS', tokenOut: 'SUI', amountInUsd: 1_800, amountOutUsd: 1_980, pnlUsd: 180, pnlPercent: 10.0, txHash: '0xstu002' },
    { id: 't7c', timestamp: '2026-05-15T16:30:00Z', tokenIn: 'SUI', tokenOut: 'USDT', amountInUsd: 2_000, amountOutUsd: 1_860, pnlUsd: -140, pnlPercent: -7.0, txHash: '0xstu003' },
  ],
  [
    { id: 't8a', timestamp: '2026-05-17T13:00:00Z', tokenIn: 'ETH', tokenOut: 'SUI', amountInUsd: 500_000, amountOutUsd: 535_000, pnlUsd: 35_000, pnlPercent: 7.0, txHash: '0xvwx001' },
    { id: 't8b', timestamp: '2026-05-16T17:00:00Z', tokenIn: 'SUI', tokenOut: 'WBTC', amountInUsd: 450_000, amountOutUsd: 418_500, pnlUsd: -31_500, pnlPercent: -7.0, txHash: '0xvwx002' },
    { id: 't8c', timestamp: '2026-05-15T08:00:00Z', tokenIn: 'WBTC', tokenOut: 'ETH', amountInUsd: 420_000, amountOutUsd: 462_000, pnlUsd: 42_000, pnlPercent: 10.0, txHash: '0xvwx003' },
  ],
  [
    { id: 't9a', timestamp: '2026-05-17T05:30:00Z', tokenIn: 'USDC', tokenOut: 'DEEP', amountInUsd: 3_000, amountOutUsd: 4_500, pnlUsd: 1_500, pnlPercent: 50.0, txHash: '0xyz001' },
    { id: 't9b', timestamp: '2026-05-16T13:45:00Z', tokenIn: 'DEEP', tokenOut: 'SUI', amountInUsd: 4_500, amountOutUsd: 3_375, pnlUsd: -1_125, pnlPercent: -25.0, txHash: '0xyz002' },
    { id: 't9c', timestamp: '2026-05-14T10:00:00Z', tokenIn: 'SUI', tokenOut: 'USDC', amountInUsd: 4_000, amountOutUsd: 5_200, pnlUsd: 1_200, pnlPercent: 30.0, txHash: '0xyz003' },
  ],
  [
    { id: 't10a', timestamp: '2026-05-17T14:00:00Z', tokenIn: 'SUI', tokenOut: 'USDC', amountInUsd: 10_000, amountOutUsd: 10_800, pnlUsd: 800, pnlPercent: 8.0, txHash: '0xaaa001' },
    { id: 't10b', timestamp: '2026-05-16T10:00:00Z', tokenIn: 'USDC', tokenOut: 'ETH', amountInUsd: 10_800, amountOutUsd: 11_448, pnlUsd: 648, pnlPercent: 6.0, txHash: '0xaaa002' },
    { id: 't10c', timestamp: '2026-05-15T12:00:00Z', tokenIn: 'ETH', tokenOut: 'SUI', amountInUsd: 11_448, amountOutUsd: 10_990, pnlUsd: -458, pnlPercent: -4.0, txHash: '0xaaa003' },
  ],
]

export function generateDemoTraders(): TraderProfile[] {
  return [
    {
      address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      displayName: 'SuiWhale.eth',
      avatar: '#6366F1',
      followers: 4_821,
      following: 12,
      totalVolume: 1_240_000,
      pnlPercent: 124.3,
      winRate: 78,
      avgTradeSize: 41_333,
      favoriteTokens: ['SUI', 'WBTC', 'USDC'],
      isVerified: true,
      tier: 'diamond',
      recentTrades: DEMO_TRADES[0],
    },
    {
      address: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
      displayName: 'DegenAlpha',
      avatar: '#EF4444',
      followers: 3_102,
      following: 47,
      totalVolume: 890_000,
      pnlPercent: 89.1,
      winRate: 63,
      avgTradeSize: 12_714,
      favoriteTokens: ['CETUS', 'SUI', 'ETH'],
      isVerified: true,
      tier: 'gold',
      recentTrades: DEMO_TRADES[1],
    },
    {
      address: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
      displayName: 'CryptoWhale88',
      avatar: '#06B6D4',
      followers: 2_890,
      following: 8,
      totalVolume: 3_500_000,
      pnlPercent: 67.8,
      winRate: 71,
      avgTradeSize: 175_000,
      favoriteTokens: ['ETH', 'WBTC', 'SUI'],
      isVerified: true,
      tier: 'diamond',
      recentTrades: DEMO_TRADES[2],
    },
    {
      address: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
      displayName: 'MicroScalper',
      avatar: '#10B981',
      followers: 1_543,
      following: 23,
      totalVolume: 215_000,
      pnlPercent: 55.4,
      winRate: 82,
      avgTradeSize: 3_583,
      favoriteTokens: ['SUI', 'DEEP', 'USDT'],
      isVerified: false,
      tier: 'silver',
      recentTrades: DEMO_TRADES[3],
    },
    {
      address: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
      displayName: 'StableArb',
      avatar: '#F59E0B',
      followers: 2_210,
      following: 31,
      totalVolume: 740_000,
      pnlPercent: 42.1,
      winRate: 88,
      avgTradeSize: 24_667,
      favoriteTokens: ['USDC', 'SUI', 'ETH'],
      isVerified: false,
      tier: 'gold',
      recentTrades: DEMO_TRADES[4],
    },
    {
      address: '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a',
      displayName: 'MomentumKing',
      avatar: '#8B5CF6',
      followers: 1_876,
      following: 15,
      totalVolume: 560_000,
      pnlPercent: 38.7,
      winRate: 59,
      avgTradeSize: 62_222,
      favoriteTokens: ['WBTC', 'ETH', 'SUI'],
      isVerified: true,
      tier: 'gold',
      recentTrades: DEMO_TRADES[5],
    },
    {
      address: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
      displayName: 'SuiNewbie',
      avatar: '#EC4899',
      followers: 234,
      following: 89,
      totalVolume: 48_000,
      pnlPercent: 28.3,
      winRate: 67,
      avgTradeSize: 1_600,
      favoriteTokens: ['CETUS', 'SUI', 'USDC'],
      isVerified: false,
      tier: 'bronze',
      recentTrades: DEMO_TRADES[6],
    },
    {
      address: '0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c',
      displayName: 'InstitutionalX',
      avatar: '#64748B',
      followers: 5_624,
      following: 3,
      totalVolume: 8_900_000,
      pnlPercent: 22.5,
      winRate: 74,
      avgTradeSize: 445_000,
      favoriteTokens: ['ETH', 'WBTC', 'USDC'],
      isVerified: true,
      tier: 'diamond',
      recentTrades: DEMO_TRADES[7],
    },
    {
      address: '0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
      displayName: 'GemHunter99',
      avatar: '#F97316',
      followers: 987,
      following: 112,
      totalVolume: 120_000,
      pnlPercent: 18.9,
      winRate: 52,
      avgTradeSize: 4_000,
      favoriteTokens: ['DEEP', 'SUI', 'USDC'],
      isVerified: false,
      tier: 'bronze',
      recentTrades: DEMO_TRADES[8],
    },
    {
      address: '0xa0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
      displayName: 'GridMaster',
      avatar: '#14B8A6',
      followers: 1_321,
      following: 28,
      totalVolume: 320_000,
      pnlPercent: 15.2,
      winRate: 91,
      avgTradeSize: 10_667,
      favoriteTokens: ['SUI', 'ETH', 'USDC'],
      isVerified: false,
      tier: 'silver',
      recentTrades: DEMO_TRADES[9],
    },
  ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatAddress(addr: string): string {
  if (addr.length < 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function getPnlColor(pnl: number): string {
  return pnl >= 0 ? '#10B981' : '#EF4444'
}

export function fmtUSD(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`
  return `$${v.toFixed(2)}`
}

export function getTierColor(tier: TraderProfile['tier']): string {
  switch (tier) {
    case 'bronze':  return '#CD7F32'
    case 'silver':  return '#94A3B8'
    case 'gold':    return '#F59E0B'
    case 'diamond': return '#67E8F9'
  }
}

export function getTierLabel(tier: TraderProfile['tier']): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

export function timeAgo(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

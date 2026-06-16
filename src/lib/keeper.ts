export interface KeeperBot {
  id: string
  address: string
  name: string
  endpoint: string
  totalExecutions: number
  totalEarnedSui: number
  reputationScore: number   // 0-100
  uptimePercent: number
  ordersInQueue: number     // pending DCA/TWAP orders
  status: 'online' | 'offline' | 'syncing'
  joinedAt: string
}

export interface ExecutionOpportunity {
  orderId: string
  orderType: 'dca' | 'twap'
  owner: string
  tokenIn: string
  tokenOut: string
  amountIn: bigint
  tipEarned: bigint         // 10 bps of amountIn
  readyAt: string           // when the order becomes executable
}

export const KEEPER_TIP_BPS = 10   // 0.1%

// Estimate monthly earnings for a keeper bot
export function estimateMonthlyEarnings(params: {
  ordersPerDay: number
  avgOrderSizeSui: number
}): number {
  const dailyTip = params.ordersPerDay * params.avgOrderSizeSui * KEEPER_TIP_BPS / 10_000
  return dailyTip * 30
}

// Generate demo keeper bots
export function generateDemoKeepers(): KeeperBot[] {
  return [
    {
      id: '1',
      address: '0x1a2b3c4d5e6f...',
      name: 'OmniKeeper Alpha',
      endpoint: 'https://keeper1.example.com',
      totalExecutions: 14_823,
      totalEarnedSui: 892.4,
      reputationScore: 99,
      uptimePercent: 99.8,
      ordersInQueue: 47,
      status: 'online',
      joinedAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
    },
    {
      id: '2',
      address: '0x9f8e7d6c5b4a...',
      name: 'FastBot v2',
      endpoint: 'https://fastbot.example.com',
      totalExecutions: 8_401,
      totalEarnedSui: 504.1,
      reputationScore: 97,
      uptimePercent: 98.2,
      ordersInQueue: 31,
      status: 'online',
      joinedAt: new Date(Date.now() - 22 * 24 * 3600000).toISOString(),
    },
    {
      id: '3',
      address: '0x3c4d5e6f7a8b...',
      name: 'SuiSentinel',
      endpoint: 'https://sentinel.example.com',
      totalExecutions: 5_217,
      totalEarnedSui: 313.0,
      reputationScore: 94,
      uptimePercent: 96.5,
      ordersInQueue: 18,
      status: 'online',
      joinedAt: new Date(Date.now() - 15 * 24 * 3600000).toISOString(),
    },
    {
      id: '4',
      address: '0xabcdef012345...',
      name: 'ChronoKeeper',
      endpoint: 'https://chrono.example.com',
      totalExecutions: 2_104,
      totalEarnedSui: 126.2,
      reputationScore: 88,
      uptimePercent: 91.3,
      ordersInQueue: 0,
      status: 'syncing',
      joinedAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    },
    {
      id: '5',
      address: '0x567890abcdef...',
      name: 'NightOwl Bot',
      endpoint: 'https://nightowl.example.com',
      totalExecutions: 339,
      totalEarnedSui: 20.3,
      reputationScore: 72,
      uptimePercent: 78.9,
      ordersInQueue: 0,
      status: 'offline',
      joinedAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    },
  ]
}

// Bot runner script that keepers would run (README/documentation)
export const KEEPER_BOT_README = `
# OmniWeave Keeper Bot

## Setup
1. Clone the keeper bot repo
2. Set KEEPER_PRIVATE_KEY env var (your Sui wallet)
3. Set SUI_RPC_URL (mainnet RPC)
4. Run: node keeper-bot.js

## How it works
1. Bot polls OmniWeave events every ~2 seconds
2. Finds DCA/TWAP orders ready for execution
3. Calls execute_dca() or execute_chunk()
4. Earns 0.1% of each trade as tip (paid in input token)
5. Stats reported to OmniWeave dashboard

## Earnings
Estimated: 0.1 SUI per 100 SUI of volume executed
Running 24/7 on a $5/mo server can earn 50-200 SUI/month
`

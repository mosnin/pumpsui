// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenRow {
  rank: number
  symbol: string
  name: string
  logoColor: string  // for gradient placeholder
  price: number
  change1h: number
  change24h: number
  change7d: number
  volume24h: number    // USD
  tvl: number         // USD
  marketCap: number   // USD
  sparkline: number[] // last 7d price points (7 values)
}

export interface PoolRow {
  id: string
  token0: string
  token1: string
  dex: string
  fee: number         // in bps
  tvl: number         // USD
  volume24h: number
  volume7d: number
  apr: number         // estimated APR %
}

export interface Transaction {
  hash: string
  type: 'swap' | 'add_liquidity' | 'remove_liquidity'
  token0: string
  token1: string
  amount0: number
  amount1: number
  amountUsd: number
  account: string     // shortened address
  timestamp: string
  dex: string
}

// ─── Seeded random helpers ────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function rand(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min)
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rand(rng, min, max + 1))
}

// ─── Token data ───────────────────────────────────────────────────────────────

const TOKEN_SEEDS: Array<{
  symbol: string
  name: string
  logoColor: string
  basePrice: number
  marketCapBase: number
}> = [
  { symbol: 'SUI',     name: 'Sui',              logoColor: '#6366F1', basePrice: 3.42,     marketCapBase: 9_800_000_000   },
  { symbol: 'USDC',    name: 'USD Coin',          logoColor: '#3B82F6', basePrice: 1.0,      marketCapBase: 43_000_000_000  },
  { symbol: 'USDT',    name: 'Tether USD',        logoColor: '#10B981', basePrice: 1.0,      marketCapBase: 110_000_000_000 },
  { symbol: 'WETH',    name: 'Wrapped Ether',     logoColor: '#8B5CF6', basePrice: 3250.0,   marketCapBase: 390_000_000_000 },
  { symbol: 'WBTC',    name: 'Wrapped Bitcoin',   logoColor: '#F59E0B', basePrice: 67000.0,  marketCapBase: 1_200_000_000_000 },
  { symbol: 'CETUS',   name: 'Cetus Protocol',    logoColor: '#00D4AA', basePrice: 0.142,    marketCapBase: 150_000_000     },
  { symbol: 'TURBOS',  name: 'Turbos Finance',    logoColor: '#3B82F6', basePrice: 0.058,    marketCapBase: 58_000_000      },
  { symbol: 'DEEP',    name: 'DeepBook',          logoColor: '#EF4444', basePrice: 0.185,    marketCapBase: 92_000_000      },
  { symbol: 'AFT',     name: 'Aftermath Finance', logoColor: '#EC4899', basePrice: 0.032,    marketCapBase: 32_000_000      },
  { symbol: 'NAVX',    name: 'NAVI Protocol',     logoColor: '#06B6D4', basePrice: 0.21,     marketCapBase: 105_000_000     },
  { symbol: 'SCALLOP', name: 'Scallop',           logoColor: '#F97316', basePrice: 0.087,    marketCapBase: 43_000_000      },
  { symbol: 'BUCK',    name: 'Bucket Protocol',   logoColor: '#84CC16', basePrice: 0.998,    marketCapBase: 12_000_000      },
  { symbol: 'STSUI',   name: 'Staked SUI',        logoColor: '#A78BFA', basePrice: 3.58,     marketCapBase: 380_000_000     },
  { symbol: 'VSUI',    name: 'Volo Staked SUI',   logoColor: '#818CF8', basePrice: 3.55,     marketCapBase: 220_000_000     },
  { symbol: 'HAEDAL',  name: 'Haedal',            logoColor: '#FB923C', basePrice: 0.043,    marketCapBase: 21_000_000      },
  { symbol: 'MOLE',    name: 'Mole',              logoColor: '#A16207', basePrice: 0.0021,   marketCapBase: 4_200_000       },
  { symbol: 'WAL',     name: 'Walrus',            logoColor: '#0EA5E9', basePrice: 0.065,    marketCapBase: 65_000_000      },
  { symbol: 'FUD',     name: 'FUD',               logoColor: '#DC2626', basePrice: 0.000012, marketCapBase: 600_000         },
  { symbol: 'BLUB',    name: 'Blub',              logoColor: '#7DD3FC', basePrice: 0.000034, marketCapBase: 850_000         },
  { symbol: 'NS',      name: 'Sui Name Service',  logoColor: '#C084FC', basePrice: 0.78,     marketCapBase: 78_000_000      },
]

function generateSparkline(rng: () => number, basePrice: number): number[] {
  const points: number[] = []
  let current = basePrice
  for (let i = 0; i < 7; i++) {
    const change = rand(rng, -0.06, 0.06)
    current = current * (1 + change)
    points.push(current)
  }
  return points
}

export function generateTokenRows(): TokenRow[] {
  const rng = seededRandom(42)
  return TOKEN_SEEDS.map((t, i) => {
    const priceVariance = rand(rng, 0.92, 1.08)
    const price = t.basePrice * priceVariance
    const sparkline = generateSparkline(seededRandom(i * 17 + 7), price)
    const tvlFraction = rand(rng, 0.01, 0.12)
    const volumeFraction = rand(rng, 0.005, 0.08)
    return {
      rank: i + 1,
      symbol: t.symbol,
      name: t.name,
      logoColor: t.logoColor,
      price,
      change1h: rand(rng, -2.5, 2.5),
      change24h: rand(rng, -12, 12),
      change7d: rand(rng, -25, 30),
      volume24h: t.marketCapBase * volumeFraction,
      tvl: t.marketCapBase * tvlFraction,
      marketCap: t.marketCapBase * priceVariance,
      sparkline,
    }
  })
}

// ─── Pool data ────────────────────────────────────────────────────────────────

const DEX_NAMES = ['Cetus', 'Turbos', 'DeepBook', 'Aftermath', 'FlowX', 'Kriya']
const FEE_TIERS = [1, 5, 25, 30, 100] // bps

const POOL_PAIRS: Array<{ t0: string; t1: string }> = [
  { t0: 'SUI',     t1: 'USDC'   },
  { t0: 'SUI',     t1: 'USDT'   },
  { t0: 'WETH',    t1: 'USDC'   },
  { t0: 'WBTC',    t1: 'USDC'   },
  { t0: 'SUI',     t1: 'WETH'   },
  { t0: 'CETUS',   t1: 'SUI'    },
  { t0: 'TURBOS',  t1: 'SUI'    },
  { t0: 'DEEP',    t1: 'SUI'    },
  { t0: 'USDC',    t1: 'USDT'   },
  { t0: 'SUI',     t1: 'DEEP'   },
  { t0: 'WETH',    t1: 'SUI'    },
  { t0: 'AFT',     t1: 'SUI'    },
  { t0: 'NAVX',    t1: 'SUI'    },
  { t0: 'STSUI',   t1: 'SUI'    },
  { t0: 'SCALLOP', t1: 'USDC'   },
]

export function generatePoolRows(): PoolRow[] {
  const rng = seededRandom(99)
  return POOL_PAIRS.map((pair, i) => {
    const dex = DEX_NAMES[randInt(rng, 0, DEX_NAMES.length - 1)]
    const fee = FEE_TIERS[randInt(rng, 0, FEE_TIERS.length - 1)]
    const tvl = rand(rng, 500_000, 45_000_000)
    const volume24h = tvl * rand(rng, 0.05, 0.45)
    const volume7d = volume24h * rand(rng, 5, 9)
    const feePct = fee / 10000
    const apr = (volume7d * 52 * feePct / tvl) * 100
    return {
      id: `pool-${i}-${pair.t0}-${pair.t1}`.toLowerCase(),
      token0: pair.t0,
      token1: pair.t1,
      dex,
      fee,
      tvl,
      volume24h,
      volume7d,
      apr,
    }
  })
}

// ─── Transaction data ─────────────────────────────────────────────────────────

const TX_TOKENS = ['SUI', 'USDC', 'USDT', 'WETH', 'WBTC', 'CETUS', 'DEEP', 'TURBOS', 'NAVX', 'AFT']
const TX_TYPES: Array<Transaction['type']> = ['swap', 'add_liquidity', 'remove_liquidity']

function shortAddr(rng: () => number): string {
  const hex = '0123456789abcdef'
  let addr = '0x'
  for (let i = 0; i < 4; i++) addr += hex[randInt(rng, 0, 15)]
  addr += '...'
  for (let i = 0; i < 4; i++) addr += hex[randInt(rng, 0, 15)]
  return addr
}

function shortHash(rng: () => number): string {
  const hex = '0123456789abcdef'
  let h = '0x'
  for (let i = 0; i < 8; i++) h += hex[randInt(rng, 0, 15)]
  return h
}

function timeAgoStr(secondsAgo: number): string {
  if (secondsAgo < 60) return `${secondsAgo}s ago`
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`
  return `${Math.floor(secondsAgo / 3600)}h ago`
}

export function generateTransactions(): Transaction[] {
  const rng = seededRandom(77)
  const txs: Transaction[] = []
  let secondsOffset = 5
  for (let i = 0; i < 25; i++) {
    const type = TX_TYPES[randInt(rng, 0, TX_TYPES.length - 1)]
    let token0 = TX_TOKENS[randInt(rng, 0, TX_TOKENS.length - 1)]
    let token1 = TX_TOKENS[randInt(rng, 0, TX_TOKENS.length - 1)]
    if (token1 === token0) token1 = token0 === 'SUI' ? 'USDC' : 'SUI'
    const amountUsd = rand(rng, 100, 150_000)
    const amount0 = rand(rng, 0.1, 10000)
    const amount1 = rand(rng, 0.1, 10000)
    const dex = DEX_NAMES[randInt(rng, 0, DEX_NAMES.length - 1)]
    txs.push({
      hash: shortHash(rng),
      type,
      token0,
      token1,
      amount0,
      amount1,
      amountUsd,
      account: shortAddr(rng),
      timestamp: timeAgoStr(secondsOffset),
      dex,
    })
    secondsOffset += randInt(rng, 5, 45)
  }
  return txs
}

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'
export type TimeRange = Timeframe

export interface ChartDataParams {
  tokenIn: string
  tokenOut: string
  timeframe: Timeframe
  limit: number
}

export interface TokenStats {
  price: number
  change24h: number
  changePct24h: number
  high24h: number
  low24h: number
  openPrice: number
  volume24h: number
  marketCap: number
  avgVolume: number
}

const BASE_PRICES: Record<string, number> = {
  SUI: 1.42, USDC: 1.0, USDT: 1.0,
  WETH: 3_210, WBTC: 67_400,
  CETUS: 0.28, DEEP: 0.18, AFT: 0.92,
  TURBOS: 0.05, BUCK: 1.0, KRIYA: 0.41, FLX: 0.12,
}

export function generateCandleData(
  basePrice: number,
  timeframe: Timeframe,
  count = 200,
): Candle[] {
  const intervalSeconds: Record<Timeframe, number> = {
    '1m': 60, '5m': 300, '15m': 900,
    '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800,
  }
  const interval = intervalSeconds[timeframe]
  const now = Math.floor(Date.now() / 1000)
  const startTime = now - count * interval

  let price = basePrice
  return Array.from({ length: count }, (_, i) => {
    const time = startTime + i * interval
    const change = (Math.random() - 0.49) * price * 0.02
    const open = price
    const close = Math.max(0.0001, price + change)
    const high = Math.max(open, close) * (1 + Math.random() * 0.01)
    const low = Math.min(open, close) * (1 - Math.random() * 0.01)
    const volume = basePrice * (5000 + Math.random() * 95000)
    price = close
    return { time, open, high, low, close, volume }
  })
}

/** Alias for token detail page: generates candles from symbol. */
export function generateOHLCV(symbol: string, timeframe: Timeframe, count = 120): Candle[] {
  const base = BASE_PRICES[symbol.toUpperCase()] ?? 1.0
  return generateCandleData(base, timeframe, count)
}

export async function fetchChartData(params: ChartDataParams): Promise<Candle[]> {
  const geckoIds: Record<string, string> = {
    SUI: 'sui', USDC: 'usd-coin', USDT: 'tether',
    WETH: 'weth', CETUS: 'cetus-protocol', TURBOS: 'turbos-finance',
  }
  const id = geckoIds[params.tokenIn.toUpperCase()]
  if (!id) return generateCandleData(BASE_PRICES[params.tokenIn.toUpperCase()] ?? 1.0, params.timeframe, params.limit)

  const days = params.timeframe === '1d' || params.timeframe === '1w' ? 90
    : params.timeframe === '4h' ? 30
    : params.timeframe === '1h' ? 7 : 1

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=${days}`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) throw new Error('CoinGecko failed')
    const raw = await res.json() as [number, number, number, number, number][]
    return raw.map(([time, open, high, low, close]) => ({
      time: Math.floor(time / 1000),
      open, high, low, close, volume: 0,
    }))
  } catch {
    return generateCandleData(BASE_PRICES[params.tokenIn.toUpperCase()] ?? 1.2, params.timeframe, params.limit)
  }
}

export function computeStats(candles: Candle[], symbol: string): TokenStats {
  if (candles.length === 0) {
    const p = BASE_PRICES[symbol.toUpperCase()] ?? 1
    return { price: p, change24h: 0, changePct24h: 0, high24h: p, low24h: p, openPrice: p, volume24h: 0, marketCap: 0, avgVolume: 0 }
  }
  const last = candles[candles.length - 1]
  const first = candles[0]
  const price = last.close
  const openPrice = first.open
  const change24h = price - openPrice
  const changePct24h = (change24h / openPrice) * 100
  const high24h = Math.max(...candles.map(c => c.high))
  const low24h = Math.min(...candles.map(c => c.low))
  const volume24h = candles.reduce((s, c) => s + c.volume, 0)
  const avgVolume = volume24h / candles.length
  const supply: Record<string, number> = {
    SUI: 10_000_000_000, WETH: 3_500_000, WBTC: 21_000_000,
    USDC: 40_000_000_000, USDT: 90_000_000_000,
  }
  const marketCap = (supply[symbol.toUpperCase()] ?? 1_000_000_000) * price
  return { price, change24h, changePct24h, high24h, low24h, openPrice, volume24h, marketCap, avgVolume }
}

export function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (price >= 1) return price.toFixed(4)
  if (price >= 0.01) return price.toFixed(6)
  return price.toExponential(4)
}

export function formatLargeNumber(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`
  return `$${n.toFixed(2)}`
}

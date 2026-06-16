'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, AreaSeries } from 'lightweight-charts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceChartProps {
  tokenSymbol: string
  coingeckoId?: string
  height?: number
}

type TimeRange = '1D' | '7D' | '30D' | '90D'

interface RangeConfig {
  days: number
  interval: string
}

const RANGE_CONFIG: Record<TimeRange, RangeConfig> = {
  '1D':  { days: 1,  interval: 'hourly' },
  '7D':  { days: 7,  interval: 'hourly' },
  '30D': { days: 30, interval: 'daily'  },
  '90D': { days: 90, interval: 'daily'  },
}

const RANGES: TimeRange[] = ['1D', '7D', '30D', '90D']

// ─── Data fetcher ─────────────────────────────────────────────────────────────

interface ChartDataPoint {
  time: number
  value: number
}

async function fetchPriceHistory(
  id: string,
  days: number,
  interval: string,
): Promise<ChartDataPoint[]> {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=${interval}`,
  )
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`)
  const json = await res.json()
  const prices = json.prices as [number, number][]

  // Deduplicate by timestamp second (lightweight-charts requires unique, ascending times)
  const seen = new Set<number>()
  const result: ChartDataPoint[] = []
  for (const [ms, value] of prices) {
    const sec = Math.floor(ms / 1000)
    if (!seen.has(sec)) {
      seen.add(sec)
      result.push({ time: sec, value })
    }
  }
  return result
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PriceChart({ tokenSymbol, coingeckoId, height = 200 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeRange, setActiveRange] = useState<TimeRange>('7D')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<number | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748B',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(99,102,241,0.08)' },
        horzLines: { color: 'rgba(99,102,241,0.08)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(99,102,241,0.4)', labelBackgroundColor: '#6366F1' },
        horzLine: { color: 'rgba(99,102,241,0.4)', labelBackgroundColor: '#6366F1' },
      },
      rightPriceScale: {
        borderColor: 'rgba(99,102,241,0.15)',
        textColor: '#64748B',
      },
      timeScale: {
        borderColor: 'rgba(99,102,241,0.15)',
        timeVisible: true,
        secondsVisible: false,
      },
      width: container.clientWidth,
      height,
    })

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#6366F1',
      topColor: 'rgba(99,102,241,0.25)',
      bottomColor: 'rgba(99,102,241,0.0)',
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: '#6366F1',
      crosshairMarkerBackgroundColor: '#060611',
    })

    const { days, interval } = RANGE_CONFIG[activeRange]
    const id = coingeckoId || 'sui'

    setLoading(true)
    setError(null)

    fetchPriceHistory(id, days, interval)
      .then((data) => {
        if (data.length === 0) return
        areaSeries.setData(data as Parameters<typeof areaSeries.setData>[0])
        chart.timeScale().fitContent()

        // Compute price change
        const first = data[0].value
        const last = data[data.length - 1].value
        setCurrentPrice(last)
        setPriceChange(((last - first) / first) * 100)
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load price data'
        setError(msg)
      })
      .finally(() => setLoading(false))

    // Handle crosshair updates for price display
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) return
      const point = param.seriesData.get(areaSeries)
      if (point && 'value' in point) {
        setCurrentPrice(point.value as number)
      }
    })

    const ro = new ResizeObserver(() => {
      if (!containerRef.current) return
      chart.applyOptions({ width: containerRef.current.clientWidth })
    })
    ro.observe(container)

    return () => {
      chart.remove()
      ro.disconnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coingeckoId, activeRange, height])

  const isPositive = priceChange !== null && priceChange >= 0

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(99,102,241,0.12)',
      }}
    >
      {/* Chart header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium" style={{ color: '#64748B' }}>
            {tokenSymbol} / USD
          </span>
          {currentPrice !== null && (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold" style={{ color: '#E2E8F0' }}>
                ${currentPrice < 0.01
                  ? currentPrice.toFixed(6)
                  : currentPrice < 1
                  ? currentPrice.toFixed(4)
                  : currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {priceChange !== null && (
                <span
                  className="text-xs font-semibold"
                  style={{ color: isPositive ? '#10B981' : '#EF4444' }}
                >
                  {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Range selector */}
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}
        >
          {RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150"
              style={{
                background: activeRange === range ? 'rgba(99,102,241,0.3)' : 'transparent',
                color: activeRange === range ? '#818CF8' : '#64748B',
                border: activeRange === range ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart body */}
      <div className="relative px-1 pb-1" style={{ height }}>
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: 'rgba(6,6,17,0.6)', backdropFilter: 'blur(4px)' }}
          >
            <div className="flex items-center gap-2" style={{ color: '#64748B' }}>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              <span className="text-xs">Loading chart…</span>
            </div>
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-xs" style={{ color: '#EF4444' }}>
              Unable to load price data
            </span>
          </div>
        )}
        <div ref={containerRef} className="w-full" style={{ height }} />
      </div>
    </div>
  )
}

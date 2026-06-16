'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import type { Candle, Timeframe } from '@/lib/chartData'
import type {
  IChartApi,
  ISeriesApi,
  SeriesType,
  Time,
} from 'lightweight-charts'

interface CandlestickChartProps {
  token: string
  vsToken?: string
  height?: number
  showVolume?: boolean
  compact?: boolean
}

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w']

// Convenience aliases for the two series types we use
type CandleSeries = ISeriesApi<'Candlestick'>
type HistSeries = ISeriesApi<'Histogram'>

export function CandlestickChart({
  token,
  vsToken = 'USDC',
  height = 400,
  showVolume = true,
  compact = false,
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [timeframe, setTimeframe] = useState<Timeframe>('1h')
  const [loading, setLoading] = useState(true)
  const [candles, setCandles] = useState<Candle[]>([])
  const [hoverOHLC, setHoverOHLC] = useState<{ open: number; high: number; low: number; close: number } | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<CandleSeries | null>(null)
  const volumeSeriesRef = useRef<HistSeries | null>(null)

  // Fetch candles
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/chart?token=${token}&vs=${vsToken}&timeframe=${timeframe}&limit=200`)
      const data = await res.json() as { candles: Candle[] }
      setCandles(data.candles)
    } catch {
      setCandles([])
    } finally {
      setLoading(false)
    }
  }, [token, vsToken, timeframe])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Init chart
  useEffect(() => {
    if (!chartContainerRef.current || loading || candles.length === 0) return

    let resizeObserver: ResizeObserver | null = null

    const initChart = async () => {
      const { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries } = await import('lightweight-charts')

      if (!chartContainerRef.current) return

      // Destroy previous chart
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }

      const container = chartContainerRef.current
      const chartHeight = showVolume && !compact ? Math.floor(height * 0.72) : height

      const chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: '#060611' },
          textColor: '#94A3B8',
        },
        grid: {
          vertLines: { color: '#1E293B' },
          horzLines: { color: '#1E293B' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: '#1E293B',
        },
        timeScale: {
          borderColor: '#1E293B',
          timeVisible: true,
          secondsVisible: false,
        },
        width: container.clientWidth,
        height: chartHeight,
      })

      chartRef.current = chart

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10B981',
        downColor: '#EF4444',
        borderUpColor: '#10B981',
        borderDownColor: '#EF4444',
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      })

      candleSeriesRef.current = candleSeries as CandleSeries

      // Sort candles by time and remove duplicates
      const sorted = [...candles]
        .sort((a, b) => a.time - b.time)
        .filter((c, i, arr) => i === 0 || c.time !== arr[i - 1].time)

      candleSeries.setData(
        sorted.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      )

      // Price line at last close
      if (sorted.length > 0) {
        const lastCandle = sorted[sorted.length - 1]
        candleSeries.createPriceLine({
          price: lastCandle.close,
          color: '#6366F1',
          lineWidth: 1,
          lineStyle: 2, // dashed
          axisLabelVisible: true,
          title: 'Last',
        })
      }

      // Volume histogram
      if (showVolume && !compact) {
        const volumeSeries = chart.addSeries(HistogramSeries, {
          color: '#6366F180',
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
        })
        volumeSeriesRef.current = volumeSeries as HistSeries

        chart.priceScale('volume').applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        })

        volumeSeries.setData(
          sorted.map((c) => ({
            time: c.time as Time,
            value: c.volume,
            color: c.close >= c.open ? '#10B98133' : '#EF444433',
          }))
        )

        // Adjust main series scale
        chart.priceScale('right').applyOptions({
          scaleMargins: { top: 0.05, bottom: 0.3 },
        })
      }

      // Crosshair hover
      chart.subscribeCrosshairMove((param) => {
        if (param.time && candleSeriesRef.current) {
          const seriesApi = candleSeriesRef.current as ISeriesApi<SeriesType>
          const data = param.seriesData.get(seriesApi)
          if (data && 'open' in data) {
            setHoverOHLC({
              open: data.open as number,
              high: data.high as number,
              low: data.low as number,
              close: data.close as number,
            })
          }
        } else {
          setHoverOHLC(null)
        }
      })

      chart.timeScale().fitContent()

      // Responsive resize
      resizeObserver = new ResizeObserver(() => {
        if (chartRef.current && container) {
          chartRef.current.applyOptions({ width: container.clientWidth })
        }
      })
      resizeObserver.observe(container)
    }

    void initChart()

    return () => {
      resizeObserver?.disconnect()
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        candleSeriesRef.current = null
        volumeSeriesRef.current = null
      }
    }
  }, [candles, loading, height, showVolume, compact])

  const fmt = (n: number) =>
    n < 0.01 ? n.toFixed(6) : n < 1 ? n.toFixed(4) : n.toFixed(2)

  return (
    <div className="w-full">
      {/* Timeframe selector */}
      {!compact && (
        <div className="flex gap-1 p-3 border-b border-slate-800">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}

          {/* OHLC on hover */}
          {hoverOHLC && (
            <div className="ml-auto flex gap-4 text-xs text-slate-400">
              <span>O <span className="text-white">${fmt(hoverOHLC.open)}</span></span>
              <span>H <span className="text-emerald-400">${fmt(hoverOHLC.high)}</span></span>
              <span>L <span className="text-red-400">${fmt(hoverOHLC.low)}</span></span>
              <span>C <span className="text-white">${fmt(hoverOHLC.close)}</span></span>
            </div>
          )}
        </div>
      )}

      {/* Compact timeframe */}
      {compact && (
        <div className="flex gap-1 mb-2">
          {(['1h', '4h', '1d'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Chart or skeleton */}
      {loading ? (
        <div
          className="w-full rounded animate-pulse bg-slate-800/50"
          style={{ height }}
        />
      ) : (
        <div ref={chartContainerRef} className="w-full" style={{ height }} />
      )}
    </div>
  )
}

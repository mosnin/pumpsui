'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Candle, Timeframe } from '@/lib/chartData'
import { formatPrice } from '@/lib/chartData'

interface Props {
  candles: Candle[]
  range: Timeframe
  isPositive: boolean
}

function formatTime(ts: number, range: Timeframe): string {
  const d = new Date(ts * 1000)
  if (range === '15m' || range === '1h') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (range === '4h') {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

interface TooltipPayloadEntry {
  value: number
  payload: { time: number }
}

function CustomTooltip({
  active,
  payload,
  range,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  range: Timeframe
}) {
  if (!active || !payload?.length) return null
  const { value, payload: data } = payload[0]
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs"
      style={{
        background: 'rgba(13,13,31,0.95)',
        border: '1px solid rgba(99,102,241,0.3)',
        color: '#E2E8F0',
      }}
    >
      <div className="font-bold text-sm">{formatPrice(value)}</div>
      <div style={{ color: '#64748B' }}>{formatTime(data.time, range)}</div>
    </div>
  )
}

export default function PriceChart({ candles, range, isPositive }: Props) {
  const data = useMemo(
    () => candles.map(c => ({ time: c.time, price: c.close })),
    [candles],
  )

  const color = isPositive ? '#10B981' : '#EF4444'
  const gradientId = isPositive ? 'green-gradient' : 'red-gradient'

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <XAxis
          dataKey="time"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={ts => formatTime(ts as number, range)}
          tick={{ fill: '#475569', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickCount={6}
          minTickGap={50}
        />
        <YAxis
          domain={['auto', 'auto']}
          tickFormatter={v => formatPrice(v as number)}
          tick={{ fill: '#475569', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={72}
          tickCount={5}
        />
        <Tooltip
          content={<CustomTooltip range={range} />}
          cursor={{ stroke: 'rgba(99,102,241,0.4)', strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: '#060611', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

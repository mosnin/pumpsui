'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'

export interface VolumeDataPoint {
  date: string
  volume: number
  fees?: number
}

interface VolumeChartProps {
  data: VolumeDataPoint[]
  height?: number
}

function formatVolume(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

function CustomTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="rounded-xl p-4 text-sm shadow-xl"
      style={{
        background: 'rgba(13, 13, 31, 0.95)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p className="font-semibold mb-2" style={{ color: '#E2E8F0' }}>
        {label}
      </p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: entry.color as string }}
          />
          <span className="text-slate-400 capitalize">{String(entry.name)}:</span>
          <span className="font-medium" style={{ color: '#E2E8F0' }}>
            {formatVolume(Number(entry.value))}
          </span>
        </div>
      ))}
    </div>
  )
}

export function VolumeChart({ data, height = 320 }: VolumeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="feesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(99,102,241,0.1)"
          vertical={false}
        />

        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={{ stroke: 'rgba(99,102,241,0.2)' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => formatVolume(v)}
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={70}
        />

        <Tooltip content={<CustomTooltip />} />

        {data[0]?.fees !== undefined && (
          <Area
            type="monotone"
            dataKey="fees"
            stroke="#06B6D4"
            strokeWidth={2}
            fill="url(#feesGradient)"
            name="fees"
          />
        )}

        <Area
          type="monotone"
          dataKey="volume"
          stroke="#6366F1"
          strokeWidth={2.5}
          fill="url(#volumeGradient)"
          name="volume"
          dot={false}
          activeDot={{ r: 5, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

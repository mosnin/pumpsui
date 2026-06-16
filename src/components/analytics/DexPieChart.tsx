'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'

export interface DexVolumeEntry {
  name: string
  volume: number
  percentage: number
}

interface DexPieChartProps {
  data: DexVolumeEntry[]
  height?: number
}

export const DEX_COLORS: Record<string, string> = {
  Cetus: '#00D4AA',
  Turbos: '#3B82F6',
  DeepBook: '#F59E0B',
  Aftermath: '#8B5CF6',
  FlowX: '#EF4444',
  Kriya: '#10B981',
}

function formatVolume(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

function CustomTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const data = (entry as { payload: DexVolumeEntry }).payload

  return (
    <div
      className="rounded-xl p-4 text-sm shadow-xl"
      style={{
        background: 'rgba(13, 13, 31, 0.95)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ background: DEX_COLORS[data.name] ?? '#6366F1' }}
        />
        <span className="font-semibold" style={{ color: '#E2E8F0' }}>
          {data.name}
        </span>
      </div>
      <div className="flex flex-col gap-1 pl-5">
        <span className="text-slate-400">
          Volume: <span className="text-slate-200 font-medium">{formatVolume(data.volume)}</span>
        </span>
        <span className="text-slate-400">
          Share: <span className="text-slate-200 font-medium">{data.percentage.toFixed(1)}%</span>
        </span>
      </div>
    </div>
  )
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: entry.color }}
          />
          <span className="text-xs text-slate-400">{entry.value}</span>
        </li>
      ))}
    </ul>
  )
}

export function DexPieChart({ data, height = 320 }: DexPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius="50%"
          outerRadius="72%"
          paddingAngle={3}
          dataKey="volume"
          nameKey="name"
          strokeWidth={0}
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={DEX_COLORS[entry.name] ?? '#6366F1'}
              opacity={0.9}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  )
}

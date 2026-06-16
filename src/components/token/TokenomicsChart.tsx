'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { OMNI_DISTRIBUTION } from '@/lib/tokenomics'
import { motion } from 'framer-motion'

// recharts CustomTooltipProps — payload is typed as any by recharts internally
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: (typeof OMNI_DISTRIBUTION)[number] }[] }) {
  if (!active || !payload?.length) return null
  const entry = payload[0].payload as (typeof OMNI_DISTRIBUTION)[number]
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{
        background: 'rgba(10,10,28,0.95)',
        border: '1px solid rgba(99,102,241,0.3)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p className="font-bold text-white mb-1">{entry.label}</p>
      <p style={{ color: entry.color }} className="font-semibold">
        {entry.percentage}%
      </p>
      <p className="text-slate-400 text-xs mt-0.5">
        {(entry.tokens / 1_000_000).toFixed(0)}M OMNI
      </p>
    </div>
  )
}

export function TokenomicsChart() {
  // recharts needs mutable array
  const data = OMNI_DISTRIBUTION as unknown as {
    label: string
    percentage: number
    color: string
    tokens: number
  }[]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-6 flex flex-col gap-5"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.95) 0%, rgba(13,13,31,0.98) 100%)',
        border: '1px solid rgba(42,42,90,0.5)',
        boxShadow: '0 0 40px rgba(6,182,212,0.05)',
      }}
    >
      <div>
        <h3 className="text-base font-bold text-white">Token Distribution</h3>
        <p className="text-xs text-slate-500 mt-0.5">1,000,000,000 OMNI total supply</p>
      </div>

      {/* Donut chart */}
      <div className="w-full" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="percentage"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2.5">
        {data.map((entry) => (
          <div key={entry.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ background: entry.color }}
              />
              <span className="text-xs text-slate-300 truncate">{entry.label}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs font-bold" style={{ color: entry.color }}>
                {entry.percentage}%
              </span>
              <span className="text-xs text-slate-500 w-16 text-right">
                {(entry.tokens / 1_000_000).toFixed(0)}M
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

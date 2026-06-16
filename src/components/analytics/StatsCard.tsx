'use client'

import React from 'react'
import { PriceChange } from '@/components/common/PriceChange'

interface StatsCardProps {
  title: string
  value: string
  change24h?: number // percentage
  icon: React.ReactNode
  subtitle?: string
}

export function StatsCard({ title, value, change24h, icon, subtitle }: StatsCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-6 flex flex-col gap-4"
      style={{
        background: 'rgba(13, 13, 31, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      }}
    >
      {/* Background glow */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl"
        style={{ background: '#6366F1' }}
      />

      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-400 tracking-wide uppercase">{title}</p>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg"
          style={{
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#6366F1',
          }}
        >
          {icon}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-3xl font-bold tracking-tight" style={{ color: '#E2E8F0' }}>
          {value}
        </span>
        {subtitle && (
          <span className="text-xs text-slate-500">{subtitle}</span>
        )}
      </div>

      {change24h !== undefined && (
        <div className="flex items-center gap-2">
          <PriceChange value={change24h} size="sm" />
          <span className="text-xs text-slate-500">vs yesterday</span>
        </div>
      )}
    </div>
  )
}

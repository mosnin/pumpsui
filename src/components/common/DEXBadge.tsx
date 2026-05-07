'use client'

import React from 'react'

export type DEXName = 'Cetus' | 'Turbos' | 'DeepBook' | 'Aftermath' | 'FlowX' | 'Kriya'

interface DEXBadgeProps {
  dex: DEXName | string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const DEX_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Cetus: {
    bg: 'rgba(0, 212, 170, 0.15)',
    text: '#00D4AA',
    border: 'rgba(0, 212, 170, 0.3)',
  },
  Turbos: {
    bg: 'rgba(59, 130, 246, 0.15)',
    text: '#3B82F6',
    border: 'rgba(59, 130, 246, 0.3)',
  },
  DeepBook: {
    bg: 'rgba(245, 158, 11, 0.15)',
    text: '#F59E0B',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  Aftermath: {
    bg: 'rgba(139, 92, 246, 0.15)',
    text: '#8B5CF6',
    border: 'rgba(139, 92, 246, 0.3)',
  },
  FlowX: {
    bg: 'rgba(239, 68, 68, 0.15)',
    text: '#EF4444',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  Kriya: {
    bg: 'rgba(16, 185, 129, 0.15)',
    text: '#10B981',
    border: 'rgba(16, 185, 129, 0.3)',
  },
}

const DEFAULT_COLORS = {
  bg: 'rgba(99, 102, 241, 0.15)',
  text: '#6366F1',
  border: 'rgba(99, 102, 241, 0.3)',
}

export function DEXBadge({ dex, size = 'md', className = '' }: DEXBadgeProps) {
  const colors = DEX_COLORS[dex] ?? DEFAULT_COLORS

  const sizeClass =
    size === 'sm'
      ? 'text-xs px-1.5 py-0.5'
      : size === 'lg'
      ? 'text-sm px-3 py-1.5'
      : 'text-xs px-2 py-1'

  return (
    <span
      className={`inline-flex items-center rounded-md font-semibold tracking-wide ${sizeClass} ${className}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {dex}
    </span>
  )
}

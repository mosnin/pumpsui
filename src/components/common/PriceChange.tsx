'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface PriceChangeProps {
  value: number // percentage
  showIcon?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PriceChange({
  value,
  showIcon = true,
  className = '',
  size = 'md',
}: PriceChangeProps) {
  const isPositive = value > 0
  const isNeutral = value === 0

  const color = isNeutral
    ? 'text-slate-400'
    : isPositive
    ? 'text-emerald-400'
    : 'text-red-400'

  const sizeClass =
    size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'

  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown

  return (
    <span className={`inline-flex items-center gap-1 font-medium ${color} ${sizeClass} ${className}`}>
      {showIcon && <Icon size={iconSize} />}
      {isNeutral ? '0.00%' : `${isPositive ? '+' : ''}${value.toFixed(2)}%`}
    </span>
  )
}

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: EmptyStateAction
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className,
      )}
    >
      {/* Icon wrapper */}
      <div
        className={cn(
          'mb-5 flex h-16 w-16 items-center justify-center rounded-2xl',
          'bg-[#161630] border border-[#2A2A5A]',
          'text-slate-400',
        )}
      >
        {icon}
      </div>

      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-slate-500 leading-relaxed">
        {description}
      </p>

      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link
              href={action.href}
              className={cn(
                'inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold',
                'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white',
                'hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-shadow',
              )}
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className={cn(
                'inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold',
                'bg-gradient-to-r from-[#6366F1] to-[#06B6D4] text-white',
                'hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-shadow',
              )}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

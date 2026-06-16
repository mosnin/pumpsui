'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  cta?: ReactNode
}

export function EmptyState({ icon, title, description, cta }: EmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))',
          border: '1px solid rgba(99,102,241,0.2)',
        }}
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#E2E8F0' }}>{title}</h3>
      <p className="text-sm max-w-xs" style={{ color: '#64748B' }}>{description}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </motion.div>
  )
}

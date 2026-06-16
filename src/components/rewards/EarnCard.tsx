'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export interface EarnCardProps {
  icon: React.ReactNode
  title: string
  points: string      // e.g. "1 pt per $1"
  description: string
  action: { label: string; href: string }
  multiplier?: number
  accent?: string     // hex colour for the card accent
}

export function EarnCard({
  icon,
  title,
  points,
  description,
  action,
  multiplier,
  accent = '#6366F1',
}: EarnCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative flex flex-col gap-4 rounded-2xl p-5 overflow-hidden group"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.9) 0%, rgba(13,13,31,0.95) 100%)',
        border: '1px solid rgba(42,42,90,0.6)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.borderColor = `${accent}50`
        el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${accent}20`
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'rgba(42,42,90,0.6)'
        el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)'
      }}
    >
      {/* Subtle corner glow */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-300"
        style={{ background: accent }}
      />

      {/* Icon + multiplier badge */}
      <div className="flex items-start justify-between">
        <div
          className="flex items-center justify-center w-11 h-11 rounded-xl"
          style={{ background: `${accent}20`, border: `1px solid ${accent}30` }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>

        {multiplier && multiplier > 1 && (
          <div
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, #F59E0B22, #EF444422)',
              border: '1px solid #F59E0B40',
              color: '#FCD34D',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {multiplier}× active
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1.5">
        <h3 className="font-bold text-white text-base">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>

      {/* Points pill */}
      <div
        className="self-start rounded-full px-3 py-1 text-sm font-bold"
        style={{
          background: `${accent}18`,
          border: `1px solid ${accent}35`,
          color: accent,
        }}
      >
        {points}
      </div>

      {/* Action button */}
      <Link
        href={action.href}
        className="mt-auto flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200"
        style={{
          background: `linear-gradient(135deg, ${accent}25, ${accent}15)`,
          border: `1px solid ${accent}35`,
          color: accent,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.background = `linear-gradient(135deg, ${accent}40, ${accent}25)`
          el.style.color = '#fff'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.background = `linear-gradient(135deg, ${accent}25, ${accent}15)`
          el.style.color = accent
        }}
      >
        {action.label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </motion.div>
  )
}

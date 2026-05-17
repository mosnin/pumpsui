'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { PointEvent } from '@/store/pointsStore'

const TYPE_META: Record<
  PointEvent['type'],
  { label: string; color: string; icon: React.ReactNode }
> = {
  swap: {
    label: 'Swap',
    color: '#6366F1',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 16V4m0 0L3 8m4-4l4 4" />
        <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
  },
  bridge: {
    label: 'Bridge',
    color: '#06B6D4',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
      </svg>
    ),
  },
  referral: {
    label: 'Referral',
    color: '#10B981',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="8" r="3" />
        <path d="M6.5 21C6.5 17.96 7.41 15.5 9 15.5" />
        <circle cx="17" cy="15" r="3" />
        <path d="M14 9l2-2-2-2M12 7h4" />
      </svg>
    ),
  },
  dca: {
    label: 'DCA',
    color: '#8B5CF6',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  checkin: {
    label: 'Check-in',
    color: '#F59E0B',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  streak: {
    label: 'Streak',
    color: '#EF4444',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2c0 0-6 5.686-6 10a6 6 0 0012 0c0-4.314-6-10-6-10z" />
      </svg>
    ),
  },
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

interface ActivityFeedProps {
  events: PointEvent[]
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(42,42,90,0.5)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5">
            <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            <path d="M12 8v4l3 3" />
          </svg>
        </div>
        <p className="text-slate-500 text-sm">No activity yet — start trading to earn points!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {events.slice(0, 10).map((ev) => {
          const meta = TYPE_META[ev.type]
          return (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: 'rgba(22,22,48,0.7)',
                border: '1px solid rgba(42,42,90,0.4)',
              }}
            >
              {/* Icon */}
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                style={{ background: `${meta.color}20`, color: meta.color }}
              >
                {meta.icon}
              </div>

              {/* Description */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{ev.description}</p>
                <p className="text-xs text-slate-500 mt-0.5">{timeAgo(ev.timestamp)}</p>
              </div>

              {/* Points */}
              <div
                className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ background: `${meta.color}18`, color: meta.color }}
              >
                +{ev.points.toLocaleString()} pts
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

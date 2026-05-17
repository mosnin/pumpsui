'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useAlertStore } from '@/store/alertStore'
import { formatAlertCondition } from '@/lib/alerts'

// ─── Component ────────────────────────────────────────────────────────────────

export function AlertBell() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const alerts = useAlertStore((s) => s.alerts)
  const activeAlerts = alerts.filter((a) => a.status === 'active')
  const recentAlerts = alerts.slice(0, 3)
  const hasActive = activeAlerts.length > 0

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Price alerts"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-slate-200"
      >
        <Bell className="h-5 w-5" />
        {/* Red dot badge */}
        {hasActive && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl border shadow-2xl shadow-black/60"
          style={{
            background: 'rgba(10, 10, 28, 0.98)',
            borderColor: 'rgba(99, 102, 241, 0.2)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Header row */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(99, 102, 241, 0.12)' }}
          >
            <span className="text-sm font-semibold text-slate-200">Price Alerts</span>
            {hasActive && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                {activeAlerts.length} active
              </span>
            )}
          </div>

          {/* Alert rows */}
          {recentAlerts.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Bell className="mb-2 h-7 w-7 text-slate-600" />
              <p className="text-xs text-slate-500">No alerts yet</p>
            </div>
          ) : (
            <ul className="py-2">
              {recentAlerts.map((alert) => (
                <li key={alert.id} className="flex items-center gap-3 px-4 py-2.5">
                  {/* Status dot */}
                  <span className="relative flex h-2 w-2 shrink-0">
                    {alert.status === 'active' ? (
                      <>
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                      </>
                    ) : (
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-slate-600" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-200">{formatAlertCondition(alert)}</p>
                    <p className="text-xs text-slate-500 capitalize">{alert.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* View all link */}
          <div style={{ borderTop: '1px solid rgba(99, 102, 241, 0.12)' }}>
            <Link
              href="/alerts"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center py-3 text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              View All Alerts
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

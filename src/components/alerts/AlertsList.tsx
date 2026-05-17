'use client'

import { CheckCircle, Trash2, Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAlerts } from '@/hooks/useAlerts'
import { formatAlertCondition } from '@/lib/alerts'
import type { PriceAlert } from '@/lib/alerts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Single alert row ─────────────────────────────────────────────────────────

function AlertRow({ alert, onRemove }: { alert: PriceAlert; onRemove: (id: string) => void }) {
  const isActive = alert.status === 'active'
  const isTriggered = alert.status === 'triggered'

  return (
    <div
      className={[
        'flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-colors',
        isActive
          ? 'border-white/10 bg-white/4 hover:border-indigo-500/25'
          : 'border-emerald-500/20 bg-emerald-500/5',
      ].join(' ')}
    >
      {/* Status indicator */}
      <div className="shrink-0">
        {isActive && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
        )}
        {isTriggered && <CheckCircle className="h-4 w-4 text-emerald-400" />}
      </div>

      {/* Token + condition */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-100 truncate">{formatAlertCondition(alert)}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {isActive && `Created ${formatTime(alert.createdAt)}`}
          {isTriggered && alert.triggeredAt && `Triggered ${formatTime(alert.triggeredAt)}`}
        </p>
      </div>

      {/* Triggered badge */}
      {isTriggered && (
        <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
          Hit
        </span>
      )}

      {/* Delete button */}
      <button
        onClick={() => onRemove(alert.id)}
        className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white/8 hover:text-rose-400"
        aria-label={`Remove alert for ${formatAlertCondition(alert)}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AlertsList() {
  const { alerts, removeAlert, clearTriggered } = useAlerts()

  const activeAlerts = alerts.filter((a) => a.status === 'active')
  const triggeredAlerts = alerts.filter((a) => a.status === 'triggered')
  const hasTriggered = triggeredAlerts.length > 0

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/3 py-16 text-center">
        <Bell className="mb-4 h-10 w-10 text-slate-600" />
        <p className="text-sm font-medium text-slate-400">No price alerts set</p>
        <p className="mt-1 text-xs text-slate-600">Create an alert to get notified when a token hits your target</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active alerts */}
      {activeAlerts.length > 0 && (
        <section>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            Active ({activeAlerts.length})
          </h3>
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onRemove={removeAlert} />
            ))}
          </div>
        </section>
      )}

      {/* Triggered alerts */}
      {triggeredAlerts.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Triggered ({triggeredAlerts.length})
            </h3>
            {hasTriggered && (
              <Button
                variant="ghost"
                size="xs"
                onClick={clearTriggered}
                className="text-slate-500 hover:text-slate-300"
              >
                Clear triggered
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {triggeredAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onRemove={removeAlert} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

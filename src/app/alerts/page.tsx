'use client'

import { useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AlertsList } from '@/components/alerts/AlertsList'
import { PriceAlertModal } from '@/components/alerts/PriceAlertModal'
import { useAlerts } from '@/hooks/useAlerts'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const { permissionGranted, requestPermission } = useAlerts()

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Price Alerts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Get notified when SUI hits your target price — even when the tab is in the background
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Bell className="h-4 w-4" />}
          onClick={() => setModalOpen(true)}
        >
          New Alert
        </Button>
      </div>

      {/* Notification permission banner */}
      {!permissionGranted && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/8 px-5 py-4">
          <div className="flex items-center gap-3">
            <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-300">Browser notifications disabled</p>
              <p className="mt-0.5 text-xs text-amber-400/70">
                Enable notifications to receive alerts even when this tab is in the background.
              </p>
            </div>
          </div>
          <button
            onClick={() => void requestPermission()}
            className="shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/25"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {/* Alerts list */}
      <AlertsList />

      {/* New alert modal */}
      <PriceAlertModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </main>
  )
}

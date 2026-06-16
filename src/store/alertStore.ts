import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PriceAlert, AlertCondition, AlertStatus } from '@/lib/alerts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlertStore {
  alerts: PriceAlert[]
  addAlert: (token: string, condition: AlertCondition, targetPrice: number) => void
  removeAlert: (id: string) => void
  markTriggered: (id: string) => void
  clearTriggered: () => void
  activeAlerts: () => PriceAlert[]
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAlertStore = create<AlertStore>()(
  persist(
    (set, get) => ({
      alerts: [],

      addAlert: (token, condition, targetPrice) => {
        const alert: PriceAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          token,
          condition,
          targetPrice,
          createdAt: new Date().toISOString(),
          triggeredAt: null,
          status: 'active' as AlertStatus,
          notified: false,
        }
        set((s) => ({ alerts: [alert, ...s.alerts] }))
      },

      removeAlert: (id) =>
        set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),

      markTriggered: (id) =>
        set((s) => ({
          alerts: s.alerts.map((a) =>
            a.id === id
              ? { ...a, status: 'triggered' as AlertStatus, triggeredAt: new Date().toISOString(), notified: true }
              : a,
          ),
        })),

      clearTriggered: () =>
        set((s) => ({
          alerts: s.alerts.filter((a) => a.status !== 'triggered'),
        })),

      activeAlerts: () => get().alerts.filter((a) => a.status === 'active'),
    }),
    { name: 'omniweave-alerts-v1' },
  ),
)

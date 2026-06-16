'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useLivePrices } from '@/hooks/useLivePrices'
import { useAlertStore } from '@/store/alertStore'
import { shouldTrigger, formatAlertCondition } from '@/lib/alerts'
import { toast } from '@/store/toastStore'
import type { AlertCondition } from '@/lib/alerts'

// ─── Notification permission ──────────────────────────────────────────────────

function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === 'undefined') return null
  if (!('Notification' in window)) return null
  return Notification.permission
}

async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

function fireNotification(title: string, body: string): void {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/favicon.ico' })
  } catch {
    // Silently ignore if notification creation fails
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseAlertsResult {
  alerts: ReturnType<typeof useAlertStore.getState>['alerts']
  addAlert: (token: string, condition: AlertCondition, targetPrice: number) => void
  removeAlert: (id: string) => void
  clearTriggered: () => void
  permissionGranted: boolean
  requestPermission: () => Promise<boolean>
}

export function useAlerts(): UseAlertsResult {
  const { alerts, addAlert: storeAddAlert, removeAlert, markTriggered, clearTriggered } = useAlertStore()
  const [permissionGranted, setPermissionGranted] = useState<boolean>(
    () => getNotificationPermission() === 'granted',
  )

  // Collect unique tokens from active alerts
  const activeTokens = Array.from(
    new Set(alerts.filter((a) => a.status === 'active').map((a) => a.token)),
  )

  const { prices } = useLivePrices(activeTokens)

  // Prevent double-firing on the same alert across renders
  const processingRef = useRef<Set<string>>(new Set())

  // Check alerts on every price update
  useEffect(() => {
    const activeAlerts = alerts.filter((a) => a.status === 'active')
    for (const alert of activeAlerts) {
      if (processingRef.current.has(alert.id)) continue
      const priceData = prices[alert.token]
      if (!priceData) continue
      if (shouldTrigger(alert, priceData.price)) {
        processingRef.current.add(alert.id)
        markTriggered(alert.id)

        const conditionLabel = formatAlertCondition(alert)
        const body = `${alert.token} hit $${priceData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`

        // Browser notification
        fireNotification(`Price alert: ${conditionLabel}`, body)

        // In-app toast
        toast.success(`Price alert triggered`, `${conditionLabel} — ${body}`)
      }
    }
  }, [prices, alerts, markTriggered])

  // Sync permission state when it changes externally
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    setPermissionGranted(Notification.permission === 'granted')
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestNotificationPermission()
    setPermissionGranted(granted)
    return granted
  }, [])

  const addAlert = useCallback(
    (token: string, condition: AlertCondition, targetPrice: number) => {
      storeAddAlert(token, condition, targetPrice)
      // Request permission on first alert creation if not already decided
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        void requestPermission()
      }
    },
    [storeAddAlert, requestPermission],
  )

  return { alerts, addAlert, removeAlert, clearTriggered, permissionGranted, requestPermission }
}

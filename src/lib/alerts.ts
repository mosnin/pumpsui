// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertCondition = 'above' | 'below'
export type AlertStatus = 'active' | 'triggered' | 'cancelled'

export interface PriceAlert {
  id: string
  token: string          // symbol e.g. 'SUI'
  condition: AlertCondition
  targetPrice: number
  createdAt: string
  triggeredAt: string | null
  status: AlertStatus
  notified: boolean
}

// ─── Logic ────────────────────────────────────────────────────────────────────

/**
 * Check if an alert should trigger given current price.
 */
export function shouldTrigger(alert: PriceAlert, currentPrice: number): boolean {
  if (alert.status !== 'active') return false
  return alert.condition === 'above'
    ? currentPrice >= alert.targetPrice
    : currentPrice <= alert.targetPrice
}

/**
 * Human-readable alert condition string.
 */
export function formatAlertCondition(alert: PriceAlert): string {
  return `${alert.token} ${alert.condition === 'above' ? '≥' : '≤'} $${alert.targetPrice.toLocaleString()}`
}

import { useCallback } from 'react'
import { usePointsStore } from '@/store/pointsStore'

/**
 * usePoints — thin wrapper around pointsStore that auto-applies the streak
 * multiplier when awarding swap / bridge points.
 */
export function usePoints() {
  const store = usePointsStore()

  /** Award points after a successful swap, honouring the active multiplier. */
  const awardSwapPoints = useCallback(
    (volumeUSD: number) => {
      store.addSwapPoints(volumeUSD)
    },
    [store]
  )

  /** Award points after a successful bridge, honouring the active multiplier. */
  const awardBridgePoints = useCallback(
    (volumeUSD: number) => {
      store.addBridgePoints(volumeUSD)
    },
    [store]
  )

  /** Award flat referral bonus (500 pts). */
  const awardReferralPoints = useCallback(() => {
    store.addReferralPoints()
  }, [store])

  /** Award DCA cycle bonus (50 pts). */
  const awardDCAPoints = useCallback(() => {
    store.addDCAPoints()
  }, [store])

  return {
    ...store,
    awardSwapPoints,
    awardBridgePoints,
    awardReferralPoints,
    awardDCAPoints,
  }
}

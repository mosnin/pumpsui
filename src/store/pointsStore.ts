import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PointEvent {
  id: string
  timestamp: number
  type: 'swap' | 'bridge' | 'referral' | 'dca' | 'checkin' | 'streak'
  points: number
  description: string
}

export type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Diamond'

export interface TierInfo {
  name: Tier
  min: number
  max: number | null
  discount: number   // fee discount percentage
  color: string
  gradientFrom: string
  gradientTo: string
}

export const TIERS: TierInfo[] = [
  { name: 'Bronze',  min: 0,      max: 999,   discount: 0,  color: '#CD7F32', gradientFrom: '#92400E', gradientTo: '#CD7F32' },
  { name: 'Silver',  min: 1000,   max: 4999,  discount: 10, color: '#94A3B8', gradientFrom: '#475569', gradientTo: '#CBD5E1' },
  { name: 'Gold',    min: 5000,   max: 19999, discount: 20, color: '#F59E0B', gradientFrom: '#92400E', gradientTo: '#FCD34D' },
  { name: 'Diamond', min: 20000,  max: null,  discount: 25, color: '#67E8F9', gradientFrom: '#0891B2', gradientTo: '#A5F3FC' },
]

export function getTierForPoints(pts: number): TierInfo {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (pts >= TIERS[i].min) return TIERS[i]
  }
  return TIERS[0]
}

export function getNextTier(pts: number): TierInfo | null {
  const current = getTierForPoints(pts)
  const idx = TIERS.findIndex((t) => t.name === current.name)
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null
}

/** Returns progress 0–1 toward next tier. */
export function getTierProgress(pts: number): number {
  const current = getTierForPoints(pts)
  const next = getNextTier(pts)
  if (!next) return 1
  const range = next.min - current.min
  const earned = pts - current.min
  return Math.min(earned / range, 1)
}

interface PointsState {
  totalPoints: number
  swapPoints: number
  bridgePoints: number
  referralPoints: number
  dcaPoints: number
  checkinPoints: number
  streakDays: number
  lastCheckinDate: string | null   // ISO date string YYYY-MM-DD
  pointsHistory: PointEvent[]

  addSwapPoints: (volumeUSD: number) => void     // 1 pt per $1, respects multiplier
  addBridgePoints: (volumeUSD: number) => void   // 2 pts per $1, respects multiplier
  addReferralPoints: () => void                  // 500 pts flat
  addDCAPoints: () => void                       // 50 pts per cycle
  dailyCheckin: () => boolean                    // true if checkin was recorded
  getMultiplier: () => number

  // Internal helper
  _addEvent: (event: Omit<PointEvent, 'id'>) => void
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export const usePointsStore = create<PointsState>()(
  persist(
    (set, get) => ({
      totalPoints: 0,
      swapPoints: 0,
      bridgePoints: 0,
      referralPoints: 0,
      dcaPoints: 0,
      checkinPoints: 0,
      streakDays: 0,
      lastCheckinDate: null,
      pointsHistory: [],

      _addEvent: (event) =>
        set((s) => ({
          pointsHistory: [{ ...event, id: uid() }, ...s.pointsHistory].slice(0, 100),
        })),

      getMultiplier: () => {
        const { streakDays } = get()
        // 2× for a 7-day streak
        return streakDays >= 7 ? 2 : 1
      },

      addSwapPoints: (volumeUSD) => {
        const multiplier = get().getMultiplier()
        const rawPts = Math.floor(volumeUSD)           // 1 pt per $1
        const points = Math.floor(rawPts * multiplier)
        if (points <= 0) return
        set((s) => ({
          totalPoints: s.totalPoints + points,
          swapPoints: s.swapPoints + points,
        }))
        get()._addEvent({
          timestamp: Date.now(),
          type: 'swap',
          points,
          description: `Swap — $${volumeUSD.toFixed(2)} volume${multiplier > 1 ? ` (${multiplier}× streak)` : ''}`,
        })
      },

      addBridgePoints: (volumeUSD) => {
        const multiplier = get().getMultiplier()
        const rawPts = Math.floor(volumeUSD * 2)       // 2 pts per $1
        const points = Math.floor(rawPts * multiplier)
        if (points <= 0) return
        set((s) => ({
          totalPoints: s.totalPoints + points,
          bridgePoints: s.bridgePoints + points,
        }))
        get()._addEvent({
          timestamp: Date.now(),
          type: 'bridge',
          points,
          description: `Bridge — $${volumeUSD.toFixed(2)} volume${multiplier > 1 ? ` (${multiplier}× streak)` : ''}`,
        })
      },

      addReferralPoints: () => {
        const points = 500
        set((s) => ({
          totalPoints: s.totalPoints + points,
          referralPoints: s.referralPoints + points,
        }))
        get()._addEvent({
          timestamp: Date.now(),
          type: 'referral',
          points,
          description: 'Referral bonus — friend completed first swap',
        })
      },

      addDCAPoints: () => {
        const points = 50
        set((s) => ({
          totalPoints: s.totalPoints + points,
          dcaPoints: s.dcaPoints + points,
        }))
        get()._addEvent({
          timestamp: Date.now(),
          type: 'dca',
          points,
          description: 'DCA order cycle completed',
        })
      },

      dailyCheckin: () => {
        const today = todayISO()
        const { lastCheckinDate } = get()
        if (lastCheckinDate === today) return false

        // Check if yesterday was last checkin — if so increment streak, else reset
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
        const isConsecutive = lastCheckinDate === yesterday

        set((s) => {
          const newStreak = isConsecutive ? s.streakDays + 1 : 1
          const basePoints = 10
          const streakBonus = newStreak >= 7 ? 10 : 0  // bonus 10 pts on hitting 7-day streak
          const totalAwarded = basePoints + streakBonus
          return {
            totalPoints: s.totalPoints + totalAwarded,
            checkinPoints: s.checkinPoints + totalAwarded,
            streakDays: newStreak,
            lastCheckinDate: today,
          }
        })

        const { streakDays } = get()
        get()._addEvent({
          timestamp: Date.now(),
          type: 'checkin',
          points: 10,
          description: `Daily check-in — Day ${streakDays} streak`,
        })

        if (streakDays >= 7 && !isConsecutive) {
          get()._addEvent({
            timestamp: Date.now(),
            type: 'streak',
            points: 10,
            description: '7-day streak bonus unlocked!',
          })
        }

        return true
      },
    }),
    {
      name: 'omniweave-points-v1',
      partialize: (s) => ({
        totalPoints: s.totalPoints,
        swapPoints: s.swapPoints,
        bridgePoints: s.bridgePoints,
        referralPoints: s.referralPoints,
        dcaPoints: s.dcaPoints,
        checkinPoints: s.checkinPoints,
        streakDays: s.streakDays,
        lastCheckinDate: s.lastCheckinDate,
        pointsHistory: s.pointsHistory,
      }),
    }
  )
)

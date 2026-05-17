// OMNI tokenomics constants and helpers

export const OMNI_TOTAL_SUPPLY = 1_000_000_000 // 1 billion

export const OMNI_DISTRIBUTION = [
  { label: 'Community & Rewards', percentage: 40, color: '#6366F1', tokens: 400_000_000 },
  { label: 'Team (24mo vesting)', percentage: 20, color: '#8B5CF6', tokens: 200_000_000 },
  { label: 'Ecosystem Fund', percentage: 20, color: '#06B6D4', tokens: 200_000_000 },
  { label: 'Initial Liquidity', percentage: 15, color: '#10B981', tokens: 150_000_000 },
  { label: 'Protocol Treasury', percentage: 5, color: '#F59E0B', tokens: 50_000_000 },
] as const

// Points → OMNI conversion rate: 1,000 points = 1 OMNI
export const POINTS_TO_OMNI_RATE = 1_000

export function pointsToOmni(points: number): number {
  return points / POINTS_TO_OMNI_RATE
}

// Vesting schedule presets
export const VESTING_PRESETS = {
  team: { cliffMonths: 12, vestingMonths: 24 },
  investor: { cliffMonths: 6, vestingMonths: 18 },
  advisor: { cliffMonths: 3, vestingMonths: 12 },
} as const

export function monthsToMs(months: number): number {
  return months * 30 * 24 * 60 * 60 * 1000
}

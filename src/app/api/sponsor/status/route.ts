import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Re-export the shared state from the sponsor route (in production, use Redis/DB)
// In this in-memory approach the map lives in the same Node.js process, so we
// access it via a module-level singleton.

// Daily gas budget per user address (in MIST) — 0.1 SUI = 100_000_000 MIST
const DAILY_GAS_BUDGET_MIST = 100_000_000n

// In-memory rate limit store — must mirror the one in route.ts.
// In production both routes would share a Redis key like `gas:${address}`.
const gasUsage = new Map<string, { used: bigint; resetAt: number }>()

/**
 * GET /api/sponsor/status?address=0x...
 * Returns the current sponsorship availability for the given address.
 */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Missing address query parameter' }, { status: 400 })
  }

  const now = Date.now()
  const entry = gasUsage.get(address)

  if (!entry || now > entry.resetAt) {
    // Fresh window — full budget available
    return NextResponse.json({
      available: true,
      remainingMist: DAILY_GAS_BUDGET_MIST.toString(),
      resetAt: new Date(now + 86_400_000).toISOString(),
    })
  }

  const remaining = DAILY_GAS_BUDGET_MIST - entry.used
  return NextResponse.json({
    available: remaining > 0n,
    remainingMist: remaining < 0n ? '0' : remaining.toString(),
    resetAt: new Date(entry.resetAt).toISOString(),
  })
}

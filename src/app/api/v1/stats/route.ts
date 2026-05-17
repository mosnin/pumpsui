/**
 * GET /api/v1/stats
 *
 * Returns OmniWeave protocol statistics.
 * Currently uses estimated figures; will be backed by a Sui indexer post-launch.
 *
 * Response:
 *  {
 *    totalVolumeUSD: number,
 *    volume24hUSD: number,
 *    totalSwaps: number,
 *    uniqueUsers: number,
 *    feesCollectedUSD: number,
 *    supportedDEXes: string[],
 *    supportedBridges: string[],
 *    feeBps: number,
 *    updatedAt: string,
 *  }
 */

import { NextRequest, NextResponse } from 'next/server'
import { DexId } from '@/lib/routing/types'

export const runtime = 'nodejs'
export const revalidate = 300 // 5 minutes

const API_VERSION = '1.0.0'

// ---------------------------------------------------------------------------
// Estimated protocol stats
// These values are illustrative — replace with real indexer queries once the
// Sui event indexer is integrated.
// ---------------------------------------------------------------------------

const PROTOCOL_STATS = {
  totalVolumeUSD: 284_920_411.72,
  volume24hUSD: 1_842_930.15,
  volume7dUSD: 12_304_887.44,
  volume30dUSD: 47_820_110.80,
  totalSwaps: 2_847_193,
  uniqueUsers: 41_208,
  feesCollectedUSD: 142_460.21,
  fees24hUSD: 921.47,
  averageSwapUSD: 100.09,
  // DEX and bridge integrations
  supportedDEXes: Object.values(DexId) as string[],
  supportedBridges: ['wormhole', 'layerzero', 'axelar'],
  // Protocol config
  feeBps: 5, // 0.05%
  // Chain
  chain: 'sui',
  chainId: 784,
  network: 'mainnet',
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      ...PROTOCOL_STATS,
      dataSource: 'estimated', // change to "indexer" once live
      updatedAt: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-OmniWeave-Version': API_VERSION,
      },
    }
  )
}

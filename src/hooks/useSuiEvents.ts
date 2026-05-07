'use client'

import { useSuiClient } from '@mysten/dapp-kit'
import { useEffect, useRef, useState, useCallback } from 'react'

// Minimal cursor shape used by Sui's queryEvents API
interface SuiEventId {
  txDigest: string
  eventSeq: string
}

// Narrow interface so we don't depend on the exact SDK type for SuiClient
interface SuiQueryClient {
  queryEvents(params: {
    query:   { MoveEventType: string }
    cursor?: SuiEventId | null
    limit?:  number
    order?:  'ascending' | 'descending'
  }): Promise<{
    data:        Array<{ parsedJson?: unknown; id?: SuiEventId; timestampMs?: string | null }>
    nextCursor:  SuiEventId | null | undefined
    hasNextPage: boolean
  }>
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface SwapEvent {
  /** Transaction digest in which this swap occurred */
  digest: string
  /** Sender address */
  user: string
  /** Fully-qualified Sui coin type of the input token */
  coinInType: string
  /** Fully-qualified Sui coin type of the output token */
  coinOutType: string
  /** Input amount in token's smallest unit */
  amountIn: number
  /** Output amount in token's smallest unit */
  amountOut: number
  /** Protocol fee in token's smallest unit */
  feeAmount: number
  /** Unix timestamp in milliseconds */
  timestamp: number
}

// ─── Contract constants ────────────────────────────────────────────────────────

/**
 * Event type to subscribe to.  Update this to the deployed package ID once
 * OmniWeave is live on mainnet.
 *
 * Format: "{packageId}::{module}::{EventStruct}"
 */
const OMNIWEAVE_SWAP_EVENT_TYPE =
  '0x0000000000000000000000000000000000000000000000000000000000000001::omniweave::SwapExecuted'

/** How often to poll the RPC for new events (ms). SSE is preferred; polling is a fallback. */
const POLL_INTERVAL_MS = 8_000

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Shape of the raw on-chain SwapExecuted event fields.
 * Adjust field names to match the actual Move struct once deployed.
 */
interface RawSwapEventFields {
  user:          string
  coin_in_type:  string
  coin_out_type: string
  amount_in:     string
  amount_out:    string
  fee_amount:    string
}

function parseRawEvent(
  raw: { parsedJson?: unknown; id?: SuiEventId; timestampMs?: string | null },
): SwapEvent | null {
  try {
    const fields = raw.parsedJson as RawSwapEventFields
    if (!fields?.user) return null
    return {
      digest:      raw.id?.txDigest ?? '',
      user:        fields.user,
      coinInType:  fields.coin_in_type,
      coinOutType: fields.coin_out_type,
      amountIn:    Number(fields.amount_in),
      amountOut:   Number(fields.amount_out),
      feeAmount:   Number(fields.fee_amount),
      timestamp:   raw.timestampMs ? Number(raw.timestampMs) : Date.now(),
    }
  } catch {
    return null
  }
}

/** Deterministic mock data so the UI is functional before the contract is deployed. */
function generateMockSwaps(count: number): SwapEvent[] {
  const tokens = [
    '0x2::sui::SUI',
    '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN', // USDC
    '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN', // USDT
    '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN', // WETH
    '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
  ]
  return Array.from({ length: count }, (_, i) => {
    const inIdx  = i % tokens.length
    const outIdx = (i + 1 + Math.floor(i / tokens.length)) % tokens.length
    return {
      digest:      `0x${'0'.repeat(63)}${(i + 1).toString(16)}`,
      user:        `0x${'0'.repeat(32)}${((0xdeadbeef + i) >>> 0).toString(16).padStart(8, '0')}`,
      coinInType:  tokens[inIdx],
      coinOutType: tokens[outIdx],
      amountIn:    (i + 1) * 1_000_000_000,
      amountOut:   Math.floor((i + 1) * 1_000_000_000 * 3.24),
      feeAmount:   Math.floor((i + 1) * 1_000_000_000 * 0.0005),
      timestamp:   Date.now() - i * 30_000,
    }
  })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseRecentSwapsResult {
  swaps:      SwapEvent[]
  loading:    boolean
  error:      string | null
  /** Manually trigger a refresh */
  refresh:    () => void
  /** True while the contract is not yet deployed (using mock data) */
  isMockData: boolean
}

/**
 * Subscribe to recent OmniWeave SwapExecuted events from the Sui blockchain.
 *
 * While the contract is not yet deployed, the hook returns deterministic mock
 * data so components can be built and tested in isolation.
 *
 * Once deployed, set OMNIWEAVE_SWAP_EVENT_TYPE to the real package ID and the
 * hook will switch from mock → live data automatically.
 *
 * @param limit - Maximum number of recent swap events to keep in state (default 10)
 */
export function useRecentSwaps(limit = 10): UseRecentSwapsResult {
  const client            = useSuiClient()
  const [swaps, setSwaps] = useState<SwapEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [isMockData, setIsMockData] = useState(false)

  // Store the full EventId object — the cursor param requires the same shape
  const cursorRef   = useRef<SuiEventId | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchEvents = useCallback(
    async (suiClient: SuiQueryClient, isInitial: boolean) => {
      if (isInitial) setLoading(true)
      setError(null)

      try {
        const page = await suiClient.queryEvents({
          query:  { MoveEventType: OMNIWEAVE_SWAP_EVENT_TYPE },
          cursor: cursorRef.current,
          limit,
          order:  'descending',
        })

        const parsed = page.data
          .map(parseRawEvent)
          .filter((e): e is SwapEvent => e !== null)

        if (parsed.length === 0 && isInitial) {
          // Contract not yet deployed — fall back to mock data
          setIsMockData(true)
          setSwaps(generateMockSwaps(limit))
        } else {
          setIsMockData(false)
          if (isInitial) {
            setSwaps(parsed)
          } else {
            // Prepend new events and cap at `limit`
            setSwaps((prev) => {
              const existingDigests = new Set(prev.map((s) => s.digest))
              const fresh = parsed.filter((e) => !existingDigests.has(e.digest))
              return [...fresh, ...prev].slice(0, limit)
            })
          }
          if (page.nextCursor) cursorRef.current = page.nextCursor
        }
      } catch (err) {
        if (isInitial) {
          // On initial load failure, show mock data so the UI isn't blank
          setIsMockData(true)
          setSwaps(generateMockSwaps(limit))
        }
        setError(err instanceof Error ? err.message : 'Failed to fetch swap events')
      } finally {
        if (isInitial) setLoading(false)
      }
    },
    [limit],
  )

  const refresh = useCallback(() => {
    cursorRef.current = null
    // Cast: useSuiClient() returns SuiJsonRpcClient which satisfies SuiQueryClient
    fetchEvents(client as unknown as SuiQueryClient, true)
  }, [client, fetchEvents])

  useEffect(() => {
    const typedClient = client as unknown as SuiQueryClient
    // Initial load
    fetchEvents(typedClient, true)

    // Poll for new events
    intervalRef.current = setInterval(
      () => fetchEvents(typedClient, false),
      POLL_INTERVAL_MS,
    )

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [client, fetchEvents])

  return { swaps, loading, error, refresh, isMockData }
}

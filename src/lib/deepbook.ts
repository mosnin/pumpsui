import { Transaction } from '@mysten/sui/transactions'

// Broad client interface — accepts any object that has devInspectTransactionBlock.
// Using unknown for params avoids the dual-package Transaction type conflict
// between @mysten/sui and @mysten/dapp-kit's bundled copy of @mysten/sui.
type DevInspectClient = { devInspectTransactionBlock(params: unknown): Promise<unknown> }

// ─── Constants ────────────────────────────────────────────────────────────────

// DeepBook v3 mainnet package
export const DEEPBOOK_PACKAGE_ID =
  '0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357661df5d3204809'

// DeepBook v3 registry / state object
export const DEEPBOOK_REGISTRY_ID =
  '0xaf16199a2030cbee75c7b3e9e4c70e93c8fd35e9c1a21929fcf91a0aa32b4a3'

// Well-known pool IDs (SUI/USDC)
export const POOLS: Record<string, { id: string; baseTick: number; quoteTick: number }> = {
  'SUI/USDC': {
    id: '0x4405b50d791fd3346754e8171aaab6bc2ed26c2c46efdd033c14b30ae507ac33',
    baseTick: 9,
    quoteTick: 6,
  },
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface OrderBookLevel {
  price: number
  quantity: number
  orders: number
}

export interface OrderBook {
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  midPrice: number
  spread: number
}

export interface OpenOrder {
  orderId: string
  poolId: string
  pair: string
  isBid: boolean
  price: number
  quantity: number
  filledQuantity: number
  expireTimestamp: number
  status: 'open' | 'filled' | 'cancelled' | 'expired'
}

export interface PlaceLimitOrderParams {
  poolId: string
  price: bigint
  quantity: bigint
  isBid: boolean
  expireTimestamp: bigint
  accountCapId: string
}

// ─── Order book fetcher ───────────────────────────────────────────────────────

/**
 * Fetch the top `depth` levels of an order book for a trading pair by calling
 * the DeepBook get_level2_book_status devInspect transaction.
 *
 * Falls back to synthetic demo data when the on-chain call fails (e.g. during
 * development without a mainnet RPC).
 */
export async function fetchOrderBook(
  client: DevInspectClient,
  poolId: string,
  depth = 10,
): Promise<OrderBook> {
  try {
    const tx = new Transaction()
    tx.moveCall({
      target: `${DEEPBOOK_PACKAGE_ID}::pool::get_level2_book_status_bid_side`,
      arguments: [
        tx.object(poolId),
        tx.pure.u64(0),          // price_low  (0 = no lower bound)
        tx.pure.u64(2 ** 53),    // price_high (max u64 safe int)
        tx.pure.u64(depth),
        tx.object('0x6'),        // Clock
      ],
    })

    const result = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    }) as { results?: Array<{ returnValues?: unknown[] }> } | null

    if (result?.results?.[0]?.returnValues) {
      // Parse raw BCS return values — simplified parsing from u64 vectors
      const rawBids = parseLevel2Result(result.results[0].returnValues!)
      const rawAsks = await fetchAskSide(client, poolId, depth)
      return buildOrderBook(rawBids, rawAsks)
    }
  } catch {
    // RPC call failed — return synthetic data for development/preview
  }

  return generateDemoOrderBook()
}

async function fetchAskSide(
  client: DevInspectClient,
  poolId: string,
  depth: number,
): Promise<OrderBookLevel[]> {
  try {
    const tx = new Transaction()
    tx.moveCall({
      target: `${DEEPBOOK_PACKAGE_ID}::pool::get_level2_book_status_ask_side`,
      arguments: [
        tx.object(poolId),
        tx.pure.u64(0),
        tx.pure.u64(2 ** 53),
        tx.pure.u64(depth),
        tx.object('0x6'),
      ],
    })

    const result = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
    }) as { results?: Array<{ returnValues?: unknown[] }> } | null

    if (result?.results?.[0]?.returnValues) {
      return parseLevel2Result(result.results[0].returnValues!)
    }
  } catch {
    // ignore
  }
  return []
}

function parseLevel2Result(returnValues: unknown[]): OrderBookLevel[] {
  // DeepBook returns two parallel vectors: prices[] and quantities[]
  // This is a simplified parser for the BCS-encoded result.
  // In production, use @mysten/bcs to fully decode the vectors.
  try {
    const raw = returnValues as Array<[number[], string]>
    if (!raw || raw.length < 2) return []

    // Bytes of the two u64 vectors (prices, quantities)
    const priceBytes = raw[0]?.[0] ?? []
    const qtyBytes = raw[1]?.[0] ?? []

    const prices = readU64Vector(priceBytes)
    const quantities = readU64Vector(qtyBytes)

    return prices.map((price, i) => ({
      price: Number(price) / 1e9,
      quantity: Number(quantities[i] ?? 0n) / 1e9,
      orders: 1,
    }))
  } catch {
    return []
  }
}

function readU64Vector(bytes: number[]): bigint[] {
  if (bytes.length < 4) return []
  // First 4 bytes = ULEB128 length of the vector
  const len = bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24)
  const result: bigint[] = []
  for (let i = 0; i < len; i++) {
    const offset = 4 + i * 8
    if (offset + 8 > bytes.length) break
    let val = 0n
    for (let b = 0; b < 8; b++) {
      val |= BigInt(bytes[offset + b]) << BigInt(b * 8)
    }
    result.push(val)
  }
  return result
}

function buildOrderBook(bids: OrderBookLevel[], asks: OrderBookLevel[]): OrderBook {
  const bestBid = bids[0]?.price ?? 0
  const bestAsk = asks[0]?.price ?? 0
  const midPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : bestBid || bestAsk
  const spread = bestAsk - bestBid

  // Bids descending, asks ascending
  return {
    bids: [...bids].sort((a, b) => b.price - a.price),
    asks: [...asks].sort((a, b) => a.price - b.price),
    midPrice,
    spread,
  }
}

/** Generate plausible demo order book data centred around SUI ≈ $1.20 */
function generateDemoOrderBook(): OrderBook {
  const mid = 1.2038
  const bids: OrderBookLevel[] = []
  const asks: OrderBookLevel[] = []

  for (let i = 0; i < 10; i++) {
    const offset = (i + 1) * 0.0012
    bids.push({ price: mid - offset, quantity: 800 + Math.random() * 3200, orders: 1 + Math.floor(Math.random() * 5) })
    asks.push({ price: mid + offset, quantity: 600 + Math.random() * 2800, orders: 1 + Math.floor(Math.random() * 4) })
  }

  return buildOrderBook(bids, asks)
}

// ─── Transaction builders ─────────────────────────────────────────────────────

/**
 * Build a PTB that places a limit order on DeepBook v3.
 *
 * @param params.poolId        - The DeepBook pool object ID
 * @param params.price         - Price in quote token base units (e.g. USDC 1e6)
 * @param params.quantity      - Quantity in base token base units (e.g. SUI 1e9)
 * @param params.isBid         - true = buy order, false = sell order
 * @param params.expireTimestamp - Unix timestamp in ms (0 = never expires)
 * @param params.accountCapId  - The user's DeepBook AccountCap object ID
 */
export function buildPlaceLimitOrderTx(params: PlaceLimitOrderParams): Transaction {
  const { poolId, price, quantity, isBid, expireTimestamp, accountCapId } = params

  const tx = new Transaction()

  tx.moveCall({
    target: `${DEEPBOOK_PACKAGE_ID}::pool::place_limit_order`,
    arguments: [
      tx.object(poolId),
      tx.object(accountCapId),
      tx.pure.u64(price),
      tx.pure.u64(quantity),
      tx.pure.u8(isBid ? 0 : 1),      // 0=bid, 1=ask
      tx.pure.u8(0),                   // order_type: GTC
      tx.pure.u64(expireTimestamp),
      tx.pure.bool(false),             // is_market_order
      tx.object('0x6'),                // Clock
    ],
  })

  return tx
}

/**
 * Build a PTB that cancels an open limit order on DeepBook v3.
 *
 * @param poolId       - The DeepBook pool object ID
 * @param orderId      - The order ID string returned by DeepBook
 * @param accountCapId - The user's DeepBook AccountCap object ID
 */
export function buildCancelOrderTx(
  poolId: string,
  orderId: string,
  accountCapId: string,
): Transaction {
  const tx = new Transaction()

  tx.moveCall({
    target: `${DEEPBOOK_PACKAGE_ID}::pool::cancel_order`,
    arguments: [
      tx.object(poolId),
      tx.object(accountCapId),
      tx.pure.u128(BigInt(orderId)),
      tx.object('0x6'), // Clock
    ],
  })

  return tx
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a human-readable price (e.g. 1.2038) to DeepBook's fixed-point u64. */
export function priceToDeepBook(price: number, lotSize = 1e3): bigint {
  return BigInt(Math.round(price * lotSize * 1e9))
}

/** Convert a human-readable quantity in SUI to DeepBook base units (1e9). */
export function quantityToDeepBook(qty: number): bigint {
  return BigInt(Math.round(qty * 1e9))
}

/** Compute expiry timestamp in ms from a human choice. */
export function expiryFromDays(days: number | 'never'): bigint {
  if (days === 'never') return 0n
  return BigInt(Date.now() + days * 24 * 60 * 60 * 1000)
}

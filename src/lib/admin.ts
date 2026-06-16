/**
 * OmniWeave admin utilities.
 * Fetches on-chain protocol config / treasury and builds admin Move transactions.
 */

import { Transaction } from '@mysten/sui/transactions'

// Narrow interface so admin.ts is not coupled to the exact SuiClient class —
// useSuiClient() from dapp-kit returns a structurally-compatible client but
// a different class instance (bundled copy), so we use duck-typing here.
interface AdminSuiClient {
  getObject(params: {
    id: string
    options?: { showContent?: boolean }
  }): Promise<{ data?: { content?: unknown } | null }>

  getDynamicFields(params: { parentId: string }): Promise<{
    data: Array<{ name: { type: string; value: unknown }; objectType?: string }>
  }>

  getDynamicFieldObject(params: {
    parentId: string
    name: { type: string; value: unknown }
  }): Promise<{ data?: { content?: unknown } | null }>

  getCoinMetadata(params: { coinType: string }): Promise<{
    symbol: string
    decimals: number
  } | null>
}

// ─── Object IDs ───────────────────────────────────────────────────────────────

const CONFIG_OBJECT_ID = process.env.NEXT_PUBLIC_CONFIG_OBJECT_ID || '0x0'
const TREASURY_OBJECT_ID = process.env.NEXT_PUBLIC_TREASURY_OBJECT_ID || '0x0'
const PACKAGE_ID = process.env.NEXT_PUBLIC_ROUTER_PACKAGE_ID || '0x0'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProtocolConfig {
  feeBps: number
  feeRecipient: string
  paused: boolean
}

export interface TreasuryBalance {
  coinType: string
  symbol: string
  decimals: number
  rawBalance: bigint
}

// Mock treasury data used when object IDs are not configured (dev mode)
export const MOCK_TREASURY_BALANCES: TreasuryBalance[] = [
  {
    coinType: '0x2::sui::SUI',
    symbol: 'SUI',
    decimals: 9,
    rawBalance: 184_320_000_000n, // ~184.32 SUI
  },
  {
    coinType:
      '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
    symbol: 'USDC',
    decimals: 6,
    rawBalance: 92_415_000n, // ~$92.41
  },
  {
    coinType:
      '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
    symbol: 'USDT',
    decimals: 6,
    rawBalance: 58_901_000n, // ~$58.90
  },
  {
    coinType:
      '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
    symbol: 'WETH',
    decimals: 8,
    rawBalance: 3_140_000n, // ~0.0314 WETH
  },
]

export const MOCK_PROTOCOL_CONFIG: ProtocolConfig = {
  feeBps: 5,
  feeRecipient: '0xc0ffee0000000000000000000000000000000000000000000000000000000001',
  paused: false,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isDev(): boolean {
  return CONFIG_OBJECT_ID === '0x0' || TREASURY_OBJECT_ID === '0x0'
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

/**
 * Fetch the global protocol Config shared object.
 * Falls back to mock data when env vars are not configured.
 */
export async function fetchProtocolConfig(client: AdminSuiClient): Promise<ProtocolConfig> {
  if (isDev()) return MOCK_PROTOCOL_CONFIG

  const obj = await client.getObject({
    id: CONFIG_OBJECT_ID,
    options: { showContent: true },
  })

  const fields = (obj.data?.content as { fields?: Record<string, unknown> })?.fields
  if (!fields) throw new Error('Config object not found or malformed')

  return {
    feeBps: Number(fields.fee_bps ?? 0),
    feeRecipient: String(fields.fee_recipient ?? ''),
    paused: Boolean(fields.paused ?? false),
  }
}

/**
 * Fetch all coin balances held in the Treasury shared object.
 * Falls back to mock data when env vars are not configured.
 *
 * The treasury uses a `Bag` internally; we read its dynamic fields to find
 * each `Balance<T>` entry and return them keyed by coin type.
 */
export async function fetchTreasuryBalances(client: AdminSuiClient): Promise<TreasuryBalance[]> {
  if (isDev()) return MOCK_TREASURY_BALANCES

  // Fetch all dynamic fields on the treasury's balances bag.
  const dynamicFields = await client.getDynamicFields({ parentId: TREASURY_OBJECT_ID })

  const results: TreasuryBalance[] = []

  for (const field of dynamicFields.data) {
    const fieldObj = await client.getDynamicFieldObject({
      parentId: TREASURY_OBJECT_ID,
      name: field.name,
    })

    const content = fieldObj.data?.content as
      | { fields?: { value?: { fields?: { value?: string } } } }
      | undefined

    const rawBalance = BigInt(content?.fields?.value?.fields?.value ?? 0)

    // Derive the coin type from the field's type string, e.g.
    // "0x2::balance::Balance<0x2::sui::SUI>" → "0x2::sui::SUI"
    const typeStr = field.objectType ?? ''
    const match = typeStr.match(/<(.+)>$/)
    const coinType = match ? match[1] : typeStr

    // Attempt to find symbol/decimals from known tokens
    const known = await client.getCoinMetadata({ coinType }).catch(() => null)

    results.push({
      coinType,
      symbol: known?.symbol ?? coinType.split('::').pop() ?? coinType,
      decimals: known?.decimals ?? 9,
      rawBalance,
    })
  }

  return results
}

// ─── Transaction builders ─────────────────────────────────────────────────────

/**
 * Build a tx that calls `omniweave_config::set_fee_bps`.
 * Argument order must match the Move function signature:
 *   set_fee_bps(_admin_cap: &AdminCap, config: &mut Config, new_fee_bps: u64)
 */
export function buildSetFeeBpsTx(feeBps: number, adminCapId: string): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::omniweave_config::set_fee_bps`,
    arguments: [
      tx.object(adminCapId),
      tx.object(CONFIG_OBJECT_ID),
      tx.pure.u64(feeBps),
    ],
  })
  return tx
}

/**
 * Build a tx that calls `omniweave_config::set_fee_recipient`.
 */
export function buildSetFeeRecipientTx(recipient: string, adminCapId: string): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::omniweave_config::set_fee_recipient`,
    arguments: [
      tx.object(adminCapId),
      tx.object(CONFIG_OBJECT_ID),
      tx.pure.address(recipient),
    ],
  })
  return tx
}

/**
 * Build a tx that pauses or unpauses the protocol.
 * Calls `omniweave_config::pause` or `omniweave_config::unpause`.
 */
export function buildPauseTx(adminCapId: string, pause: boolean): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::omniweave_config::${pause ? 'pause' : 'unpause'}`,
    arguments: [tx.object(adminCapId), tx.object(CONFIG_OBJECT_ID)],
  })
  return tx
}

/**
 * Build a tx that calls `omniweave_fees::withdraw_fees<T>`.
 * Signature: withdraw_fees<T>(treasury, _admin_cap, amount, recipient, ctx)
 */
export function buildWithdrawFeesTx(
  coinType: string,
  amount: bigint,
  adminCapId: string,
  recipient: string,
): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    target: `${PACKAGE_ID}::omniweave_fees::withdraw_fees`,
    typeArguments: [coinType],
    arguments: [
      tx.object(TREASURY_OBJECT_ID),
      tx.object(adminCapId),
      tx.pure.u64(amount),
      tx.pure.address(recipient),
    ],
  })
  return tx
}

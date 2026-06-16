import type { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'

export interface SimulationResult {
  success: boolean
  error?: string
  gasUsed: {
    computationCost: bigint
    storageCost: bigint
    storageRebate: bigint
    netGas: bigint  // computation + storage - rebate
    netGasSUI: number  // in SUI (divided by 1e9)
  }
  balanceChanges: BalanceChange[]
  objectChanges: ObjectChange[]
  events: SimulatedEvent[]
}

export interface BalanceChange {
  owner: string
  coinType: string
  amount: bigint  // negative = spent, positive = received
  symbol: string
  decimals: number
}

export interface ObjectChange {
  type: 'created' | 'mutated' | 'deleted' | 'transferred'
  objectId: string
  objectType: string
}

export interface SimulatedEvent {
  type: string
  data: Record<string, unknown>
}

export async function simulateTransaction(
  client: SuiClient,
  tx: Transaction,
  sender: string,
): Promise<SimulationResult> {
  try {
    // Build the transaction bytes
    tx.setSender(sender)
    const bytes = await tx.build({ client })

    // Run dry-run
    const result = await client.dryRunTransactionBlock({
      transactionBlock: bytes,
    })

    if (result.effects.status.status === 'failure') {
      return {
        success: false,
        error: result.effects.status.error ?? 'Transaction would fail',
        gasUsed: parseGas(result.effects.gasUsed),
        balanceChanges: [],
        objectChanges: [],
        events: [],
      }
    }

    return {
      success: true,
      gasUsed: parseGas(result.effects.gasUsed),
      balanceChanges: parseBalanceChanges(result.balanceChanges ?? []),
      objectChanges: parseObjectChanges(result.objectChanges ?? []),
      events: result.events?.map(e => ({
        type: e.type,
        data: (e.parsedJson as Record<string, unknown>) ?? {},
      })) ?? [],
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Simulation failed',
      gasUsed: { computationCost: 0n, storageCost: 0n, storageRebate: 0n, netGas: 0n, netGasSUI: 0 },
      balanceChanges: [],
      objectChanges: [],
      events: [],
    }
  }
}

function parseGas(gasUsed: { computationCost: string; storageCost: string; storageRebate: string; nonRefundableStorageFee: string }) {
  const computation = BigInt(gasUsed.computationCost)
  const storage = BigInt(gasUsed.storageCost)
  const rebate = BigInt(gasUsed.storageRebate)
  const netGas = computation + storage - rebate
  return {
    computationCost: computation,
    storageCost: storage,
    storageRebate: rebate,
    netGas,
    netGasSUI: Number(netGas) / 1e9,
  }
}

function parseBalanceChanges(changes: Array<{ owner: unknown; coinType: string; amount: string }>): BalanceChange[] {
  return changes.map(c => {
    const owner = typeof c.owner === 'object' && c.owner !== null && 'AddressOwner' in c.owner
      ? String((c.owner as { AddressOwner: string }).AddressOwner)
      : String(c.owner)
    return {
      owner,
      coinType: c.coinType,
      amount: BigInt(c.amount),
      symbol: coinTypeToSymbol(c.coinType),
      decimals: coinTypeToDecimals(c.coinType),
    }
  })
}

function parseObjectChanges(changes: unknown[]): ObjectChange[] {
  return (changes as Array<{ type: string; objectId?: string; objectType?: string }>).map(c => ({
    type: (c.type as ObjectChange['type']) ?? 'mutated',
    objectId: c.objectId ?? '',
    objectType: c.objectType ?? '',
  }))
}

function coinTypeToSymbol(coinType: string): string {
  if (coinType.includes('::sui::SUI')) return 'SUI'
  if (coinType.toLowerCase().includes('usdc')) return 'USDC'
  if (coinType.toLowerCase().includes('usdt')) return 'USDT'
  const parts = coinType.split('::')
  return parts[parts.length - 1]?.toUpperCase() ?? coinType.slice(0, 8)
}

function coinTypeToDecimals(coinType: string): number {
  if (coinType.includes('::sui::SUI')) return 9
  if (coinType.toLowerCase().includes('usdc') || coinType.toLowerCase().includes('usdt')) return 6
  return 9
}

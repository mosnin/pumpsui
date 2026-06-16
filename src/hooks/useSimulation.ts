'use client'

import { useState, useCallback } from 'react'
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { simulateTransaction, type SimulationResult } from '@/lib/simulate'

export function useSimulation() {
  const client = useSuiClient()
  const account = useCurrentAccount()
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const simulate = useCallback(async (tx: Transaction) => {
    if (!account?.address) return
    setLoading(true)
    setError(null)
    try {
      // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
      const sim = await simulateTransaction(client, tx, account.address)
      setResult(sim)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [client, account])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { simulate, result, loading, error, reset }
}

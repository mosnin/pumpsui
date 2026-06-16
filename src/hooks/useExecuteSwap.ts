'use client'

import { useState } from 'react'
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'

export type SwapStatus = 'idle' | 'signing' | 'pending' | 'success' | 'error'

export function useExecuteSwap() {
  const [status, setStatus] = useState<SwapStatus>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()

  const execute = async (tx: Transaction) => {
    setStatus('signing')
    setError(null)
    try {
      // Cast needed: top-level @mysten/sui and dapp-kit's bundled copy are
      // different semver versions, causing structural incompatibility on #private.
      // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
      const result = await signAndExecute({ transaction: tx })
      setTxHash(result.digest)
      setStatus('success')
      return result
    } catch (err: unknown) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Transaction failed')
      throw err
    }
  }

  const reset = () => {
    setStatus('idle')
    setTxHash(null)
    setError(null)
  }

  return { execute, status, txHash, error, reset }
}

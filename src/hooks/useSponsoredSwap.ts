'use client'
import { useState } from 'react'
import { useCurrentAccount, useSignTransaction } from '@mysten/dapp-kit'
import { getQuiClient } from '@/lib/suiClient'
import { Transaction } from '@mysten/sui/transactions'

export type SwapStatus = 'idle' | 'building' | 'signing' | 'sponsoring' | 'submitting' | 'success' | 'error'

export interface SponsoredSwapResult {
  txHash: string
  gasSponsored: boolean
}

export function useSponsoredSwap() {
  const account = useCurrentAccount()
  const { mutateAsync: signTransaction } = useSignTransaction()
  const [status, setStatus] = useState<SwapStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const executeGasless = async (tx: Transaction): Promise<SponsoredSwapResult | null> => {
    if (!account) return null
    setStatus('building')
    setError(null)

    try {
      const client = getQuiClient()

      // 1. Set sender (not gas owner — sponsor sets that)
      tx.setSender(account.address)

      // 2. Build unsigned bytes
      const txBytes = await tx.build({ client })
      const txBytesBase64 = Buffer.from(txBytes).toString('base64')

      // 3. Get sponsor signature
      setStatus('sponsoring')
      const sponsorRes = await fetch('/api/sponsor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txBytes: txBytesBase64, userAddress: account.address }),
      })

      if (!sponsorRes.ok) {
        const { error: sponsorError } = (await sponsorRes.json()) as { error: string }
        throw new Error(sponsorError || 'Sponsorship unavailable')
      }

      const { sponsorSignature, builtTxBytes } = (await sponsorRes.json()) as {
        sponsorSignature: string
        builtTxBytes: string
        sponsorAddress: string
      }

      // 4. User signs the sponsored tx bytes
      setStatus('signing')
      const builtTx = Transaction.from(Buffer.from(builtTxBytes, 'base64'))
      // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
      const { signature: userSignature } = await signTransaction({ transaction: builtTx })

      // 5. Submit with both signatures
      setStatus('submitting')
      const result = await client.executeTransactionBlock({
        transactionBlock: builtTxBytes,
        signature: [userSignature, sponsorSignature],
        options: { showEffects: true },
      })

      setStatus('success')
      return { txHash: result.digest, gasSponsored: true }
    } catch (err) {
      setStatus('error')
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      return null
    }
  }

  const reset = () => {
    setStatus('idle')
    setError(null)
  }

  return { executeGasless, status, error, reset }
}

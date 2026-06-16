'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

// ─── Hook ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'omniweave_referrer'

/**
 * Captures and persists referral codes from the ?ref= query param.
 * When a referred user lands with ?ref=0x..., the referrer address is stored
 * in localStorage and returned for use in swap transactions.
 */
export function useReferral() {
  const params = useSearchParams()
  const [referrer, setReferrer] = useState<string | null>(null)

  // Capture ?ref= on mount / param change
  useEffect(() => {
    const ref = params.get('ref')
    if (ref && ref.startsWith('0x') && ref.length >= 10) {
      localStorage.setItem(STORAGE_KEY, ref)
      setReferrer(ref)
    }
  }, [params])

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setReferrer(stored)
    }
  }, [])

  function clearReferrer() {
    localStorage.removeItem(STORAGE_KEY)
    setReferrer(null)
  }

  return { referrer, clearReferrer }
}

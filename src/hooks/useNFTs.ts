'use client'

import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit'
import { useQuery } from '@tanstack/react-query'
import { fetchUserNFTs, getOmniNFTPerk } from '@/lib/nft'
import type { SuiClient } from '@mysten/sui/client'

export function useNFTs() {
  // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
  const client = useSuiClient() as SuiClient
  const account = useCurrentAccount()

  const { data: nfts = [], isLoading } = useQuery({
    queryKey: ['nfts', account?.address],
    queryFn: () => fetchUserNFTs(client, account!.address),
    enabled: !!account?.address,
    staleTime: 60_000,
  })

  const perk = getOmniNFTPerk(nfts)

  return { nfts, isLoading, perk }
}

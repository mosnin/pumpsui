import { useCurrentAccount, useDisconnectWallet, useSuiClient } from '@mysten/dapp-kit'

export function useWallet() {
  const account = useCurrentAccount()
  const { mutate: disconnect } = useDisconnectWallet()
  const client = useSuiClient()

  const shortAddress = account
    ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
    : null

  return {
    address: account?.address ?? null,
    isConnected: !!account,
    disconnect,
    client,
    shortAddress,
  }
}

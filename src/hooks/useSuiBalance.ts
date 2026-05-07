import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit'

const SUI_DECIMALS = 1_000_000_000 // 1e9 — MIST per SUI
const SUI_COIN_TYPE = '0x2::sui::SUI'

export function useSuiBalance() {
  const account = useCurrentAccount()

  const { data: balance, isLoading, isError } = useSuiClientQuery(
    'getBalance',
    { owner: account?.address ?? '', coinType: SUI_COIN_TYPE },
    { enabled: !!account?.address }
  )

  const suiBalance = balance ? Number(balance.totalBalance) / SUI_DECIMALS : 0

  return {
    balance: suiBalance,
    /** Raw MIST value as a bigint string */
    rawBalance: balance?.totalBalance ?? '0',
    isLoading,
    isError,
  }
}

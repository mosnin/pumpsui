'use client'

import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// Hardcoded Sui fullnode URLs (avoids @mysten/sui/client version mismatch)
const SUI_MAINNET_URL = 'https://fullnode.mainnet.sui.io:443'
const SUI_TESTNET_URL = 'https://fullnode.testnet.sui.io:443'

const { networkConfig } = createNetworkConfig({
  mainnet: { url: SUI_MAINNET_URL },
  testnet: { url: SUI_TESTNET_URL },
})

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1 minute
            retry: 2,
          },
        },
      })
  )

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
          <WalletProvider autoConnect>
            <ToastProvider>{children}</ToastProvider>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

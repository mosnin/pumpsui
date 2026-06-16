/**
 * Shared SuiClient singleton for server-side use (API routes, Server Components).
 *
 * Uses the mainnet RPC URL from constants.  In test environments set
 * SUI_RPC_URL in the environment to point at devnet/testnet.
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { SUI_RPC_URL } from './constants'

let _client: SuiClient | null = null

/**
 * Return a cached SuiClient instance.
 * Safe to call from multiple concurrent requests — the same instance is reused.
 */
export function getQuiClient(): SuiClient {
  if (!_client) {
    const rpcUrl = process.env.SUI_RPC_URL ?? SUI_RPC_URL
    _client = new SuiClient({ url: rpcUrl })
  }
  return _client
}

/**
 * Create a fresh SuiClient pointed at a specific network.
 * Useful in tests or when you need to override the global singleton.
 */
export function createSuiClient(network: 'mainnet' | 'testnet' | 'devnet' | 'localnet'): SuiClient {
  return new SuiClient({ url: getFullnodeUrl(network) })
}

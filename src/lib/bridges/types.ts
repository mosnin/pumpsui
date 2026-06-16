/**
 * Core types for the OmniWeave bridge integration.
 * Models bridge providers, quotes, and transaction state across all supported bridges.
 *
 * Supported bridges (researched May 2026):
 *  - Wormhole   : ETH, BSC, Arbitrum, Optimism, Base, Polygon, Avalanche, Solana → Sui
 *  - LayerZero  : ETH, BSC, Arbitrum, Optimism, Base, Polygon, Avalanche → Sui (live Oct 2025)
 *  - Axelar     : ETH, BSC, Arbitrum, Optimism, Base, Polygon, Avalanche → Sui (live May 2025)
 *  - Celer cBridge: ETH, BSC, Arbitrum, Optimism, Polygon, Avalanche → Sui (live Jun 2023)
 *  - Mayan Finance: Solana ↔ Sui and EVM → Sui via Wormhole CCTP
 *  - AllBridge  : ETH, BSC, Solana, Polygon, Avalanche → Sui (CCTP USDC focus)
 */

// ─── Chain IDs ────────────────────────────────────────────────────────────────

/** EVM chain IDs + special non-EVM chain IDs used throughout the bridge system */
export const CHAIN_IDS = {
  ETHEREUM: 1,
  BNB_CHAIN: 56,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  AVALANCHE: 43114,
  BASE: 8453,
  SOLANA: 101,    // non-standard; Wormhole uses 1 for Solana but we use 101 for EVM-compat
  SUI: 784,       // Sui's official chain ID
} as const

export type ChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS]

// ─── Chain metadata ───────────────────────────────────────────────────────────

export interface Chain {
  id: number
  name: string
  shortName: string
  symbol: string        // native gas token symbol
  logoUrl: string       // chain icon URL (use well-known CDN paths)
  rpcUrl: string
  explorerUrl: string
  color: string         // brand color for UI
  isEvm: boolean
}

export const SUPPORTED_CHAINS: Chain[] = [
  {
    id: CHAIN_IDS.ETHEREUM,
    name: 'Ethereum',
    shortName: 'ETH',
    symbol: 'ETH',
    logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    color: '#627EEA',
    isEvm: true,
  },
  {
    id: CHAIN_IDS.BNB_CHAIN,
    name: 'BNB Chain',
    shortName: 'BSC',
    symbol: 'BNB',
    logoUrl: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    color: '#F3BA2F',
    isEvm: true,
  },
  {
    id: CHAIN_IDS.ARBITRUM,
    name: 'Arbitrum',
    shortName: 'ARB',
    symbol: 'ETH',
    logoUrl: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    color: '#28A0F0',
    isEvm: true,
  },
  {
    id: CHAIN_IDS.OPTIMISM,
    name: 'Optimism',
    shortName: 'OP',
    symbol: 'ETH',
    logoUrl: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    color: '#FF0420',
    isEvm: true,
  },
  {
    id: CHAIN_IDS.BASE,
    name: 'Base',
    shortName: 'BASE',
    symbol: 'ETH',
    logoUrl: 'https://assets.coingecko.com/asset_platforms/images/131/small/base-network-logo.png',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    color: '#0052FF',
    isEvm: true,
  },
  {
    id: CHAIN_IDS.POLYGON,
    name: 'Polygon',
    shortName: 'MATIC',
    symbol: 'POL',
    logoUrl: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    color: '#8247E5',
    isEvm: true,
  },
  {
    id: CHAIN_IDS.AVALANCHE,
    name: 'Avalanche',
    shortName: 'AVAX',
    symbol: 'AVAX',
    logoUrl: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    color: '#E84142',
    isEvm: true,
  },
  {
    id: CHAIN_IDS.SOLANA,
    name: 'Solana',
    shortName: 'SOL',
    symbol: 'SOL',
    logoUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    color: '#9945FF',
    isEvm: false,
  },
  {
    id: CHAIN_IDS.SUI,
    name: 'Sui',
    shortName: 'SUI',
    symbol: 'SUI',
    logoUrl: 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg',
    rpcUrl: 'https://fullnode.mainnet.sui.io',
    explorerUrl: 'https://suiscan.xyz',
    color: '#6FBCF0',
    isEvm: false,
  },
]

// ─── Bridge provider interface ────────────────────────────────────────────────

export interface BridgeQuoteParams {
  fromChainId: number
  toChainId: number
  fromToken: string      // token address / type on source chain
  toToken: string        // token address / type on dest chain
  amount: bigint         // amount in source token base units
  recipient: string      // destination wallet address
}

export interface BridgeQuote {
  bridgeId: string
  bridgeName: string
  bridgeLogo: string
  bridgeColor: string
  fromAmount: bigint
  toAmount: bigint
  fee: bigint            // fee in fromToken base units
  feeUSD: number
  gasCostUSD: number     // estimated gas on source chain
  totalCostUSD: number   // fee + gas
  estimatedTime: number  // seconds
  priceImpact: number
  route: string[]        // human-readable chain/protocol hops
  url: string            // deep-link to initiate on bridge UI
  isLoading?: boolean
  error?: string
}

export interface BridgeProvider {
  id: string
  name: string
  logo: string
  color: string
  supportedFromChains: number[]   // chain IDs this bridge can send FROM
  supportedToChains: number[]     // chain IDs this bridge can send TO
  website: string
  getQuote(params: BridgeQuoteParams): Promise<BridgeQuote>
  buildTransaction?(quote: BridgeQuote): Promise<unknown>
}

// ─── Transaction state ────────────────────────────────────────────────────────

export type BridgeTxStatus =
  | 'idle'
  | 'approving'       // ERC-20 approve tx pending
  | 'sending'         // source-chain bridge tx pending
  | 'inflight'        // waiting for cross-chain attestation / VAA
  | 'redeeming'       // claiming on destination chain
  | 'complete'
  | 'failed'

export interface BridgeTx {
  quote: BridgeQuote
  status: BridgeTxStatus
  sourceTxHash?: string
  destTxHash?: string
  startedAt: number
  completedAt?: number
  errorMessage?: string
}

// ─── Token on a specific chain ────────────────────────────────────────────────

export interface BridgeToken {
  chainId: number
  address: string       // EVM address or Sui type string
  symbol: string
  name: string
  decimals: number
  logoUrl: string
  coingeckoId?: string
}

/** Common bridgeable tokens across chains */
export const BRIDGE_TOKENS: BridgeToken[] = [
  // USDC
  { chainId: 1,     address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', coingeckoId: 'usd-coin' },
  { chainId: 56,    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', coingeckoId: 'usd-coin' },
  { chainId: 42161, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USD Coin', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', coingeckoId: 'usd-coin' },
  { chainId: 10,    address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', name: 'USD Coin', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', coingeckoId: 'usd-coin' },
  { chainId: 8453,  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', coingeckoId: 'usd-coin' },
  { chainId: 137,   address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', name: 'USD Coin', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', coingeckoId: 'usd-coin' },
  { chainId: 43114, address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol: 'USDC', name: 'USD Coin', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', coingeckoId: 'usd-coin' },
  { chainId: 101,   address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', coingeckoId: 'usd-coin' },
  { chainId: 784,   address: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC', symbol: 'USDC', name: 'USD Coin', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png', coingeckoId: 'usd-coin' },
  // USDT
  { chainId: 1,     address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', coingeckoId: 'tether' },
  { chainId: 56,    address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether USD', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', coingeckoId: 'tether' },
  { chainId: 42161, address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether USD', decimals: 6, logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png', coingeckoId: 'tether' },
  // ETH (native or wrapped)
  { chainId: 1,     address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', name: 'Ether', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', coingeckoId: 'ethereum' },
  { chainId: 42161, address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', name: 'Ether', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', coingeckoId: 'ethereum' },
  { chainId: 10,    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', name: 'Ether', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', coingeckoId: 'ethereum' },
  { chainId: 8453,  address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', name: 'Ether', decimals: 18, logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', coingeckoId: 'ethereum' },
  // WBTC
  { chainId: 1,     address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, logoUrl: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png', coingeckoId: 'wrapped-bitcoin' },
  // SUI native
  { chainId: 784,   address: '0x2::sui::SUI', symbol: 'SUI', name: 'Sui', decimals: 9, logoUrl: 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg', coingeckoId: 'sui' },
  // SOL
  { chainId: 101,   address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', decimals: 9, logoUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', coingeckoId: 'solana' },
]

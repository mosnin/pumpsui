// OmniWeave protocol constants

export const OMNIWEAVE_FEE_BPS = 5 // 0.05%

export const SUI_RPC_URL = 'https://fullnode.mainnet.sui.io'
export const SUI_DEVNET_RPC_URL = 'https://fullnode.devnet.sui.io'
export const SUI_TESTNET_RPC_URL = 'https://fullnode.testnet.sui.io'

// DEX Package IDs on Sui Mainnet
export const CETUS_PACKAGE_ID =
  '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb'
export const CETUS_GLOBAL_CONFIG_ID =
  '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f'

export const TURBOS_PACKAGE_ID =
  '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1'

export const DEEPBOOK_PACKAGE_ID =
  '0x000000000000000000000000000000000000000000000000000000000000dee9'

export const AFTERMATH_PACKAGE_ID =
  '0xfee7c5b21b4f5fd49aa28dd8ddfa8a4c14a3bb6ff52c0a9fa3297cb0f19b36e'

// Slippage presets in basis points
export const SLIPPAGE_PRESETS = [10, 50, 100] as const // 0.1%, 0.5%, 1%
export const DEFAULT_SLIPPAGE_BPS = 50 // 0.5%

// Transaction deadline in minutes
export const DEFAULT_DEADLINE_MINUTES = 20

// Quote debounce delay
export const QUOTE_DEBOUNCE_MS = 400

// Price impact thresholds
export const PRICE_IMPACT_WARNING_THRESHOLD = 1 // 1%
export const PRICE_IMPACT_DANGER_THRESHOLD = 5 // 5%

// CoinGecko API
export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
export const PRICE_CACHE_TTL_MS = 30_000 // 30 seconds

// DEX metadata for display
export interface DexMeta {
  id: string
  name: string
  color: string
  bgColor: string
}

export const DEX_META: Record<string, DexMeta> = {
  cetus: {
    id: 'cetus',
    name: 'Cetus',
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.15)',
  },
  turbos: {
    id: 'turbos',
    name: 'Turbos',
    color: '#3B82F6',
    bgColor: 'rgba(59,130,246,0.15)',
  },
  deepbook: {
    id: 'deepbook',
    name: 'DeepBook',
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.15)',
  },
  aftermath: {
    id: 'aftermath',
    name: 'Aftermath',
    color: '#A855F7',
    bgColor: 'rgba(168,85,247,0.15)',
  },
  kriya: {
    id: 'kriya',
    name: 'KriyaDEX',
    color: '#EC4899',
    bgColor: 'rgba(236,72,153,0.15)',
  },
  flowx: {
    id: 'flowx',
    name: 'FlowX',
    color: '#06B6D4',
    bgColor: 'rgba(6,182,212,0.15)',
  },
}

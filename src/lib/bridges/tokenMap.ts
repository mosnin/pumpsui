/**
 * Cross-chain token address map for bridge routing.
 *
 * Maps canonical token symbols to their on-chain addresses on each supported chain.
 * Useful for bridging (e.g. USDC on Ethereum → Wormhole-wrapped USDC on Sui).
 *
 * Notes:
 *   - EVM addresses are in checksum form (lowercase for comparisons)
 *   - Sui addresses are full Move type strings (package::module::struct)
 *   - Native gas tokens use the "dead" sentinel address 0xEee...EEE on EVM
 *   - Solana uses base58 pubkeys
 */

// ─── Per-chain token address tables ──────────────────────────────────────────

export const BRIDGE_TOKEN_MAP = {
  ethereum: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    ETH:  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',   // native
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    DAI:  '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  },

  bsc: {
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    BNB:  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',   // native
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    WBTC: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',    // BTCB on BSC
    ETH:  '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',    // ETH on BSC
  },

  arbitrum: {
    USDC:  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',   // native USDC
    USDCe: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',   // bridged USDC.e
    USDT:  '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    ETH:   '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',   // native
    WETH:  '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    WBTC:  '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
  },

  optimism: {
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',    // native USDC
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    ETH:  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',   // native
    WETH: '0x4200000000000000000000000000000000000006',
    WBTC: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
  },

  base: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',    // native USDC on Base
    ETH:  '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',   // native
    WETH: '0x4200000000000000000000000000000000000006',
    cbBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',   // Coinbase BTC on Base
  },

  polygon: {
    USDC:  '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',   // native USDC
    USDCe: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',   // bridged USDC.e
    USDT:  '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    POL:   '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',   // native gas token
    WMATIC:'0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    WBTC:  '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    WETH:  '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  },

  avalanche: {
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',    // native USDC on Avalanche
    USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    AVAX: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',   // native
    WAVAX:'0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    WBTC: '0x50b7545627a5162F82A992c33b87aDc75187B218',
    WETH: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
  },

  solana: {
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    SOL:  'So11111111111111111111111111111111111111112',    // wrapped SOL
    WBTC: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
    WETH: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
  },

  sui: {
    // Native SUI
    SUI:  '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',

    // USDC — Circle native USDC on Sui (launched 2024)
    USDC: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',

    // Wormhole-wrapped USDC (legacy — pre-Circle native)
    USDCw:'0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',

    // Wormhole-wrapped USDT
    USDT: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',

    // Wormhole-wrapped ETH
    WETH: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',

    // Wormhole-wrapped WBTC
    WBTC: '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',

    // Wormhole-wrapped SOL
    SOL:  '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN',
  },
} as const

// ─── Types ────────────────────────────────────────────────────────────────────

export type SupportedChain = keyof typeof BRIDGE_TOKEN_MAP
export type TokenSymbol<C extends SupportedChain> = keyof (typeof BRIDGE_TOKEN_MAP)[C]

// ─── Helper functions ─────────────────────────────────────────────────────────

/**
 * Look up a token address on a given chain by its symbol.
 * Returns undefined if the chain or symbol is not in the map.
 *
 * @example
 *   getTokenAddress('ethereum', 'USDC')
 *   // => '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
 */
export function getTokenAddress(
  chain: string,
  symbol: string
): string | undefined {
  const chainMap = BRIDGE_TOKEN_MAP[chain as SupportedChain]
  if (!chainMap) return undefined
  return (chainMap as Record<string, string>)[symbol]
}

/**
 * Reverse-look up the token symbol for a given on-chain address.
 * Case-insensitive for EVM addresses.
 */
export function getTokenSymbol(
  chain: string,
  address: string
): string | undefined {
  const chainMap = BRIDGE_TOKEN_MAP[chain as SupportedChain]
  if (!chainMap) return undefined
  const lower = address.toLowerCase()
  for (const [symbol, addr] of Object.entries(chainMap as Record<string, string>)) {
    if (addr.toLowerCase() === lower) return symbol
  }
  return undefined
}

/**
 * Get all tokens available for bridging on a chain as [symbol, address] pairs.
 */
export function getChainTokens(chain: string): Array<{ symbol: string; address: string }> {
  const chainMap = BRIDGE_TOKEN_MAP[chain as SupportedChain]
  if (!chainMap) return []
  return Object.entries(chainMap as Record<string, string>).map(([symbol, address]) => ({
    symbol,
    address,
  }))
}

/**
 * Find a common symbol bridgeable between two chains.
 * Returns symbols that exist on both chains.
 *
 * @example
 *   getCommonBridgeTokens('ethereum', 'sui')
 *   // => ['USDC', 'USDT', 'WETH', 'WBTC']
 */
export function getCommonBridgeTokens(fromChain: string, toChain: string): string[] {
  const fromMap = BRIDGE_TOKEN_MAP[fromChain as SupportedChain]
  const toMap   = BRIDGE_TOKEN_MAP[toChain   as SupportedChain]
  if (!fromMap || !toMap) return []

  const fromSymbols = new Set(Object.keys(fromMap))
  return Object.keys(toMap).filter((s) => fromSymbols.has(s))
}

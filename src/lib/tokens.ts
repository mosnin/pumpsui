export interface Token {
  symbol: string
  name: string
  decimals: number
  address: string
  logoURI: string
  coingeckoId?: string
  tags?: string[]
}

export const SUI_TOKENS: Token[] = [
  {
    symbol: 'SUI',
    name: 'Sui',
    decimals: 9,
    address: '0x2::sui::SUI',
    logoURI: 'https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg',
    coingeckoId: 'sui',
    tags: ['popular'],
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address:
      '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    coingeckoId: 'usd-coin',
    tags: ['popular', 'stablecoin'],
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address:
      '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    coingeckoId: 'tether',
    tags: ['popular', 'stablecoin'],
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 8,
    address:
      '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
    logoURI: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
    coingeckoId: 'weth',
    tags: ['popular'],
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    address:
      '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',
    logoURI: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
    coingeckoId: 'wrapped-bitcoin',
    tags: ['popular'],
  },
  {
    symbol: 'CETUS',
    name: 'Cetus Protocol',
    decimals: 9,
    address:
      '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    logoURI: 'https://assets.coingecko.com/coins/images/29070/small/cetus.png',
    coingeckoId: 'cetus-protocol',
    tags: [],
  },
  {
    symbol: 'TURBOS',
    name: 'Turbos Finance',
    decimals: 9,
    address:
      '0x5d1f47ea69bb0de31c313d7acf89b890dbb8991ea8e03c6c355171f84bb1ba4a::turbos::TURBOS',
    logoURI: 'https://assets.coingecko.com/coins/images/29292/small/turbos.jpeg',
    coingeckoId: 'turbos-finance',
    tags: [],
  },
  {
    symbol: 'DEEP',
    name: 'DeepBook',
    decimals: 6,
    address:
      '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP',
    logoURI: 'https://assets.coingecko.com/coins/images/35733/small/DEEP_token_logo.png',
    coingeckoId: 'deepbook',
    tags: [],
  },
  {
    symbol: 'AFT',
    name: 'Aftermath Finance',
    decimals: 9,
    address:
      '0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc::afsui::AFSUI',
    logoURI: 'https://assets.coingecko.com/coins/images/33347/small/aftermath.png',
    coingeckoId: 'aftermath-islands',
    tags: [],
  },
  {
    symbol: 'NAVX',
    name: 'NAVI Protocol',
    decimals: 9,
    address:
      '0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044ef5cab4::navx::NAVX',
    logoURI: 'https://assets.coingecko.com/coins/images/33756/small/navx.png',
    coingeckoId: 'navi-protocol',
    tags: [],
  },
]

export const POPULAR_TOKENS = SUI_TOKENS.filter((t) => t.tags?.includes('popular'))

export function findToken(addressOrSymbol: string): Token | undefined {
  const lower = addressOrSymbol.toLowerCase()
  return SUI_TOKENS.find(
    (t) => t.address.toLowerCase() === lower || t.symbol.toLowerCase() === lower,
  )
}

export function formatTokenAmount(amount: string | number, decimals: number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0'
  const divisor = Math.pow(10, decimals)
  return (num / divisor).toFixed(6)
}

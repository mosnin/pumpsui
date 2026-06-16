// On-ramp provider configs and URL builders

export const ONRAMP_PROVIDERS = [
  {
    id: 'moonpay',
    name: 'MoonPay',
    logo: '/providers/moonpay.svg',  // we'll use text fallback
    fee: '1.0–4.5%',
    minAmount: 30,
    maxAmount: 10000,
    paymentMethods: ['card', 'bank', 'apple_pay', 'google_pay'],
    estimatedTime: '5–30 min',
    supportedCountries: 160,
    color: '#7B40F2',
  },
  {
    id: 'transak',
    name: 'Transak',
    logo: '/providers/transak.svg',
    fee: '0.99–2.5%',
    minAmount: 10,
    maxAmount: 15000,
    paymentMethods: ['card', 'bank', 'apple_pay'],
    estimatedTime: '5–20 min',
    supportedCountries: 130,
    color: '#1A73E8',
  },
  {
    id: 'coinbase_pay',
    name: 'Coinbase Pay',
    logo: '/providers/coinbase.svg',
    fee: '1.49–3.99%',
    minAmount: 10,
    maxAmount: 25000,
    paymentMethods: ['card', 'bank', 'coinbase_balance'],
    estimatedTime: '1–5 min',
    supportedCountries: 90,
    color: '#0052FF',
  },
] as const

export type ProviderId = typeof ONRAMP_PROVIDERS[number]['id']

export interface OnRampQuote {
  providerId: ProviderId
  providerName: string
  fiatAmount: number
  fiatCurrency: string
  cryptoAmount: number
  cryptoCurrency: string
  fee: number
  feePercent: number
  estimatedTime: string
  checkoutUrl: string
}

// Build MoonPay checkout URL
export function buildMoonPayUrl(params: {
  walletAddress: string
  currencyCode: string  // e.g. 'sui'
  baseCurrencyAmount: number
  baseCurrencyCode: string  // e.g. 'usd'
  colorCode?: string
}): string {
  const base = 'https://buy.moonpay.com'
  const apiKey = process.env.NEXT_PUBLIC_MOONPAY_API_KEY ?? 'pk_test_demo'
  const q = new URLSearchParams({
    apiKey,
    currencyCode: params.currencyCode,
    walletAddress: params.walletAddress,
    baseCurrencyAmount: String(params.baseCurrencyAmount),
    baseCurrencyCode: params.baseCurrencyCode,
    colorCode: params.colorCode ?? '%236366F1',
    showAllCurrencies: 'false',
  })
  return `${base}?${q}`
}

// Build Transak checkout URL
export function buildTransakUrl(params: {
  walletAddress: string
  cryptoCurrencyCode: string  // e.g. 'SUI'
  fiatAmount: number
  fiatCurrency: string
  network: string  // 'sui'
}): string {
  const base = 'https://global.transak.com'
  const apiKey = process.env.NEXT_PUBLIC_TRANSAK_API_KEY ?? 'demo-key'
  const q = new URLSearchParams({
    apiKey,
    cryptoCurrencyCode: params.cryptoCurrencyCode,
    walletAddress: params.walletAddress,
    fiatAmount: String(params.fiatAmount),
    fiatCurrency: params.fiatCurrency,
    network: params.network,
    themeColor: '6366F1',
    hideMenu: 'true',
  })
  return `${base}?${q}`
}

// Build Coinbase Pay URL
export function buildCoinbasePayUrl(params: {
  walletAddress: string
  asset: string  // e.g. 'SUI'
  amount: number
}): string {
  const appId = process.env.NEXT_PUBLIC_COINBASE_PAY_APP_ID ?? 'demo'
  const base = 'https://pay.coinbase.com/buy/select-asset'
  const q = new URLSearchParams({
    appId,
    destinationWallets: JSON.stringify([{ address: params.walletAddress, assets: [params.asset] }]),
    presetFiatAmount: String(params.amount),
  })
  return `${base}?${q}`
}

// Estimate how much crypto you get for a fiat amount (static fee model)
export function estimateOnRamp(
  providerId: ProviderId,
  fiatAmount: number,
  cryptoPriceUsd: number,
): OnRampQuote {
  const provider = ONRAMP_PROVIDERS.find(p => p.id === providerId)!
  // Use midpoint of fee range for estimate
  const feePercent = providerId === 'moonpay' ? 2.75
    : providerId === 'transak' ? 1.75
    : 2.74
  const fee = fiatAmount * feePercent / 100
  const netFiat = fiatAmount - fee
  const cryptoAmount = netFiat / cryptoPriceUsd

  return {
    providerId,
    providerName: provider.name,
    fiatAmount,
    fiatCurrency: 'USD',
    cryptoAmount,
    cryptoCurrency: 'SUI',
    fee,
    feePercent,
    estimatedTime: provider.estimatedTime,
    checkoutUrl: '',  // filled in at checkout time
  }
}

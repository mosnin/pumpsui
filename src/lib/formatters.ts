// Formatting utilities for token amounts, USD values, percentages, and addresses.
// All functions are pure and safe to call in both server and client contexts.

// ─── Token amounts ────────────────────────────────────────────────────────────

/**
 * Format a raw on-chain token amount (bigint) into a human-readable string.
 *
 * @param amount          - Raw amount in the token's smallest unit (e.g. MIST for SUI)
 * @param decimals        - Number of decimal places the token uses (e.g. 9 for SUI)
 * @param displayDecimals - Maximum fractional digits to show (default 6)
 *
 * @example
 * formatTokenAmount(1_000_000_000n, 9)       // "1.000000"
 * formatTokenAmount(1_500_000n, 6, 2)         // "1.50"
 * formatTokenAmount(0n, 9)                    // "0.000000"
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  displayDecimals = 6,
): string {
  if (decimals < 0) throw new RangeError('decimals must be >= 0')
  if (displayDecimals < 0) throw new RangeError('displayDecimals must be >= 0')

  const clamped = Math.min(displayDecimals, decimals)

  // Use integer arithmetic to avoid floating-point precision issues.
  const divisor = BigInt(10 ** decimals)
  const whole = amount / divisor
  const remainder = amount % divisor

  if (clamped === 0) return whole.toString()

  // Zero-pad the fractional part to `decimals` digits, then trim/pad to `clamped`
  const fracFull = remainder.toString().padStart(decimals, '0')
  const fracTrimmed = fracFull.slice(0, clamped).padEnd(clamped, '0')

  return `${whole}.${fracTrimmed}`
}

// ─── USD values ───────────────────────────────────────────────────────────────

const USD_FORMATTER_2 = new Intl.NumberFormat('en-US', {
  style:                 'currency',
  currency:              'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const USD_FORMATTER_6 = new Intl.NumberFormat('en-US', {
  style:                 'currency',
  currency:              'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
})

/**
 * Format a USD amount with compact notation for large values and
 * higher precision for sub-cent values.
 *
 * @example
 * formatUSD(1234567.89)   // "$1.23M"
 * formatUSD(12345.6)      // "$12,345.60"
 * formatUSD(0.000042)     // "$0.000042"
 * formatUSD(0)            // "$0.00"
 */
export function formatUSD(amount: number): string {
  if (!Number.isFinite(amount)) return '$0.00'

  const abs = Math.abs(amount)

  if (abs >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(2)}B`
  }
  if (abs >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`
  }
  if (abs >= 1_000) {
    return `$${(amount / 1_000).toFixed(2)}K`
  }
  // For values smaller than $0.01, show up to 6 significant figures
  if (abs > 0 && abs < 0.01) {
    return USD_FORMATTER_6.format(amount)
  }
  return USD_FORMATTER_2.format(amount)
}

// ─── Percentages ──────────────────────────────────────────────────────────────

/**
 * Format a percentage value.
 *
 * @param value    - Value as a percentage (e.g. 4.2 means 4.2%)
 * @param showSign - Whether to prefix positive values with "+" (default false)
 *
 * @example
 * formatPercent(4.2)            // "4.20%"
 * formatPercent(-1.5, true)     // "-1.50%"
 * formatPercent(0.5, true)      // "+0.50%"
 */
export function formatPercent(value: number, showSign = false): string {
  if (!Number.isFinite(value)) return '0.00%'
  const formatted = Math.abs(value).toFixed(2)
  if (value < 0) return `-${formatted}%`
  if (showSign && value > 0) return `+${formatted}%`
  return `${formatted}%`
}

// ─── Addresses ────────────────────────────────────────────────────────────────

/**
 * Shorten a Sui address or object ID for display purposes.
 *
 * Preserves the "0x" prefix, keeps the first 6 characters of the hex,
 * and the last 4 characters — e.g. "0xabcd…ef12".
 *
 * @param address - Full hex address, with or without 0x prefix
 *
 * @example
 * formatAddress('0x1234567890abcdef')   // "0x1234…cdef"
 * formatAddress('0x2::sui::SUI')        // returns as-is (not a raw hex address)
 */
export function formatAddress(address: string): string {
  if (!address) return ''
  // Pass through Move type strings (they contain "::")
  if (address.includes('::')) return address

  const hex = address.startsWith('0x') ? address : `0x${address}`
  if (hex.length <= 12) return hex

  return `${hex.slice(0, 6)}…${hex.slice(-4)}`
}

// ─── Amount parsing ───────────────────────────────────────────────────────────

/**
 * Parse a human-readable token amount string into its raw on-chain bigint
 * representation.
 *
 * Handles:
 * - Standard decimal notation: "1.5", "0.001"
 * - No decimal: "100"
 * - More fractional digits than `decimals` (truncates, does not round)
 * - Empty / invalid strings (returns 0n)
 *
 * @param amount   - Human-readable amount string (e.g. "1.5")
 * @param decimals - Token decimal places (e.g. 9 for SUI, 6 for USDC)
 *
 * @example
 * parseAmount('1.5', 9)       // 1_500_000_000n
 * parseAmount('0.001', 6)     // 1_000n
 * parseAmount('1.123456789', 6)  // 1_123_456n (truncated)
 * parseAmount('', 9)          // 0n
 */
export function parseAmount(amount: string, decimals: number): bigint {
  if (!amount || amount.trim() === '') return 0n
  if (decimals < 0) throw new RangeError('decimals must be >= 0')

  const trimmed = amount.trim()
  const [wholePart, fracPart = ''] = trimmed.split('.')

  // Pad or truncate the fractional part to exactly `decimals` digits
  const fracNormalised = fracPart.slice(0, decimals).padEnd(decimals, '0')

  const wholeNum = BigInt(wholePart || '0')
  const fracNum  = BigInt(fracNormalised)
  const multiplier = BigInt(10 ** decimals)

  return wholeNum * multiplier + fracNum
}

// ─── Number utilities ─────────────────────────────────────────────────────────

/**
 * Determine how many decimal digits are meaningful to display for a given
 * price or amount, capping between minDecimals and maxDecimals.
 *
 * Useful for adapting display precision across tokens with wildly different
 * unit prices (e.g. BTC at $60,000 vs SHIB at $0.000008).
 *
 * @example
 * adaptiveDecimals(60000)      // 2   → "$60,000.00"
 * adaptiveDecimals(3.24)       // 4   → "3.2400"
 * adaptiveDecimals(0.000008)   // 8   → "0.00000800"
 */
export function adaptiveDecimals(
  value: number,
  minDecimals = 2,
  maxDecimals = 8,
): number {
  if (!Number.isFinite(value) || value === 0) return minDecimals
  const abs = Math.abs(value)
  if (abs >= 1) return minDecimals
  // Find first significant digit after decimal point
  const magnitude = Math.ceil(-Math.log10(abs))
  return Math.min(maxDecimals, Math.max(minDecimals, magnitude + 2))
}

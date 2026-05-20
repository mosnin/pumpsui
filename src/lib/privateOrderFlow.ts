export interface PrivateOrderRequest {
  tokenIn: string
  tokenOut: string
  amountIn: bigint
  minAmountOut: bigint
  deadline: number  // Unix timestamp
  userAddress: string
}

export interface PrivateOrderQuote {
  solver: string
  solverName: string
  outputAmount: bigint
  improvement: number   // bps better than public route
  gasEstimate: bigint
  validUntil: number
}

// Request quotes from private solvers
// In production: broadcast to solver network, collect best bid within 2 seconds
export async function getPrivateOrderQuotes(
  order: PrivateOrderRequest
): Promise<PrivateOrderQuote[]> {
  // Demo: simulate 2-3 solver bids
  await new Promise<void>(r => setTimeout(r, 800))  // simulate network latency

  const baseOutput = order.minAmountOut
  return [
    {
      solver: '0xsolver1...',
      solverName: 'Titan Solver',
      outputAmount: baseOutput * 10_025n / 10_000n,  // 0.25% better
      improvement: 25,
      gasEstimate: 5_000_000n,
      validUntil: Date.now() + 30_000,
    },
    {
      solver: '0xsolver2...',
      solverName: 'Flash Solver',
      outputAmount: baseOutput * 10_018n / 10_000n,  // 0.18% better
      improvement: 18,
      gasEstimate: 4_500_000n,
      validUntil: Date.now() + 30_000,
    },
  ]
}

// Threshold above which private order flow is recommended (USD)
export const PRIVATE_ORDER_THRESHOLD_USD = 5_000

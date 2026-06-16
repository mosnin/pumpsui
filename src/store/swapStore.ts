import { create } from 'zustand'
import type { Token } from '@/lib/tokens'

interface SwapStore {
  tokenIn: Token | null
  tokenOut: Token | null
  amountIn: string
  amountOut: string
  slippageBps: number
  deadline: number // minutes
  mevProtection: boolean
  setTokenIn: (token: Token | null) => void
  setTokenOut: (token: Token | null) => void
  setAmountIn: (amount: string) => void
  setAmountOut: (amount: string) => void
  setSlippageBps: (bps: number) => void
  setDeadline: (minutes: number) => void
  setMevProtection: (enabled: boolean) => void
  flipTokens: () => void
  reset: () => void
}

const DEFAULT_STATE = {
  tokenIn: null,
  tokenOut: null,
  amountIn: '',
  amountOut: '',
  slippageBps: 50, // 0.5 %
  deadline: 20,   // 20 minutes
  mevProtection: false,
} as const

export const useSwapStore = create<SwapStore>((set) => ({
  ...DEFAULT_STATE,

  setTokenIn: (token) => set({ tokenIn: token }),
  setTokenOut: (token) => set({ tokenOut: token }),
  setAmountIn: (amount) => set({ amountIn: amount }),
  setAmountOut: (amount) => set({ amountOut: amount }),
  setSlippageBps: (bps) => set({ slippageBps: bps }),
  setDeadline: (minutes) => set({ deadline: minutes }),
  setMevProtection: (enabled) => set({ mevProtection: enabled }),

  flipTokens: () =>
    set((state) => ({
      tokenIn: state.tokenOut,
      tokenOut: state.tokenIn,
      amountIn: state.amountOut,
      amountOut: state.amountIn,
    })),

  reset: () => set({ ...DEFAULT_STATE }),
}))

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CopyTradingConfig } from '@/lib/social'

// ─── Store Shape ──────────────────────────────────────────────────────────────

interface SocialStore {
  followedTraders: string[]
  copyConfigs: Record<string, CopyTradingConfig>

  followTrader: (address: string) => void
  unfollowTrader: (address: string) => void
  setCopyConfig: (address: string, config: Partial<CopyTradingConfig>) => void
  toggleCopyTrading: (address: string) => void
  isFollowing: (address: string) => boolean
  isCopying: (address: string) => boolean
}

// ─── Default config factory ───────────────────────────────────────────────────

function defaultCopyConfig(address: string): CopyTradingConfig {
  return {
    followedAddress: address,
    maxTradeSize: 100,
    maxDailyVolume: 500,
    copyRatio: 0.1,
    enabled: false,
    slippageBps: 100,
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSocialStore = create<SocialStore>()(
  persist(
    (set, get) => ({
      followedTraders: [],
      copyConfigs: {},

      followTrader: (address) => {
        if (get().followedTraders.includes(address)) return
        set((s) => ({
          followedTraders: [...s.followedTraders, address],
          copyConfigs: {
            ...s.copyConfigs,
            [address]: s.copyConfigs[address] ?? defaultCopyConfig(address),
          },
        }))
      },

      unfollowTrader: (address) => {
        set((s) => {
          const updated = { ...s.copyConfigs }
          delete updated[address]
          return {
            followedTraders: s.followedTraders.filter((a) => a !== address),
            copyConfigs: updated,
          }
        })
      },

      setCopyConfig: (address, config) => {
        set((s) => ({
          copyConfigs: {
            ...s.copyConfigs,
            [address]: {
              ...(s.copyConfigs[address] ?? defaultCopyConfig(address)),
              ...config,
            },
          },
        }))
      },

      toggleCopyTrading: (address) => {
        set((s) => {
          const existing = s.copyConfigs[address] ?? defaultCopyConfig(address)
          return {
            copyConfigs: {
              ...s.copyConfigs,
              [address]: { ...existing, enabled: !existing.enabled },
            },
          }
        })
      },

      isFollowing: (address) => get().followedTraders.includes(address),

      isCopying: (address) => {
        const cfg = get().copyConfigs[address]
        return cfg?.enabled ?? false
      },
    }),
    {
      name: 'omniweave-social-v1',
      partialize: (s) => ({
        followedTraders: s.followedTraders,
        copyConfigs: s.copyConfigs,
      }),
    }
  )
)

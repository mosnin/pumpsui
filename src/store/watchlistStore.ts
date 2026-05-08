import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WatchlistStore {
  watchlist: string[] // coin type addresses
  addToWatchlist: (coinType: string) => void
  removeFromWatchlist: (coinType: string) => void
  toggleWatchlist: (coinType: string) => void
  isWatched: (coinType: string) => boolean
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      watchlist: [],

      addToWatchlist: (coinType) =>
        set((s) => ({
          watchlist: s.watchlist.includes(coinType)
            ? s.watchlist
            : [...s.watchlist, coinType],
        })),

      removeFromWatchlist: (coinType) =>
        set((s) => ({
          watchlist: s.watchlist.filter((t) => t !== coinType),
        })),

      toggleWatchlist: (coinType) => {
        const { isWatched, addToWatchlist, removeFromWatchlist } = get()
        if (isWatched(coinType)) {
          removeFromWatchlist(coinType)
        } else {
          addToWatchlist(coinType)
        }
      },

      isWatched: (coinType) => get().watchlist.includes(coinType),
    }),
    { name: 'omniweave-watchlist' },
  ),
)

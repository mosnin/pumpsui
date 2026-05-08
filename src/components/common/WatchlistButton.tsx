'use client'

import { useWatchlistStore } from '@/store/watchlistStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WatchlistButtonProps {
  coinType: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Star button that toggles a token in/out of the watchlist.
 * Filled gold star = watched, outline star = not watched.
 * Smooth CSS transition on toggle.
 */
export function WatchlistButton({
  coinType,
  size = 'md',
  className = '',
}: WatchlistButtonProps) {
  const { isWatched, toggleWatchlist } = useWatchlistStore()
  const watched = isWatched(coinType)

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 22 : 18
  const btnSize =
    size === 'sm'
      ? 'h-7 w-7'
      : size === 'lg'
      ? 'h-11 w-11'
      : 'h-9 w-9'

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        toggleWatchlist(coinType)
      }}
      aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
      aria-pressed={watched}
      title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
      className={[
        'inline-flex items-center justify-center rounded-lg transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50',
        'hover:scale-110 active:scale-95',
        watched
          ? 'text-yellow-400 hover:text-yellow-300'
          : 'text-slate-600 hover:text-slate-400',
        btnSize,
        className,
      ].join(' ')}
      style={{
        background: watched ? 'rgba(234,179,8,0.1)' : 'transparent',
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={watched ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={watched ? '0' : '2'}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition: 'fill 0.2s ease, stroke 0.2s ease',
          filter: watched ? 'drop-shadow(0 0 4px rgba(234,179,8,0.5))' : 'none',
        }}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  )
}

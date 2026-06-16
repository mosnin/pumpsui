'use client'

interface PriceHeaderProps {
  token: string
  vsToken?: string
  price: number
  change24h: number
  high24h: number
  low24h: number
  volume24h: number
}

export function PriceHeader({ token, vsToken = 'USDC', price, change24h, high24h, low24h, volume24h }: PriceHeaderProps) {
  const isPositive = change24h >= 0
  // Color based on token symbol hash for the circle
  const colors = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
  const colorIndex = token.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
  const tokenColor = colors[colorIndex]

  return (
    <div className="flex flex-wrap items-center gap-6 p-4 border-b border-slate-800">
      {/* Token identity */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: tokenColor }}
        >
          {token.slice(0, 2)}
        </div>
        <div>
          <div className="text-white font-semibold text-lg">{token}</div>
          <div className="text-slate-400 text-xs">{token}/{vsToken}</div>
        </div>
      </div>

      {/* Price */}
      <div>
        <div className="text-white font-bold text-2xl">
          ${price < 0.01 ? price.toFixed(6) : price < 1 ? price.toFixed(4) : price.toFixed(2)}
        </div>
        <div className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}% today
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-6 text-sm ml-auto flex-wrap">
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wide">24h High</div>
          <div className="text-white font-medium">
            ${high24h < 0.01 ? high24h.toFixed(6) : high24h < 1 ? high24h.toFixed(4) : high24h.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wide">24h Low</div>
          <div className="text-white font-medium">
            ${low24h < 0.01 ? low24h.toFixed(6) : low24h < 1 ? low24h.toFixed(4) : low24h.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wide">24h Volume</div>
          <div className="text-white font-medium">
            ${volume24h >= 1_000_000
              ? `${(volume24h / 1_000_000).toFixed(1)}M`
              : volume24h >= 1_000
              ? `${(volume24h / 1_000).toFixed(1)}K`
              : volume24h.toFixed(0)}
          </div>
        </div>
      </div>
    </div>
  )
}

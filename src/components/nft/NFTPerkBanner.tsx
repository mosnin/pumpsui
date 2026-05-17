'use client'

interface NFTPerkBannerProps {
  label: string
  feeDiscount: number
}

export function NFTPerkBanner({ label, feeDiscount }: NFTPerkBannerProps) {
  return (
    <div
      className="relative rounded-2xl p-px overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
      }}
      role="status"
      aria-label={`NFT perk active: ${feeDiscount}% fee discount`}
    >
      {/* Inner panel */}
      <div className="rounded-2xl bg-[#0D0D1F] px-5 py-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(6,182,212,0.15))' }}
            aria-hidden="true"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
                fill="url(#perk-star-grad)"
              />
              <defs>
                <linearGradient id="perk-star-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">
              <span
                className="mr-1"
                style={{
                  background: 'linear-gradient(135deg, #818CF8, #06B6D4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Perk Active:
              </span>
              {label}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Applied to all swaps automatically
            </p>
          </div>

          {/* Discount pill */}
          <div
            className="flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.2))',
              border: '1px solid rgba(99,102,241,0.4)',
              color: '#A5B4FC',
            }}
          >
            -{feeDiscount}% fees
          </div>
        </div>
      </div>
    </div>
  )
}

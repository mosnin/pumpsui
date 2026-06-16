'use client'

import { SwapStatus } from '@/hooks/useExecuteSwap'

const SUISCAN_TX_URL = 'https://suiscan.xyz/mainnet/tx'

interface TxStatusBadgeProps {
  status: Exclude<SwapStatus, 'idle' | 'signing'>
  txHash?: string | null
  className?: string
}

export function TxStatusBadge({ status, txHash, className }: TxStatusBadgeProps) {
  const config = {
    pending: {
      dot: '#F59E0B',
      dotBg: 'rgba(245,158,11,0.2)',
      text: 'Pending',
      textColor: '#FDE68A',
      border: 'rgba(245,158,11,0.25)',
      bg: 'rgba(245,158,11,0.08)',
      pulse: true,
    },
    success: {
      dot: '#10B981',
      dotBg: 'rgba(16,185,129,0.2)',
      text: 'Confirmed',
      textColor: '#6EE7B7',
      border: 'rgba(16,185,129,0.25)',
      bg: 'rgba(16,185,129,0.08)',
      pulse: false,
    },
    error: {
      dot: '#EF4444',
      dotBg: 'rgba(239,68,68,0.2)',
      text: 'Failed',
      textColor: '#FCA5A5',
      border: 'rgba(239,68,68,0.25)',
      bg: 'rgba(239,68,68,0.08)',
      pulse: false,
    },
  } as const

  const c = config[status]

  const badge = (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${className ?? ''}`}
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.textColor,
      }}
    >
      {/* Status dot */}
      <span
        className="relative flex h-2 w-2 flex-shrink-0"
        aria-hidden="true"
      >
        {c.pulse && (
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
            style={{ background: c.dot }}
          />
        )}
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ background: c.dot }}
        />
      </span>
      {c.text}
    </span>
  )

  if (txHash && (status === 'success' || status === 'pending')) {
    return (
      <a
        href={`${SUISCAN_TX_URL}/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
        title="View on Suiscan"
      >
        {badge}
        {/* External link icon */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    )
  }

  return badge
}

'use client'

import { useState } from 'react'
import { Copy, Check, Twitter, Send } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReferralCardProps {
  referralLink: string
}

// ─── QR Code (simple SVG-based visual placeholder) ───────────────────────────

function QRCodeDisplay({ value }: { value: string }) {
  // Generate a deterministic pseudo-QR grid from the URL string for visual appeal.
  // In production this would use a real QR library.
  const hash = value.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
  const size = 9
  const cells: boolean[] = []
  for (let i = 0; i < size * size; i++) {
    // Corner finder patterns (top-left, top-right, bottom-left)
    const row = Math.floor(i / size)
    const col = i % size
    const inTopLeft = row < 3 && col < 3
    const inTopRight = row < 3 && col >= size - 3
    const inBottomLeft = row >= size - 3 && col < 3
    if (inTopLeft || inTopRight || inBottomLeft) {
      cells.push(true)
    } else {
      cells.push(((hash >> (i % 32)) & 1) === 1)
    }
  }

  const cellPx = 24

  return (
    <div
      className="rounded-xl p-3 inline-block"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)' }}
    >
      <svg
        width={size * cellPx}
        height={size * cellPx}
        viewBox={`0 0 ${size * cellPx} ${size * cellPx}`}
        aria-label={`QR code for ${value}`}
      >
        {cells.map((filled, i) => {
          const row = Math.floor(i / size)
          const col = i % size
          return filled ? (
            <rect
              key={i}
              x={col * cellPx + 2}
              y={row * cellPx + 2}
              width={cellPx - 4}
              height={cellPx - 4}
              rx={2}
              fill="url(#qr-grad)"
            />
          ) : null
        })}
        <defs>
          <linearGradient id="qr-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
      <p className="text-center text-[10px] text-slate-500 mt-1 font-mono">Scan to join</p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReferralCard({ referralLink }: ReferralCardProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement('textarea')
      el.value = referralLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Trade on OmniWeave — the best DEX aggregator on Sui! Get the best prices across Cetus, Turbos, DeepBook and more.\n\n${referralLink}`,
  )}`

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(
    'Trade on OmniWeave — the best DEX aggregator on Sui!',
  )}`

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(13, 13, 31, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
      }}
    >
      {/* Header gradient bar */}
      <div
        className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, #6366F1, #06B6D4)' }}
      />

      <div className="p-6">
        <h3 className="text-base font-semibold mb-1" style={{ color: '#E2E8F0' }}>
          Your Referral Link
        </h3>
        <p className="text-sm text-slate-400 mb-5">
          Share this link to earn 20% of protocol fees from every referred swap.
        </p>

        {/* Link display + copy */}
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4"
          style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <span
            className="flex-1 text-sm font-mono truncate"
            style={{ color: '#A5B4FC' }}
          >
            {referralLink}
          </span>
          <button
            onClick={handleCopy}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex-shrink-0',
              copied
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30',
            ].join(' ')}
          >
            {copied ? (
              <>
                <Check size={13} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={13} />
                Copy
              </>
            )}
          </button>
        </div>

        {/* QR code + share buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <QRCodeDisplay value={referralLink} />

          <div className="flex flex-col gap-3 flex-1 w-full">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Share on
            </p>

            <a
              href={twitterShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:opacity-90 active:scale-95"
              style={{
                background: 'rgba(29,161,242,0.12)',
                border: '1px solid rgba(29,161,242,0.25)',
                color: '#60A5FA',
              }}
            >
              <Twitter size={16} />
              Share on Twitter / X
            </a>

            <a
              href={telegramShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:opacity-90 active:scale-95"
              style={{
                background: 'rgba(36,161,222,0.12)',
                border: '1px solid rgba(36,161,222,0.25)',
                color: '#38BDF8',
              }}
            >
              <Send size={16} />
              Share on Telegram
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

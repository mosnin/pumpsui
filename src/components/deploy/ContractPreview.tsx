'use client'

import { CodeBlock } from '@/components/docs/CodeBlock'
import type { TokenConfig } from '@/lib/tokenDeployer'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContractPreviewProps {
  config: TokenConfig
  source: string
  onBack: () => void
  onNext: () => void
}

// ─── Security checklist items ─────────────────────────────────────────────────

const SECURITY_CHECKS = [
  {
    label: 'One-time witness pattern (cannot be replayed)',
    detail: 'The witness struct can only be consumed once, preventing double-initialization.',
  },
  {
    label: 'Metadata frozen on-chain (immutable after deploy)',
    detail: 'Token name, symbol and description are permanently locked in the coin metadata object.',
  },
  {
    label: 'TreasuryCap goes to your wallet (you control minting)',
    detail: 'Only the holder of TreasuryCap can mint or burn tokens.',
  },
  {
    label: 'Standard Sui Coin interface (compatible with all Sui DEXes)',
    detail: 'Uses the official sui::coin framework — works with OmniWeave, Cetus, Turbos and more.',
  },
]

// ─── CheckIcon ────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#10B981"
      strokeWidth="2.5"
      aria-hidden="true"
      className="flex-shrink-0 mt-0.5"
    >
      <circle cx="12" cy="12" r="10" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.4)" strokeWidth="1.5" />
      <polyline points="8 12 11 15 16 9" stroke="#10B981" strokeWidth="2" />
    </svg>
  )
}

// ─── ContractPreview ──────────────────────────────────────────────────────────

export function ContractPreview({ config, source, onBack, onNext }: ContractPreviewProps) {
  const filename = `${config.symbol.toLowerCase()}.move`

  function handleDownload() {
    const blob = new Blob([source], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">Generated Move Contract</h3>
        <p className="text-sm text-slate-400 mt-1">
          Review your token contract before deploying to Sui mainnet.
        </p>
      </div>

      {/* Code block — using bash as closest available language to Move */}
      <CodeBlock
        code={source}
        language="bash"
        filename={filename}
        showCopy
      />

      {/* Download button */}
      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:opacity-80"
        style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          color: '#818CF8',
        }}
      >
        <DownloadIcon />
        Download {filename}
      </button>

      {/* Security checklist */}
      <div
        className="rounded-xl p-5"
        style={{
          background: 'rgba(16,185,129,0.04)',
          border: '1px solid rgba(16,185,129,0.15)',
        }}
      >
        <h4 className="text-sm font-semibold text-emerald-400 mb-4 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Security Guarantees
        </h4>
        <ul className="space-y-3">
          {SECURITY_CHECKS.map((check) => (
            <li key={check.label} className="flex items-start gap-3">
              <CheckIcon />
              <div>
                <p className="text-sm font-medium text-white">{check.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{check.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl py-3.5 text-sm font-semibold transition-all hover:opacity-80"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#94A3B8',
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-2 flex-grow rounded-xl py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
          }}
        >
          Deploy Contract →
        </button>
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

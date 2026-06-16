'use client'

import { useState, useRef, useEffect } from 'react'
import { ConnectButton } from '@mysten/dapp-kit'
import { useWallet } from '@/hooks/useWallet'
import { useSuiBalance } from '@/hooks/useSuiBalance'

// ─── Icons ───────────────────────────────────────────────────────────────────

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function LogOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ─── Connected dropdown ───────────────────────────────────────────────────────

function ConnectedWallet() {
  const { address, shortAddress, disconnect } = useWallet()
  const { balance } = useSuiBalance()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function copyAddress() {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function openSuiscan() {
    if (!address) return
    window.open(`https://suiscan.xyz/mainnet/account/${address}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-sm font-medium text-slate-200 transition-all hover:border-indigo-400/50 hover:bg-indigo-500/20"
      >
        {/* Wallet avatar dot */}
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-[9px] font-bold text-white">
          {shortAddress?.[0]?.toUpperCase() ?? 'W'}
        </span>

        <span className="hidden sm:block">{shortAddress}</span>

        <span className="hidden items-center gap-1 text-xs text-slate-400 sm:flex">
          <span className="text-cyan-400">{balance.toFixed(2)}</span>
          <span>SUI</span>
        </span>

        <ChevronDownIcon />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-indigo-500/20 bg-[#0d0d1f] shadow-2xl shadow-black/40">
          {/* Address header */}
          <div className="border-b border-indigo-500/10 px-4 py-3">
            <p className="text-xs text-slate-500">Connected wallet</p>
            <p className="mt-0.5 font-mono text-xs text-slate-300">{shortAddress}</p>
          </div>

          {/* Balance */}
          <div className="border-b border-indigo-500/10 px-4 py-3">
            <p className="text-xs text-slate-500">Balance</p>
            <p className="mt-0.5 text-sm font-semibold text-cyan-400">{balance.toFixed(4)} SUI</p>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={copyAddress}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-indigo-500/10 hover:text-white"
            >
              <CopyIcon />
              {copied ? 'Copied!' : 'Copy address'}
            </button>

            <button
              onClick={openSuiscan}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-indigo-500/10 hover:text-white"
            >
              <ExternalLinkIcon />
              View on Suiscan
            </button>

            <button
              onClick={() => { disconnect(); setOpen(false) }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOutIcon />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function WalletButton() {
  const { isConnected } = useWallet()

  if (isConnected) return <ConnectedWallet />

  return (
    <ConnectButton
      connectText="Connect Wallet"
      // Override dapp-kit default button styles via a wrapper div
    />
  )
}

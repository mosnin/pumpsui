'use client'

import { useConnectWallet, useWallets } from '@mysten/dapp-kit'
import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Fallback icons for wallets without a logoUrl
const WALLET_ICONS: Record<string, string> = {
  'Sui Wallet':
    'https://sui.io/favicon.ico',
  Suiet:
    'https://suiet.app/favicon.ico',
  'Ethos Wallet':
    'https://ethoswallet.xyz/favicon.ico',
  'OKX Wallet':
    'https://static.okx.com/cdn/assets/imgs/226/EB771F0EE9050E74.png',
  'Martian Wallet':
    'https://martianwallet.xyz/assets/icon.png',
}

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const wallets = useWallets()
  const { mutate: connectWallet, isPending } = useConnectWallet()

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() },
    [onClose]
  )
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  function handleConnect(wallet: ReturnType<typeof useWallets>[number]) {
    connectWallet({ wallet }, { onSuccess: onClose })
  }

  // Combine detected wallets with static fallback list so we always show options
  const detectedNames = new Set(wallets.map((w) => w.name))
  const staticWallets = ['Sui Wallet', 'Suiet', 'Ethos Wallet', 'OKX Wallet', 'Martian Wallet'].filter(
    (name) => !detectedNames.has(name)
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="Connect wallet"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-sm overflow-hidden rounded-2xl border border-indigo-500/20 bg-[#0a0a1a] shadow-2xl shadow-black/60"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-indigo-500/10 px-6 py-5">
                <h2 className="text-base font-semibold text-white">Connect a wallet</h2>
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Wallet list */}
              <ul className="divide-y divide-indigo-500/10 px-2 py-2">
                {/* Detected (installed) wallets */}
                {wallets.map((wallet) => (
                  <li key={wallet.name}>
                    <button
                      disabled={isPending}
                      onClick={() => handleConnect(wallet)}
                      className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors hover:bg-indigo-500/10 disabled:opacity-50"
                    >
                      {/* Icon */}
                      {wallet.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={wallet.icon} alt={wallet.name} className="h-8 w-8 rounded-lg" />
                      ) : (
                        <WalletPlaceholderIcon name={wallet.name} />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{wallet.name}</p>
                        <p className="text-xs text-emerald-400">Detected</p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </li>
                ))}

                {/* Static / not-installed wallets */}
                {staticWallets.map((name) => (
                  <li key={name}>
                    <a
                      href={walletInstallUrl(name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors hover:bg-indigo-500/10"
                    >
                      <WalletPlaceholderIcon name={name} faviconUrl={WALLET_ICONS[name]} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{name}</p>
                        <p className="text-xs text-slate-500">Not installed — install</p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>

              {/* Footer note */}
              <p className="px-6 py-4 text-center text-xs text-slate-600">
                By connecting a wallet you agree to our{' '}
                <span className="text-indigo-400 hover:underline cursor-pointer">Terms of Service</span>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function WalletPlaceholderIcon({
  name,
  faviconUrl,
}: {
  name: string
  faviconUrl?: string
}) {
  if (faviconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={faviconUrl}
        alt={name}
        className="h-8 w-8 rounded-lg bg-white/5 object-contain p-0.5"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  // Initials fallback
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 text-xs font-bold text-white">
      {name.slice(0, 2).toUpperCase()}
    </span>
  )
}

function walletInstallUrl(name: string): string {
  const map: Record<string, string> = {
    'Sui Wallet': 'https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil',
    Suiet: 'https://suiet.app',
    'Ethos Wallet': 'https://ethoswallet.xyz',
    'OKX Wallet': 'https://www.okx.com/web3',
    'Martian Wallet': 'https://martianwallet.xyz',
  }
  return map[name] ?? '#'
}

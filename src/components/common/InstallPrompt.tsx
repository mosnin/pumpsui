'use client'

import { useEffect, useState } from 'react'

// BeforeInstallPromptEvent is not part of the standard lib types
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

const VISIT_COUNT_KEY = 'omniweave_visit_count'
const DISMISSED_UNTIL_KEY = 'omniweave_install_dismissed_until'
const VISIT_THRESHOLD = 3
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getVisitCount(): number {
  try {
    return parseInt(localStorage.getItem(VISIT_COUNT_KEY) ?? '0', 10)
  } catch {
    return 0
  }
}

function incrementVisitCount(): number {
  try {
    const next = getVisitCount() + 1
    localStorage.setItem(VISIT_COUNT_KEY, String(next))
    return next
  } catch {
    return 0
  }
}

function isDismissed(): boolean {
  try {
    const until = localStorage.getItem(DISMISSED_UNTIL_KEY)
    if (!until) return false
    return Date.now() < parseInt(until, 10)
  } catch {
    return false
  }
}

function dismissForWeek(): void {
  try {
    localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_DURATION_MS))
  } catch {
    // ignore
  }
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    // Don't show if already running as installed PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIos(ios)

    if (isDismissed()) return

    const visitCount = incrementVisitCount()

    const maybeShow = (prompt: BeforeInstallPromptEvent | null) => {
      if (visitCount >= VISIT_THRESHOLD && !isDismissed()) {
        if (ios || prompt !== null) {
          setShow(true)
        }
      }
    }

    const handler = (e: Event) => {
      e.preventDefault()
      const installEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(installEvent)
      maybeShow(installEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // For iOS, there's no beforeinstallprompt — show after threshold
    if (ios && visitCount >= VISIT_THRESHOLD) {
      setShow(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShow(false)
        setDeferredPrompt(null)
      }
    }
  }

  const handleDismiss = () => {
    dismissForWeek()
    setShow(false)
  }

  if (!show) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Install OmniWeave"
        className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
      >
        <div className="bg-[#0d0d2b]/90 backdrop-blur-xl border border-indigo-500/20 rounded-t-2xl px-6 pt-6 pb-8 shadow-2xl">
          {/* Drag handle */}
          <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-5" />

          {/* Logo + heading */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shrink-0">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Install OmniWeave</h2>
              <p className="text-sm text-slate-400">Faster access, works offline</p>
            </div>
          </div>

          <p className="text-slate-300 text-sm mb-5 leading-relaxed">
            Add OmniWeave to your home screen for instant access to the best Sui DEX rates — no browser needed.
          </p>

          {isIos ? (
            /* iOS instructions */
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-5">
              <p className="text-sm text-slate-200 font-medium mb-2">To install on iOS:</p>
              <ol className="text-sm text-slate-300 space-y-1 list-none">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">1.</span>
                  Tap the{' '}
                  <svg
                    className="w-4 h-4 text-cyan-400 inline"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-label="Share icon"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>{' '}
                  <strong className="text-white">Share</strong> button in Safari
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">2.</span>
                  Scroll down and tap{' '}
                  <strong className="text-white">Add to Home Screen</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">3.</span>
                  Tap <strong className="text-white">Add</strong> to confirm
                </li>
              </ol>
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            {!isIos && (
              <button
                onClick={handleInstall}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 transition-all duration-200 shadow-lg shadow-indigo-500/25 active:scale-95"
              >
                Install App
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="w-full py-3 px-4 rounded-xl font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all duration-200 active:scale-95"
            >
              Not now
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1) both;
        }
      `}</style>
    </>
  )
}

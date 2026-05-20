'use client'

import { useState, useEffect } from 'react'
import { AIChat } from './AIChat'

export function AIChatButton() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  if (!mounted) return null

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open AI Trading Assistant"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl text-white text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.4), 0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {/* Animated sparkle */}
        <span
          className="text-base"
          style={{
            animation: 'spin 3s linear infinite',
            display: 'inline-block',
          }}
        >
          ✦
        </span>
        <span>Ask AI</span>
        {/* AI badge */}
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        >
          AI
        </span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Side drawer */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-full max-w-[400px] shadow-2xl transition-transform duration-300"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          borderLeft: '1px solid rgba(99,102,241,0.2)',
        }}
      >
        <AIChat onClose={() => setOpen(false)} />
      </div>
    </>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { DeploymentResult } from '@/lib/tokenDeployer'

// ─── Props ────────────────────────────────────────────────────────────────────

interface DeploySuccessProps {
  result: DeploymentResult
}

// ─── Particle types ───────────────────────────────────────────────────────────

interface Particle {
  id: number
  x: number
  y: number
  color: string
  size: number
  vx: number
  vy: number
  life: number
  maxLife: number
  rotation: number
  rotationSpeed: number
  shape: 'circle' | 'square' | 'triangle'
}

// ─── Confetti Canvas ──────────────────────────────────────────────────────────

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)

  const COLORS = ['#6366F1', '#06B6D4', '#818CF8', '#10B981', '#F472B6', '#FBBF24']

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Spawn burst of particles
    for (let i = 0; i < 80; i++) {
      particlesRef.current.push({
        id: i,
        x: canvas.width / 2 + (Math.random() - 0.5) * 100,
        y: canvas.height * 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4 + Math.random() * 8,
        vx: (Math.random() - 0.5) * 12,
        vy: -8 - Math.random() * 10,
        life: 0,
        maxLife: 80 + Math.random() * 60,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        shape: (['circle', 'square', 'triangle'] as const)[Math.floor(Math.random() * 3)],
      })
    }

    function drawParticle(p: Particle) {
      const alpha = Math.max(0, 1 - p.life / p.maxLife)
      ctx!.save()
      ctx!.translate(p.x, p.y)
      ctx!.rotate((p.rotation * Math.PI) / 180)
      ctx!.globalAlpha = alpha
      ctx!.fillStyle = p.color

      if (p.shape === 'circle') {
        ctx!.beginPath()
        ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx!.fill()
      } else if (p.shape === 'square') {
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      } else {
        ctx!.beginPath()
        ctx!.moveTo(0, -p.size / 2)
        ctx!.lineTo(p.size / 2, p.size / 2)
        ctx!.lineTo(-p.size / 2, p.size / 2)
        ctx!.closePath()
        ctx!.fill()
      }

      ctx!.restore()
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife)

      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.3 // gravity
        p.vx *= 0.99
        p.rotation += p.rotationSpeed
        p.life++
        drawParticle(p)
      }

      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
}

// ─── CopyField ────────────────────────────────────────────────────────────────

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard may be blocked
    }
  }

  return (
    <div>
      <p className="text-xs text-slate-500 mb-1.5">{label}</p>
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}
      >
        <code className="flex-1 text-xs font-mono text-slate-300 truncate">{value}</code>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all"
          style={{
            background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.06)',
            border: copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: copied ? '#10B981' : '#64748B',
          }}
        >
          {copied ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          )}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

// ─── DeploySuccess ────────────────────────────────────────────────────────────

export function DeploySuccess({ result }: DeploySuccessProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slight delay for mount animation
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Confetti */}
      <AnimatePresence>
        {visible && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <ConfettiCanvas />
          </div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-20 space-y-6 p-1"
      >
        {/* Hero section */}
        <div className="text-center space-y-3 py-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))',
              border: '2px solid rgba(99,102,241,0.4)',
              boxShadow: '0 0 30px rgba(99,102,241,0.3)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#success-grad)" strokeWidth="2.5">
              <defs>
                <linearGradient id="success-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3
              className="text-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Token Deployed!
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Your token is now live on Sui mainnet.
            </p>
          </motion.div>
        </div>

        {/* Contract details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
          style={{
            background: 'rgba(99,102,241,0.05)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <h4 className="text-sm font-semibold text-slate-300">Contract Details</h4>
          <CopyField label="Package ID" value={result.packageId} />
          <CopyField label="Coin Type" value={result.coinType} />
          <CopyField label="Treasury Cap ID" value={result.treasuryCapId} />
          <CopyField label="Transaction Hash" value={result.txHash} />
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {/* View on Suiscan */}
          <a
            href={`https://suiscan.xyz/mainnet/object/${result.packageId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#818CF8',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View on Suiscan
          </a>

          {/* Add to OmniWeave */}
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: 'rgba(6,182,212,0.1)',
              border: '1px solid rgba(6,182,212,0.3)',
              color: '#06B6D4',
            }}
            onClick={() => {
              // In a real app, this would add the token to the user's token list
              void navigator.clipboard.writeText(result.coinType).catch(() => undefined)
              alert(`Token type copied!\n\nAdd ${result.coinType} to OmniWeave by importing the coin type in your token list settings.`)
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 12h6m-3-3v6" />
            </svg>
            Add to OmniWeave
          </button>

          {/* Swap your token */}
          <Link
            href={`/swap?tokenOut=${encodeURIComponent(result.coinType)}`}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16V4m0 0L3 8m4-4l4 4" />
              <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Swap Your Token
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

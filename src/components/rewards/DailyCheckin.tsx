'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePointsStore } from '@/store/pointsStore'

// ─── 7-day streak calendar ────────────────────────────────────────────────────

function StreakCalendar({ streakDays }: { streakDays: number }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  // How many of the last 7 days were checked in
  const filled = Math.min(streakDays, 7)

  return (
    <div className="flex items-center gap-2">
      {days.map((d, i) => {
        const done = i < filled
        const isToday = i === filled - 1 && filled > 0
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <motion.div
              initial={false}
              animate={done ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="w-8 h-8 rounded-xl flex items-center justify-center relative"
              style={{
                background: done
                  ? isToday
                    ? 'linear-gradient(135deg, #F59E0B, #EF4444)'
                    : 'linear-gradient(135deg, #6366F1, #06B6D4)'
                  : 'rgba(42,42,90,0.5)',
                border: done
                  ? isToday
                    ? '1px solid #F59E0B60'
                    : '1px solid #6366F140'
                  : '1px solid rgba(42,42,90,0.6)',
                boxShadow: done && isToday ? '0 0 12px rgba(245,158,11,0.4)' : undefined,
              }}
            >
              {done ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="text-xs text-slate-600">{d}</span>
              )}
            </motion.div>
            <span className="text-xs text-slate-600">{d}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Confetti burst ───────────────────────────────────────────────────────────

function ConfettiBurst() {
  const pieces = Array.from({ length: 12 })
  const colors = ['#F59E0B', '#6366F1', '#06B6D4', '#10B981', '#EC4899', '#FCD34D']

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {pieces.map((_, i) => {
        const angle = (i / 12) * 360
        const color = colors[i % colors.length]
        const distance = 60 + Math.random() * 40
        const x = Math.cos((angle * Math.PI) / 180) * distance
        const y = Math.sin((angle * Math.PI) / 180) * distance - 30

        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
            style={{ background: color, originX: 0, originY: 0 }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x,
              y,
              opacity: 0,
              scale: 0,
              rotate: angle * 2,
            }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.02 }}
          />
        )
      })}
    </div>
  )
}

// ─── DailyCheckin ─────────────────────────────────────────────────────────────

export function DailyCheckin() {
  const { dailyCheckin, lastCheckinDate, streakDays, totalPoints } = usePointsStore()
  const [justCheckedIn, setJustCheckedIn] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const alreadyDoneToday = lastCheckinDate === today

  function handleCheckin() {
    const success = dailyCheckin()
    if (success) {
      setJustCheckedIn(true)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 800)
    }
  }

  const streakTarget7 = streakDays >= 7

  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.9), rgba(13,13,31,0.95))',
        border: '1px solid rgba(245,158,11,0.2)',
      }}
    >
      {/* Glow */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #F59E0B, transparent)' }}
      />

      {showConfetti && <ConfettiBurst />}

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Left text */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {/* Flame icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#F59E0B">
              <path d="M12 2c0 0-6 5.686-6 10a6 6 0 0012 0c0-4.314-6-10-6-10z" />
              <path d="M12 12c0 0-2.5 2-2.5 4a2.5 2.5 0 005 0c0-2-2.5-4-2.5-4z" fill="#FCD34D" />
            </svg>
            <h3 className="font-bold text-white text-base">Daily Check-In</h3>
            {streakDays > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: '#F59E0B20', color: '#FCD34D', border: '1px solid #F59E0B30' }}
              >
                {streakDays}d streak
              </span>
            )}
          </div>

          <p className="text-sm text-slate-400">
            {alreadyDoneToday || justCheckedIn
              ? 'Great job! Come back tomorrow to keep your streak alive.'
              : 'Check in daily to earn points and build your streak bonus.'}
          </p>

          {streakTarget7 && (
            <div
              className="inline-flex items-center gap-1.5 mt-1 text-xs rounded-full px-3 py-1 font-medium self-start"
              style={{ background: '#6366F115', border: '1px solid #6366F130', color: '#818CF8' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              2× streak multiplier active!
            </div>
          )}
        </div>

        {/* Right — button */}
        <div className="flex flex-col items-center sm:items-end gap-3">
          <AnimatePresence mode="wait">
            {alreadyDoneToday || justCheckedIn ? (
              <motion.div
                key="done"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-sm"
                style={{
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#34D399',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Checked in!
              </motion.div>
            ) : (
              <motion.button
                key="checkin"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCheckin}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold text-sm cursor-pointer text-black"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                  boxShadow: '0 0 20px rgba(245,158,11,0.35)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
                Check In (+10 pts)
              </motion.button>
            )}
          </AnimatePresence>

          <p className="text-xs text-slate-500">7 days = 2× multiplier</p>
        </div>
      </div>

      {/* Streak calendar */}
      <div className="relative mt-5 pt-4" style={{ borderTop: '1px solid rgba(42,42,90,0.4)' }}>
        <p className="text-xs text-slate-500 mb-3">This week</p>
        <StreakCalendar streakDays={streakDays} />
      </div>
    </div>
  )
}

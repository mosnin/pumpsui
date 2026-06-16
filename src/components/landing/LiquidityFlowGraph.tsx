'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const DEXES = [
  { name: 'Cetus',     color: '#10B981', angle: -90 },
  { name: 'Turbos',    color: '#3B82F6', angle: -30 },
  { name: 'DeepBook',  color: '#F59E0B', angle:  30 },
  { name: 'Aftermath', color: '#A855F7', angle:  90 },
  { name: 'FlowX',     color: '#EC4899', angle: 150 },
  { name: 'Kriya',     color: '#06B6D4', angle: 210 },
]

const DEG = (d: number) => (d * Math.PI) / 180
const CX = 200, CY = 180, RADIUS = 130

function nodePos(angle: number) {
  return {
    x: CX + RADIUS * Math.cos(DEG(angle)),
    y: CY + RADIUS * Math.sin(DEG(angle)),
  }
}

export function LiquidityFlowGraph() {
  const [hoveredDex, setHoveredDex] = useState<number | null>(null)

  return (
    <div className="relative w-full flex justify-center select-none">
      <svg width="400" height="360" viewBox="0 0 400 360" className="overflow-visible">
        <defs>
          {DEXES.map((dex, i) => (
            <radialGradient key={i} id={`glow-${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={dex.color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={dex.color} stopOpacity="0" />
            </radialGradient>
          ))}
          <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </radialGradient>
          <filter id="blur-sm">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Connection lines */}
        {DEXES.map((dex, i) => {
          const pos = nodePos(dex.angle)
          const isHovered = hoveredDex === i
          return (
            <g key={i}>
              {/* Glow line */}
              <line
                x1={CX} y1={CY} x2={pos.x} y2={pos.y}
                stroke={dex.color}
                strokeWidth={isHovered ? 3 : 1.5}
                strokeOpacity={isHovered ? 0.5 : 0.2}
                filter="url(#blur-sm)"
              />
              {/* Sharp line */}
              <line
                x1={CX} y1={CY} x2={pos.x} y2={pos.y}
                stroke={dex.color}
                strokeWidth={isHovered ? 1.5 : 0.75}
                strokeOpacity={isHovered ? 0.8 : 0.4}
                strokeDasharray="4 6"
              />
            </g>
          )
        })}

        {/* Particles — animated via motion.circle */}
        {DEXES.map((dex, i) => {
          const pos = nodePos(dex.angle)
          const duration = 2 + i * 0.3
          return (
            <g key={`particles-${i}`}>
              {/* hub → dex */}
              <motion.circle
                r={2.5}
                fill={dex.color}
                opacity={0.85}
                animate={{
                  cx: [CX, pos.x],
                  cy: [CY, pos.y],
                }}
                transition={{
                  repeat: Infinity,
                  duration,
                  ease: 'linear',
                  delay: i * 0.4,
                }}
              />
              {/* dex → hub */}
              <motion.circle
                r={2.5}
                fill={dex.color}
                opacity={0.85}
                animate={{
                  cx: [pos.x, CX],
                  cy: [pos.y, CY],
                }}
                transition={{
                  repeat: Infinity,
                  duration: duration * 1.1,
                  ease: 'linear',
                  delay: i * 0.4 + duration * 0.5,
                }}
              />
            </g>
          )
        })}

        {/* DEX nodes */}
        {DEXES.map((dex, i) => {
          const pos = nodePos(dex.angle)
          const isHovered = hoveredDex === i
          return (
            <g
              key={i}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredDex(i)}
              onMouseLeave={() => setHoveredDex(null)}
            >
              {/* Glow halo */}
              <circle
                cx={pos.x} cy={pos.y}
                r={isHovered ? 32 : 24}
                fill={`url(#glow-${i})`}
                opacity={isHovered ? 1 : 0.6}
                style={{ transition: 'r 0.3s, opacity 0.3s' }}
              />
              {/* Node circle */}
              <circle
                cx={pos.x} cy={pos.y} r={isHovered ? 22 : 18}
                fill={isHovered ? dex.color + '22' : dex.color + '11'}
                stroke={dex.color}
                strokeWidth={isHovered ? 2 : 1}
                strokeOpacity={isHovered ? 1 : 0.6}
                style={{ transition: 'r 0.25s, fill 0.25s, stroke-width 0.25s' }}
              />
              {/* Label */}
              <text
                x={pos.x}
                y={pos.y + (pos.y > CY + 20 ? 36 : pos.y < CY - 20 ? -28 : 0)}
                textAnchor="middle"
                dominantBaseline={pos.y >= CY - 20 && pos.y <= CY + 20 ? 'middle' : 'auto'}
                fontSize="10"
                fontWeight="600"
                fill={isHovered ? dex.color : '#94A3B8'}
                style={{ transition: 'fill 0.25s' }}
              >
                {dex.name}
              </text>
              {/* DEX initial inside circle */}
              <text
                x={pos.x} y={pos.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fontWeight="700"
                fill={isHovered ? dex.color : dex.color + 'BB'}
              >
                {dex.name[0]}
              </text>
            </g>
          )
        })}

        {/* Center hub — pulsing */}
        <motion.circle
          cx={CX} cy={CY} r={38}
          fill="url(#center-glow)"
          animate={{ r: [38, 46, 38] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <circle
          cx={CX} cy={CY} r={28}
          fill="rgba(99,102,241,0.12)"
          stroke="rgba(99,102,241,0.5)"
          strokeWidth={1.5}
        />
        <text
          x={CX} y={CY - 4}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fontWeight="700" fill="#818CF8"
        >
          Omni
        </text>
        <text
          x={CX} y={CY + 7}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fontWeight="700" fill="#818CF8"
        >
          Weave
        </text>
      </svg>
    </div>
  )
}

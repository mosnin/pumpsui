'use client'

import { motion } from 'framer-motion'

const PARTNERS = [
  { name: 'Cetus',     color: '#10B981', desc: 'CLMM DEX' },
  { name: 'Turbos',    color: '#3B82F6', desc: 'Concentrated Liquidity' },
  { name: 'DeepBook',  color: '#F59E0B', desc: 'Central Limit Order Book' },
  { name: 'Aftermath', color: '#A855F7', desc: 'Weighted Pools' },
  { name: 'FlowX',     color: '#EC4899', desc: 'AMM' },
  { name: 'Kriya',     color: '#06B6D4', desc: 'DEX Aggregator' },
]

export function DexPartners() {
  return (
    <div className="w-full py-8">
      <p className="text-xs text-center uppercase tracking-widest mb-6" style={{ color: '#334155' }}>
        Integrated Partners
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {PARTNERS.map((p, i) => (
          <motion.div
            key={p.name}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
            style={{
              background: `${p.color}0A`,
              border: `1px solid ${p.color}25`,
            }}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            whileHover={{ scale: 1.04, borderColor: p.color + '60' }}
          >
            {/* Logo circle */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
              style={{ background: `${p.color}20`, color: p.color }}
            >
              {p.name[0]}
            </div>
            <div>
              <div className="text-xs font-bold" style={{ color: '#CBD5E1' }}>{p.name}</div>
              <div className="text-[10px]" style={{ color: '#475569' }}>{p.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

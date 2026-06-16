'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  ExternalLink,
  Layers,
  Plus,
} from 'lucide-react'
import { DEXBadge, type DEXName } from '@/components/common/DEXBadge'
import { PriceChange } from '@/components/common/PriceChange'
import PositionCard from '@/components/liquidity/PositionCard'
import { generateDemoPositions, LPPosition } from '@/lib/liquidity'
import { PageTransition } from '@/components/layout/PageTransition'

const AddLiquidityModal = dynamic(() => import('@/components/liquidity/AddLiquidityModal'), { ssr: false })
const RemoveLiquidityModal = dynamic(() => import('@/components/liquidity/RemoveLiquidityModal'), { ssr: false })

// ─── Mock Data ───────────────────────────────────────────────────────────────

interface Pool {
  id: string
  tokenA: string
  tokenB: string
  dex: DEXName
  tvl: number
  volume24h: number
  apr: number
  fee: number // basis points
  externalUrl: string
}

const POOLS: Pool[] = [
  { id: '1',  tokenA: 'SUI',  tokenB: 'USDC',  dex: 'Cetus',     tvl: 18_400_000, volume24h: 4_120_000, apr: 24.3,  fee: 30,  externalUrl: 'https://app.cetus.zone/liquidity' },
  { id: '2',  tokenA: 'SUI',  tokenB: 'USDT',  dex: 'Turbos',    tvl: 9_200_000,  volume24h: 2_830_000, apr: 31.7,  fee: 30,  externalUrl: 'https://app.turbos.finance/pools' },
  { id: '3',  tokenA: 'WBTC', tokenB: 'USDC',  dex: 'DeepBook',  tvl: 14_700_000, volume24h: 1_940_000, apr: 13.2,  fee: 20,  externalUrl: 'https://deepbook.tech/pool' },
  { id: '4',  tokenA: 'ETH',  tokenB: 'SUI',   dex: 'Aftermath', tvl: 7_600_000,  volume24h: 1_220_000, apr: 16.8,  fee: 25,  externalUrl: 'https://aftermath.finance/pools' },
  { id: '5',  tokenA: 'USDC', tokenB: 'USDT',  dex: 'FlowX',     tvl: 22_100_000, volume24h: 980_000,   apr: 4.4,   fee: 5,   externalUrl: 'https://flowx.finance/pool' },
  { id: '6',  tokenA: 'SUI',  tokenB: 'DEEP',  dex: 'DeepBook',  tvl: 4_900_000,  volume24h: 760_000,   apr: 15.5,  fee: 30,  externalUrl: 'https://deepbook.tech/pool' },
  { id: '7',  tokenA: 'BUCK', tokenB: 'USDC',  dex: 'Kriya',     tvl: 3_200_000,  volume24h: 490_000,   apr: 15.3,  fee: 20,  externalUrl: 'https://kriya.finance/pools' },
  { id: '8',  tokenA: 'SUI',  tokenB: 'wUSDC', dex: 'Cetus',     tvl: 6_800_000,  volume24h: 1_340_000, apr: 19.6,  fee: 30,  externalUrl: 'https://app.cetus.zone/liquidity' },
  { id: '9',  tokenA: 'CETUS',tokenB: 'SUI',   dex: 'Cetus',     tvl: 2_100_000,  volume24h: 380_000,   apr: 18.1,  fee: 30,  externalUrl: 'https://app.cetus.zone/liquidity' },
  { id: '10', tokenA: 'SUI',  tokenB: 'TURBOS',dex: 'Turbos',    tvl: 1_700_000,  volume24h: 270_000,   apr: 15.9,  fee: 30,  externalUrl: 'https://app.turbos.finance/pools' },
  { id: '11', tokenA: 'SUI',  tokenB: 'AFT',   dex: 'Aftermath', tvl: 2_900_000,  volume24h: 530_000,   apr: 18.3,  fee: 25,  externalUrl: 'https://aftermath.finance/pools' },
  { id: '12', tokenA: 'ETH',  tokenB: 'USDC',  dex: 'Turbos',    tvl: 8_300_000,  volume24h: 1_610_000, apr: 19.4,  fee: 30,  externalUrl: 'https://app.turbos.finance/pools' },
  { id: '13', tokenA: 'SUI',  tokenB: 'KRIYA', dex: 'Kriya',     tvl: 1_100_000,  volume24h: 210_000,   apr: 19.1,  fee: 20,  externalUrl: 'https://kriya.finance/pools' },
  { id: '14', tokenA: 'WBTC', tokenB: 'ETH',   dex: 'DeepBook',  tvl: 5_600_000,  volume24h: 890_000,   apr: 15.9,  fee: 20,  externalUrl: 'https://deepbook.tech/pool' },
  { id: '15', tokenA: 'SUI',  tokenB: 'FLX',   dex: 'FlowX',     tvl: 1_400_000,  volume24h: 240_000,   apr: 17.1,  fee: 30,  externalUrl: 'https://flowx.finance/pool' },
]

const DEX_OPTIONS: (DEXName | 'All')[] = ['All', 'Cetus', 'Turbos', 'DeepBook', 'Aftermath', 'FlowX', 'Kriya']

type SortKey = 'tvl' | 'volume24h' | 'apr' | 'fee'
type SortDir = 'asc' | 'desc'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (column !== sortKey) return <ChevronsUpDown size={14} className="text-slate-600" />
  return sortDir === 'desc'
    ? <ChevronDown size={14} style={{ color: '#6366F1' }} />
    : <ChevronUp size={14} style={{ color: '#6366F1' }} />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PoolsPage() {
  const [activeTab, setActiveTab] = useState<'positions' | 'pools'>('positions')
  const [dexFilter, setDexFilter] = useState<DEXName | 'All'>('All')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('tvl')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [addLiquidityPool, setAddLiquidityPool] = useState<{ token0: string; token1: string; poolId: string } | null>(null)
  const [removePosition, setRemovePosition] = useState<LPPosition | null>(null)
  const [positions] = useState<LPPosition[]>(() => generateDemoPositions())

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const filtered = useMemo(() => {
    let rows = [...POOLS]

    if (dexFilter !== 'All') {
      rows = rows.filter((p) => p.dex === dexFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (p) =>
          p.tokenA.toLowerCase().includes(q) ||
          p.tokenB.toLowerCase().includes(q) ||
          p.dex.toLowerCase().includes(q),
      )
    }

    rows.sort((a, b) => {
      const diff = a[sortKey] - b[sortKey]
      return sortDir === 'desc' ? -diff : diff
    })

    return rows
  }, [dexFilter, search, sortKey, sortDir])

  const handleCollectFees = (position: LPPosition) => {
    // In a real app this would trigger buildCollectFeesTx and sign it
    console.log('Collect fees for position', position.positionId)
  }

  return (
    <PageTransition>
    <div
      className="min-h-screen font-sans"
      style={{ background: '#060611', color: '#E2E8F0' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(6,182,212,0.15)', color: '#06B6D4' }}
            >
              <Layers size={18} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#E2E8F0' }}>
              Pool Explorer
            </h1>
          </div>
          <p className="text-slate-400 text-sm ml-11">
            Browse and compare liquidity pools across all integrated DEXes on Sui
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
          <button
            onClick={() => setActiveTab('positions')}
            className="px-5 py-2.5 text-sm font-semibold transition-all relative"
            style={
              activeTab === 'positions'
                ? { color: '#6366F1' }
                : { color: '#64748B' }
            }
          >
            My Positions ({positions.length})
            {activeTab === 'positions' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                style={{ background: '#6366F1' }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('pools')}
            className="px-5 py-2.5 text-sm font-semibold transition-all relative"
            style={
              activeTab === 'pools'
                ? { color: '#6366F1' }
                : { color: '#64748B' }
            }
          >
            All Pools
            {activeTab === 'pools' && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                style={{ background: '#6366F1' }}
              />
            )}
          </button>
        </div>

        {/* Tab 1: My Positions */}
        {activeTab === 'positions' && (
          <>
            {positions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
                >
                  <Layers size={28} style={{ color: '#6366F1' }} />
                </div>
                <p className="text-slate-400 text-sm text-center max-w-xs">
                  You have no active positions. Add liquidity to earn fees.
                </p>
                <button
                  onClick={() => setActiveTab('pools')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                    color: '#fff',
                  }}
                >
                  <Plus size={14} />
                  Browse Pools
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {positions.map((position) => (
                  <PositionCard
                    key={position.positionId}
                    position={position}
                    onAddMore={(p) =>
                      setAddLiquidityPool({ token0: p.token0, token1: p.token1, poolId: p.poolId })
                    }
                    onRemove={(p) => setRemovePosition(p)}
                    onCollectFees={handleCollectFees}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab 2: All Pools */}
        {activeTab === 'pools' && (
          <>
            {/* Filters */}
            <div
              className="rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              style={{
                background: 'rgba(13, 13, 31, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              {/* Search */}
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Search by token or DEX…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-all"
                  style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#E2E8F0',
                  }}
                />
              </div>

              {/* DEX filter buttons */}
              <div className="flex flex-wrap gap-2">
                {DEX_OPTIONS.map((dex) => (
                  <button
                    key={dex}
                    onClick={() => setDexFilter(dex)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                    style={
                      dexFilter === dex
                        ? { background: '#6366F1', color: '#fff' }
                        : { background: 'rgba(99,102,241,0.1)', color: '#94a3b8' }
                    }
                  >
                    {dex}
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-500 sm:ml-auto">
                {filtered.length} pool{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Table */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'rgba(13, 13, 31, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                      <th className="text-left px-5 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Pool
                      </th>
                      <th className="text-left px-4 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        DEX
                      </th>
                      {(
                        [
                          { key: 'tvl' as SortKey, label: 'TVL' },
                          { key: 'volume24h' as SortKey, label: 'Volume 24h' },
                          { key: 'apr' as SortKey, label: 'APR' },
                          { key: 'fee' as SortKey, label: 'Fee' },
                        ] as const
                      ).map(({ key, label }) => (
                        <th
                          key={key}
                          className="text-right px-4 py-4 text-xs font-medium uppercase tracking-wider text-slate-500 cursor-pointer select-none"
                          onClick={() => handleSort(key)}
                        >
                          <span className="inline-flex items-center gap-1 justify-end">
                            {label}
                            <SortIcon column={key} sortKey={sortKey} sortDir={sortDir} />
                          </span>
                        </th>
                      ))}
                      <th className="text-right px-5 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Link
                      </th>
                      <th className="text-right px-5 py-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Add
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-16 text-slate-500"
                        >
                          No pools match your filters.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((pool, i) => (
                        <tr
                          key={pool.id}
                          className="group transition-colors hover:bg-white/[0.025]"
                          style={{
                            borderBottom:
                              i < filtered.length - 1
                                ? '1px solid rgba(99,102,241,0.07)'
                                : 'none',
                          }}
                        >
                          {/* Pool */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-2">
                                {[pool.tokenA, pool.tokenB].map((tok) => (
                                  <div
                                    key={tok}
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-[#060611]"
                                    style={{
                                      background: 'rgba(99,102,241,0.2)',
                                      color: '#6366F1',
                                    }}
                                  >
                                    {tok[0]}
                                  </div>
                                ))}
                              </div>
                              <span className="font-semibold" style={{ color: '#E2E8F0' }}>
                                {pool.tokenA} / {pool.tokenB}
                              </span>
                            </div>
                          </td>

                          {/* DEX */}
                          <td className="px-4 py-4">
                            <DEXBadge dex={pool.dex} size="sm" />
                          </td>

                          {/* TVL */}
                          <td className="px-4 py-4 text-right font-mono" style={{ color: '#E2E8F0' }}>
                            {fmt(pool.tvl)}
                          </td>

                          {/* Volume 24h */}
                          <td className="px-4 py-4 text-right font-mono text-slate-300">
                            {fmt(pool.volume24h)}
                          </td>

                          {/* APR */}
                          <td className="px-4 py-4 text-right">
                            <PriceChange value={pool.apr} showIcon={false} size="sm" />
                          </td>

                          {/* Fee */}
                          <td className="px-4 py-4 text-right text-slate-400 font-mono text-xs">
                            {(pool.fee / 100).toFixed(2)}%
                          </td>

                          {/* External link */}
                          <td className="px-5 py-4 text-right">
                            <a
                              href={pool.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
                              style={{ color: '#06B6D4' }}
                            >
                              View
                              <ExternalLink size={12} />
                            </a>
                          </td>

                          {/* Add liquidity button */}
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() =>
                                setAddLiquidityPool({
                                  token0: pool.tokenA,
                                  token1: pool.tokenB,
                                  poolId: pool.id,
                                })
                              }
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
                              style={{
                                background: 'rgba(99,102,241,0.15)',
                                border: '1px solid rgba(99,102,241,0.3)',
                                color: '#6366F1',
                              }}
                            >
                              <Plus size={11} />
                              Add
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-600 text-center">
              Data is illustrative. Live TVL and APR data will be sourced from on-chain indexers.
            </p>
          </>
        )}
      </div>

      {/* Modals */}
      <AddLiquidityModal
        open={addLiquidityPool !== null}
        onClose={() => setAddLiquidityPool(null)}
        initialToken0={addLiquidityPool?.token0}
        initialToken1={addLiquidityPool?.token1}
        initialPoolId={addLiquidityPool?.poolId}
      />
      <RemoveLiquidityModal
        open={removePosition !== null}
        onClose={() => setRemovePosition(null)}
        position={removePosition}
      />
    </div>
    </PageTransition>
  )
}

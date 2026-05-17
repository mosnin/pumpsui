'use client'

import { useState } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import {
  LOCK_PERIODS,
  STAKING_POOL_ID,
  buildStakeTx,
  buildUnstakeTx,
  formatUnlockDate,
  getTierFromStake,
  lockMsToMultiplierBps,
} from '@/lib/staking'

type Tab = 'stake' | 'unstake'

// ─── Tab toggle ───────────────────────────────────────────────────────────────

function TabToggle({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div
      className="flex rounded-xl p-1 gap-1"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)' }}
    >
      {(['stake', 'unstake'] as Tab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all capitalize"
          style={
            active === tab
              ? {
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(6,182,212,0.15))',
                  color: '#c7d2fe',
                  border: '1px solid rgba(99,102,241,0.4)',
                }
              : { color: '#64748b' }
          }
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// ─── Lock-period pill ─────────────────────────────────────────────────────────

interface LockPillProps {
  label: string
  multiplier: string
  bonus: string
  selected: boolean
  onClick: () => void
}

function LockPill({ label, multiplier, bonus, selected, onClick }: LockPillProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 rounded-xl py-2 px-2 text-xs transition-all"
      style={
        selected
          ? {
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.1))',
              border: '1px solid rgba(99,102,241,0.5)',
              color: '#c7d2fe',
            }
          : {
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#64748b',
            }
      }
    >
      <span className="font-bold">{label}</span>
      <span style={{ color: selected ? '#06B6D4' : '#475569' }}>{multiplier}</span>
      <span style={{ color: selected ? '#10B981' : '#334155', fontSize: '10px' }}>{bonus}</span>
    </button>
  )
}

// ─── Summary row ──────────────────────────────────────────────────────────────

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold" style={{ color: accent ?? '#e2e8f0' }}>
        {value}
      </span>
    </div>
  )
}

// ─── StakeCard ────────────────────────────────────────────────────────────────

export function StakeCard() {
  const account = useCurrentAccount()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()

  const [tab, setTab]               = useState<Tab>('stake')
  const [amount, setAmount]         = useState('')
  const [selectedLockIdx, setLock]  = useState(0)
  const [loading, setLoading]       = useState(false)
  const [txHash, setTxHash]         = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)

  const lockPeriod   = LOCK_PERIODS[selectedLockIdx]
  const amountNum    = parseFloat(amount) || 0
  const baseUnits    = BigInt(Math.floor(amountNum * 1e9))
  const multiplierBps = lockMsToMultiplierBps(lockPeriod.ms)
  const votingPower  = Number(baseUnits) * multiplierBps / 10_000 / 1e9
  const tier         = getTierFromStake(baseUnits)
  const unlockDate   = formatUnlockDate(
    lockPeriod.ms === 0 ? 0 : Date.now() + lockPeriod.ms
  )

  const handleStake = async () => {
    if (!account || !amount || amountNum <= 0) return
    setLoading(true)
    setError(null)
    setTxHash(null)
    try {
      // Demo: in production, fetch the user's OMNI coin object ID from RPC
      const fakeCoinId = '0xDEMO_COIN_OBJECT_ID'
      const tx = buildStakeTx(STAKING_POOL_ID, fakeCoinId, baseUnits, lockPeriod.ms)
      // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
      const res = await signAndExecute({ transaction: tx })
      setTxHash(res.digest)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  const handleUnstake = async () => {
    if (!account) return
    setLoading(true)
    setError(null)
    setTxHash(null)
    try {
      // Demo: position ID comes from wallet-owned objects query
      const fakePositionId = '0xDEMO_POSITION_ID'
      const tx = buildUnstakeTx(STAKING_POOL_ID, fakePositionId)
      // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
      const res = await signAndExecute({ transaction: tx })
      setTxHash(res.digest)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-5"
      style={{
        background: 'linear-gradient(135deg, rgba(22,22,48,0.95), rgba(13,13,31,0.98))',
        border: '1px solid rgba(99,102,241,0.2)',
      }}
    >
      {/* Tab toggle */}
      <TabToggle active={tab} onChange={setTab} />

      {tab === 'stake' ? (
        <>
          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Amount (OMNI)</label>
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <input
                type="number"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-transparent text-white text-lg font-semibold outline-none placeholder-slate-600"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400">OMNI</span>
                <button
                  onClick={() => setAmount('12500')}
                  className="rounded-lg px-2 py-1 text-xs font-bold transition-colors"
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    color: '#818CF8',
                    border: '1px solid rgba(99,102,241,0.3)',
                  }}
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          {/* Lock period selector */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Lock Period</p>
            <div className="grid grid-cols-4 gap-2">
              {LOCK_PERIODS.map((lp, i) => (
                <LockPill
                  key={lp.label}
                  label={lp.label}
                  multiplier={lp.multiplier}
                  bonus={lp.bonus}
                  selected={selectedLockIdx === i}
                  onClick={() => setLock(i)}
                />
              ))}
            </div>
          </div>

          {/* Summary panel */}
          <div
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <SummaryRow
              label="Your tier after staking"
              value={tier.name}
              accent={tier.color}
            />
            <SummaryRow
              label="Fee discount"
              value={`${tier.feeDiscount}%`}
              accent="#10B981"
            />
            <SummaryRow
              label="Voting power"
              value={votingPower > 0 ? votingPower.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
              accent="#06B6D4"
            />
            <SummaryRow
              label="Locked until"
              value={unlockDate}
              accent={lockPeriod.ms === 0 ? '#64748b' : '#c7d2fe'}
            />
          </div>

          {/* CTA */}
          {txHash ? (
            <div
              className="rounded-xl p-3 text-center text-sm"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}
            >
              Staked! Tx: {txHash.slice(0, 10)}…{txHash.slice(-6)}
            </div>
          ) : (
            <button
              onClick={account ? handleStake : undefined}
              disabled={loading || !account || amountNum <= 0}
              className="w-full rounded-xl py-3.5 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                color: '#fff',
              }}
            >
              {loading ? 'Staking…' : !account ? 'Connect Wallet to Stake' : 'Stake OMNI'}
            </button>
          )}
        </>
      ) : (
        /* ── Unstake tab ── */
        <div className="flex flex-col gap-5">
          <p className="text-sm text-slate-400">
            Select a position from the panel on the right, then click{' '}
            <span className="text-indigo-300 font-semibold">Unstake</span> when the lock expires.
          </p>

          <div
            className="rounded-xl p-4 flex flex-col gap-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-xs text-slate-500">Demo position</p>
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">12,500 OMNI</span>
              <span className="text-xs text-yellow-400">Locked until Jun 17, 2026</span>
            </div>
          </div>

          {txHash ? (
            <div
              className="rounded-xl p-3 text-center text-sm"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}
            >
              Unstaked! Tx: {txHash.slice(0, 10)}…{txHash.slice(-6)}
            </div>
          ) : (
            <button
              onClick={account ? handleUnstake : undefined}
              disabled={loading || !account}
              className="w-full rounded-xl py-3.5 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.1))',
                color: '#c7d2fe',
                border: '1px solid rgba(99,102,241,0.4)',
              }}
            >
              {loading ? 'Unstaking…' : !account ? 'Connect Wallet' : 'Unstake'}
            </button>
          )}
        </div>
      )}

      {error && (
        <div
          className="rounded-xl p-3 text-xs text-red-300"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {error}
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import {
  ShieldOff,
  ShieldCheck,
  Settings,
  Activity,
  DollarSign,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Copy,
  ExternalLink,
} from 'lucide-react'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ProtocolStats } from '@/components/admin/ProtocolStats'
import { FeeWithdrawModal } from '@/components/admin/FeeWithdrawModal'
import {
  fetchProtocolConfig,
  fetchTreasuryBalances,
  buildSetFeeBpsTx,
  buildSetFeeRecipientTx,
  buildPauseTx,
  type ProtocolConfig,
  type TreasuryBalance,
  MOCK_TREASURY_BALANCES,
  MOCK_PROTOCOL_CONFIG,
} from '@/lib/admin'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_ADDRESS = (process.env.NEXT_PUBLIC_ADMIN_ADDRESS ?? '').toLowerCase()
/** Object ID of the AdminCap held by the admin wallet (env-configurable) */
const ADMIN_CAP_ID = process.env.NEXT_PUBLIC_ADMIN_CAP_ID ?? '0x0'

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          color: '#6366F1',
        }}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-base font-semibold text-[#E2E8F0]">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

function TxFeedback({
  loading,
  error,
  digest,
}: {
  loading: boolean
  error: string | null
  digest: string | null
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#6366F1]">
        <Loader2 size={13} className="animate-spin" />
        Sending transaction…
      </div>
    )
  }
  if (error) {
    return (
      <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
        {error}
      </p>
    )
  }
  if (digest) {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-400">
        <CheckCircle2 size={13} />
        <span>Success —</span>
        <a
          href={`https://suiscan.xyz/mainnet/tx/${digest}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono hover:underline flex items-center gap-1"
        >
          {digest.slice(0, 12)}…
          <ExternalLink size={11} />
        </a>
      </div>
    )
  }
  return null
}

// ─── Access Denied card ───────────────────────────────────────────────────────

function AccessDenied({ address }: { address?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#060611' }}>
      <div
        className="relative overflow-hidden rounded-2xl p-8 max-w-sm w-full flex flex-col items-center gap-5 text-center"
        style={{
          background: 'linear-gradient(135deg, #1a0a0a 0%, #0D0D1F 100%)',
          border: '1px solid rgba(239,68,68,0.3)',
          boxShadow: '0 0 60px rgba(239,68,68,0.08)',
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <ShieldOff size={28} className="text-rose-400" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-[#E2E8F0]">Access Denied</h1>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
            {address
              ? 'Your wallet is not authorized to access the admin dashboard.'
              : 'Connect your admin wallet to access this page.'}
          </p>
          {address && (
            <p className="text-xs font-mono text-rose-400 mt-3 bg-rose-500/10 rounded-lg px-3 py-2 break-all">
              {address}
            </p>
          )}
        </div>

        <div
          className="w-full rounded-xl px-4 py-3 text-xs text-slate-400 flex items-start gap-2"
          style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
          <span>
            Set <span className="font-mono text-[#E2E8F0]">NEXT_PUBLIC_ADMIN_ADDRESS</span> in your
            environment and connect the matching wallet.
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()

  // ── Auth check ────────────────────────────────────────────────────────────
  const connectedAddress = account?.address?.toLowerCase() ?? ''
  const isAdmin =
    ADMIN_ADDRESS !== '' && connectedAddress !== '' && connectedAddress === ADMIN_ADDRESS

  // ── Protocol state ────────────────────────────────────────────────────────
  const [config, setConfig] = useState<ProtocolConfig>(MOCK_PROTOCOL_CONFIG)
  const [balances, setBalances] = useState<TreasuryBalance[]>(MOCK_TREASURY_BALANCES)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  // ── UI state ──────────────────────────────────────────────────────────────
  const [feeBps, setFeeBps] = useState(config.feeBps)
  const [feeRecipientInput, setFeeRecipientInput] = useState(config.feeRecipient)
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  // Tx feedback state per action
  const [setFeeTx, setSetFeeTx] = useState<{ loading: boolean; error: string | null; digest: string | null }>({
    loading: false,
    error: null,
    digest: null,
  })
  const [setRecipientTx, setSetRecipientTx] = useState<{ loading: boolean; error: string | null; digest: string | null }>({
    loading: false,
    error: null,
    digest: null,
  })
  const [pauseTx, setPauseTx] = useState<{ loading: boolean; error: string | null; digest: string | null }>({
    loading: false,
    error: null,
    digest: null,
  })

  // ── Data fetching ─────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setDataLoading(true)
    setDataError(null)
    try {
      const [cfg, bals] = await Promise.all([
        fetchProtocolConfig(client),
        fetchTreasuryBalances(client),
      ])
      setConfig(cfg)
      setFeeBps(cfg.feeBps)
      setFeeRecipientInput(cfg.feeRecipient)
      setBalances(bals)
      setLastRefreshed(new Date())
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Failed to load protocol data')
    } finally {
      setDataLoading(false)
    }
  }, [client])

  useEffect(() => {
    if (isAdmin) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSetFee = useCallback(() => {
    setSetFeeTx({ loading: true, error: null, digest: null })
    const tx = buildSetFeeBpsTx(feeBps, ADMIN_CAP_ID)
    signAndExecute(
      // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
      { transaction: tx },
      {
        onSuccess: (r) => {
          setSetFeeTx({ loading: false, error: null, digest: r.digest })
          setConfig((prev) => ({ ...prev, feeBps }))
        },
        onError: (e) => setSetFeeTx({ loading: false, error: (e as Error).message, digest: null }),
      },
    )
  }, [feeBps, signAndExecute])

  const handleSetRecipient = useCallback(() => {
    if (!feeRecipientInput.startsWith('0x')) return
    setSetRecipientTx({ loading: true, error: null, digest: null })
    const tx = buildSetFeeRecipientTx(feeRecipientInput, ADMIN_CAP_ID)
    signAndExecute(
      // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
      { transaction: tx },
      {
        onSuccess: (r) => {
          setSetRecipientTx({ loading: false, error: null, digest: r.digest })
          setConfig((prev) => ({ ...prev, feeRecipient: feeRecipientInput }))
        },
        onError: (e) => setSetRecipientTx({ loading: false, error: (e as Error).message, digest: null }),
      },
    )
  }, [feeRecipientInput, signAndExecute])

  const handleTogglePause = useCallback(
    (pause: boolean) => {
      setPauseTx({ loading: true, error: null, digest: null })
      setPauseDialogOpen(false)
      const tx = buildPauseTx(ADMIN_CAP_ID, pause)
      signAndExecute(
        // @ts-expect-error version skew between @mysten/sui and dapp-kit bundled copy
        { transaction: tx },
        {
          onSuccess: (r) => {
            setPauseTx({ loading: false, error: null, digest: r.digest })
            setConfig((prev) => ({ ...prev, paused: pause }))
          },
          onError: (e) => setPauseTx({ loading: false, error: (e as Error).message, digest: null }),
        },
      )
    },
    [signAndExecute],
  )

  // ── Guard: not connected ──────────────────────────────────────────────────
  if (!account) {
    return <AccessDenied />
  }

  // ── Guard: wrong address ──────────────────────────────────────────────────
  if (!isAdmin) {
    return <AccessDenied address={account.address} />
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const isDeployed =
    !!process.env.NEXT_PUBLIC_CONFIG_OBJECT_ID &&
    process.env.NEXT_PUBLIC_CONFIG_OBJECT_ID !== '0x0'

  return (
    <div
      className="min-h-screen px-4 py-8 md:px-8"
      style={{ background: '#060611' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-8">

        {/* Not-deployed banner */}
        {!isDeployed && (
          <div className="mb-6 p-4 rounded-xl border border-orange-500/30 bg-orange-500/10">
            <p className="text-orange-300 font-medium">⚠️ Contracts not deployed</p>
            <p className="text-orange-400/70 text-sm mt-1">
              Run <code className="bg-black/30 px-1 rounded">contracts/deploy.sh</code> and set
              environment variables to activate live data and admin functions.
            </p>
          </div>
        )}

        {/* Page header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(6,182,212,0.15) 100%)',
                border: '1px solid rgba(99,102,241,0.4)',
              }}
            >
              <ShieldCheck size={20} className="text-[#6366F1]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#E2E8F0]">Protocol Admin</h1>
              <p className="text-xs text-slate-500">OmniWeave · Mainnet</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Protocol status badge */}
            <div
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border',
                config.paused
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  config.paused ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse',
                )}
              />
              {config.paused ? 'Protocol Paused' : 'Protocol Active'}
            </div>

            {/* Refresh */}
            <button
              onClick={loadData}
              disabled={dataLoading}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#E2E8F0] transition-colors px-3 py-1.5 rounded-lg border border-[#2A2A5A] hover:border-[#3A3A7A]"
            >
              <RefreshCw size={12} className={cn(dataLoading && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>

        {/* Data error */}
        {dataError && (
          <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <AlertTriangle size={15} />
            {dataError}
          </div>
        )}

        {/* Last refreshed */}
        <p className="text-xs text-slate-600 -mt-5">
          Data as of {lastRefreshed.toLocaleTimeString()}
        </p>

        {/* ── Section 1: Protocol Health + Stats ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-[#6366F1]" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">
              Protocol Health &amp; Revenue
            </h2>
          </div>
          <ProtocolStats config={config} treasuryBalances={balances} />
        </section>

        {/* ── Section 2: Admin Actions ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Settings size={15} className="text-[#06B6D4]" />
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">
              Admin Actions
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* ── Fee BPS ── */}
            <Card variant="elevated" padding="md">
              <SectionHeader
                icon={<DollarSign size={16} />}
                title="Set Fee BPS"
                description="Adjust the protocol swap fee (max 100 bps = 1%)"
              />
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Current fee</span>
                    <span className="font-mono text-[#E2E8F0] font-semibold">
                      {config.feeBps} bps ({(config.feeBps / 100).toFixed(2)}%)
                    </span>
                  </div>

                  {/* Slider */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>1 bps</span>
                      <span
                        className="text-lg font-bold"
                        style={{
                          background: 'linear-gradient(90deg, #6366F1, #06B6D4)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {feeBps} bps
                      </span>
                      <span>100 bps</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      step={1}
                      value={feeBps}
                      onChange={(e) => {
                        setSetFeeTx({ loading: false, error: null, digest: null })
                        setFeeBps(Number(e.target.value))
                      }}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(90deg, #6366F1 ${feeBps}%, #2A2A5A ${feeBps}%)`,
                        accentColor: '#6366F1',
                      }}
                    />
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>0.01%</span>
                      <span>{(feeBps / 100).toFixed(2)}%</span>
                      <span>1.00%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSetFee}
                      loading={setFeeTx.loading}
                      disabled={feeBps === config.feeBps || setFeeTx.loading}
                      className="shrink-0"
                    >
                      Confirm Fee
                    </Button>
                    <TxFeedback
                      loading={setFeeTx.loading}
                      error={setFeeTx.error}
                      digest={setFeeTx.digest}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Fee Recipient ── */}
            <Card variant="elevated" padding="md">
              <SectionHeader
                icon={<ExternalLink size={16} />}
                title="Set Fee Recipient"
                description="Update the address that receives withdrawn fees"
              />
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Current:</span>
                    <span className="font-mono text-[#06B6D4] truncate">{config.feeRecipient}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(config.feeRecipient)}
                      className="text-slate-500 hover:text-[#E2E8F0] transition-colors shrink-0"
                      title="Copy address"
                    >
                      <Copy size={12} />
                    </button>
                  </div>

                  <Input
                    label="New Recipient Address"
                    value={feeRecipientInput}
                    onChange={(e) => {
                      setSetRecipientTx({ loading: false, error: null, digest: null })
                      setFeeRecipientInput(e.target.value)
                    }}
                    placeholder="0x..."
                    error={
                      feeRecipientInput && !feeRecipientInput.startsWith('0x')
                        ? 'Address must start with 0x'
                        : undefined
                    }
                  />

                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSetRecipient}
                      loading={setRecipientTx.loading}
                      disabled={
                        !feeRecipientInput.startsWith('0x') ||
                        feeRecipientInput === config.feeRecipient ||
                        setRecipientTx.loading
                      }
                      className="shrink-0"
                    >
                      Update Recipient
                    </Button>
                    <TxFeedback
                      loading={setRecipientTx.loading}
                      error={setRecipientTx.error}
                      digest={setRecipientTx.digest}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Pause / Unpause ── */}
            <Card
              variant="elevated"
              padding="md"
              className={cn(config.paused && 'border-rose-500/20')}
            >
              <SectionHeader
                icon={config.paused ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                title={config.paused ? 'Unpause Protocol' : 'Pause Protocol'}
                description={
                  config.paused
                    ? 'Resume swap processing across all pools'
                    : 'Halt all swap entry-points immediately'
                }
              />
              <CardContent>
                <div className="flex flex-col gap-4">
                  {/* Status indicator */}
                  <div
                    className={cn(
                      'rounded-xl px-4 py-3 flex items-center gap-3 text-sm',
                      config.paused
                        ? 'bg-rose-500/10 border border-rose-500/25'
                        : 'bg-emerald-500/10 border border-emerald-500/25',
                    )}
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        config.paused ? 'bg-rose-400' : 'bg-emerald-400 animate-pulse',
                      )}
                    />
                    <span className={config.paused ? 'text-rose-300' : 'text-emerald-300'}>
                      {config.paused
                        ? 'Protocol is PAUSED — all swaps are blocked'
                        : 'Protocol is ACTIVE — swaps are processing normally'}
                    </span>
                  </div>

                  {pauseDialogOpen ? (
                    <div className="flex flex-col gap-3">
                      <div
                        className="rounded-xl p-3 flex items-start gap-2 text-xs"
                        style={{
                          background: 'rgba(245,158,11,0.07)',
                          border: '1px solid rgba(245,158,11,0.25)',
                        }}
                      >
                        <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                        <span className="text-slate-300 leading-relaxed">
                          {config.paused
                            ? 'This will resume all swap operations. Confirm to proceed.'
                            : 'This will immediately block all swaps. Users will receive an error until unpaused. Confirm to proceed.'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setPauseDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant={config.paused ? 'primary' : 'danger'}
                          size="sm"
                          onClick={() => handleTogglePause(!config.paused)}
                          loading={pauseTx.loading}
                        >
                          {config.paused ? 'Confirm Unpause' : 'Confirm Pause'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button
                        variant={config.paused ? 'primary' : 'danger'}
                        size="sm"
                        onClick={() => setPauseDialogOpen(true)}
                        leftIcon={
                          config.paused ? <PlayCircle size={15} /> : <PauseCircle size={15} />
                        }
                        className="shrink-0"
                      >
                        {config.paused ? 'Unpause Protocol' : 'Pause Protocol'}
                      </Button>
                      <TxFeedback
                        loading={pauseTx.loading}
                        error={pauseTx.error}
                        digest={pauseTx.digest}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── Withdraw Fees ── */}
            <Card variant="elevated" padding="md">
              <SectionHeader
                icon={<DollarSign size={16} />}
                title="Withdraw Fees"
                description="Transfer accumulated fees from the treasury to a destination"
              />
              <CardContent>
                <div className="flex flex-col gap-4">
                  {/* Treasury summary */}
                  <div className="grid grid-cols-2 gap-2">
                    {balances.slice(0, 4).map((bal) => (
                      <div
                        key={bal.coinType}
                        className="rounded-xl px-3 py-2 flex items-center justify-between"
                        style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
                      >
                        <span className="text-xs font-semibold text-[#E2E8F0]">{bal.symbol}</span>
                        <span className="text-xs font-mono text-slate-400">
                          {(Number(bal.rawBalance) / 10 ** bal.decimals).toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="accent"
                    size="md"
                    onClick={() => setWithdrawOpen(true)}
                    leftIcon={<DollarSign size={15} />}
                  >
                    Open Withdrawal Modal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* Fee withdrawal modal */}
      <FeeWithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        treasuryBalances={balances}
        adminCapId={ADMIN_CAP_ID}
      />
    </div>
  )
}

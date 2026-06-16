'use client'

import { useState } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import type { TokenConfig, DeploymentResult } from '@/lib/tokenDeployer'

// ─── Props ────────────────────────────────────────────────────────────────────

interface DeployStepProps {
  config: TokenConfig
  source: string
  onBack: () => void
  onSuccess: (result: DeploymentResult) => void
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeployApiResponse {
  source: string
  compiledModules: string[] | null
  compilationError: string | null
  deployInstructions: string[]
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard may be blocked
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-all"
      style={{
        background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
        border: copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
        color: copied ? '#10B981' : '#64748B',
      }}
    >
      {copied ? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ─── CLI Fallback ─────────────────────────────────────────────────────────────

function CliFallback({ instructions, source, filename }: {
  instructions: string[]
  source: string
  filename: string
}) {
  function handleDownload() {
    const blob = new Blob([source], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const publishCommand = 'sui client publish --gas-budget 50000000'

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{
        background: 'rgba(251,191,36,0.05)',
        border: '1px solid rgba(251,191,36,0.2)',
      }}
    >
      <div className="flex items-start gap-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" className="flex-shrink-0 mt-0.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-amber-400">Server-side compilation unavailable</p>
          <p className="text-xs text-slate-400 mt-1">
            Deploy using the Sui CLI. Download your contract and follow the steps below.
          </p>
        </div>
      </div>

      <ol className="space-y-2">
        {instructions.map((step, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(99,102,241,0.2)', color: '#818CF8' }}
            >
              {i + 1}
            </span>
            {step.startsWith('http') ? (
              <a href={step} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
                {step}
              </a>
            ) : (
              <span>{step.replace(/^\d+\. /, '')}</span>
            )}
          </li>
        ))}
      </ol>

      {/* Publish command */}
      <div
        className="rounded-lg p-3 flex items-center justify-between gap-3"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      >
        <code className="text-sm font-mono text-emerald-400">{publishCommand}</code>
        <CopyButton text={publishCommand} />
      </div>

      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:opacity-80"
        style={{
          background: 'rgba(251,191,36,0.1)',
          border: '1px solid rgba(251,191,36,0.3)',
          color: '#FBBF24',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download {filename}
      </button>
    </div>
  )
}

// ─── DeployStep ───────────────────────────────────────────────────────────────

export function DeployStep({ config, source, onBack, onSuccess }: DeployStepProps) {
  const account = useCurrentAccount()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()

  const [status, setStatus] = useState<'idle' | 'preparing' | 'signing' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [apiResponse, setApiResponse] = useState<DeployApiResponse | null>(null)

  const moduleName = config.symbol.toLowerCase().replace(/[^a-z0-9_]/g, '_')
  const filename = `${moduleName}.move`

  async function handleDeploy() {
    if (!account) return

    setStatus('preparing')
    setErrorMsg(null)

    try {
      // Call API to get compiled modules (or fallback instructions)
      const res = await fetch('/api/deploy-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, senderAddress: account.address }),
      })

      const data = await res.json() as DeployApiResponse

      if (!res.ok) {
        const errorData = data as unknown as { error: string }
        throw new Error(errorData.error ?? 'Failed to prepare deployment')
      }

      setApiResponse(data)

      // If no compiled modules, show CLI fallback
      if (!data.compiledModules) {
        setStatus('idle')
        return
      }

      // Build publish transaction
      setStatus('signing')
      const tx = new Transaction()
      const [upgradeCap] = tx.publish({
        modules: data.compiledModules,
        dependencies: [
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000000000000000000000000000002',
        ],
      })
      tx.transferObjects([upgradeCap], account.address)

      // @ts-expect-error — signAndExecuteTransaction options typing varies across dapp-kit versions
      const result = await signAndExecute({ transaction: tx })

      const txHash = result.digest ?? ''
      const witness = config.symbol.toUpperCase().replace(/[^A-Z0-9_]/g, '_')

      // Extract objects from effects (best-effort)
      const effects = result.effects as {
        created?: Array<{ reference?: { objectId?: string }; owner?: { AddressOwner?: string } }>
      } | undefined

      let packageId = ''
      let treasuryCapId = ''
      let metadataId = ''

      if (effects?.created) {
        for (const obj of effects.created) {
          const id = obj.reference?.objectId ?? ''
          if (!packageId && id.startsWith('0x')) packageId = id
          else if (!treasuryCapId) treasuryCapId = id
          else if (!metadataId) metadataId = id
        }
      }

      onSuccess({
        packageId,
        coinType: `${packageId}::${moduleName}::${witness}`,
        treasuryCapId,
        metadataId,
        txHash,
      })
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error occurred')
    }
  }

  const isConnected = !!account

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">Deploy to Sui Mainnet</h3>
        <p className="text-sm text-slate-400 mt-1">
          Review the deployment details and sign the transaction with your wallet.
        </p>
      </div>

      {/* Summary card */}
      <div
        className="rounded-xl p-5 space-y-3"
        style={{
          background: 'rgba(99,102,241,0.07)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}
      >
        <h4 className="text-sm font-medium text-slate-400">Deployment Summary</h4>
        <div className="space-y-2">
          <Row label="Token Name" value={config.name} />
          <Row label="Symbol" value={config.symbol} mono />
          <Row label="Decimals" value={String(config.decimals)} />
          {config.description && <Row label="Description" value={config.description} />}
          {config.iconUrl && <Row label="Icon URL" value={config.iconUrl} />}
        </div>
      </div>

      {/* Gas estimate */}
      <div
        className="rounded-xl p-4 flex items-center justify-between"
        style={{
          background: 'rgba(6,182,212,0.05)',
          border: '1px solid rgba(6,182,212,0.2)',
        }}
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
            <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
          </svg>
          <span className="text-sm text-slate-300">Estimated Gas Fee</span>
        </div>
        <span className="text-sm font-semibold" style={{ color: '#06B6D4' }}>~0.05 SUI</span>
      </div>

      {/* Error */}
      {status === 'error' && errorMsg && (
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
        >
          <p className="text-sm text-red-400 flex items-start gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {errorMsg}
          </p>
        </div>
      )}

      {/* CLI fallback */}
      {apiResponse && !apiResponse.compiledModules && (
        <CliFallback
          instructions={apiResponse.deployInstructions}
          source={source}
          filename={filename}
        />
      )}

      {/* Wallet not connected */}
      {!isConnected && (
        <div
          className="rounded-xl p-4 text-center"
          style={{
            background: 'rgba(251,191,36,0.05)',
            border: '1px solid rgba(251,191,36,0.2)',
          }}
        >
          <p className="text-sm text-amber-400">Connect your wallet to deploy on-chain</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={status === 'signing' || status === 'preparing'}
          className="flex-1 rounded-xl py-3.5 text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-40"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#94A3B8',
          }}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleDeploy}
          disabled={!isConnected || status === 'signing' || status === 'preparing'}
          className="flex-grow rounded-xl py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
          }}
        >
          {status === 'preparing' && 'Preparing…'}
          {status === 'signing' && 'Waiting for signature…'}
          {(status === 'idle' || status === 'error') && 'Sign & Deploy'}
        </button>
      </div>
    </div>
  )
}

// ─── Row helper ───────────────────────────────────────────────────────────────

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
      <span className={`text-xs text-slate-300 text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

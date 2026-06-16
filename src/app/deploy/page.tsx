'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TokenConfigForm } from '@/components/deploy/TokenConfigForm'
import { ContractPreview } from '@/components/deploy/ContractPreview'
import { DeployStep } from '@/components/deploy/DeployStep'
import { DeploySuccess } from '@/components/deploy/DeploySuccess'
import { generateMoveSource } from '@/lib/tokenDeployer'
import type { TokenConfig, DeploymentResult } from '@/lib/tokenDeployer'

// ─── Step types ───────────────────────────────────────────────────────────────

type WizardStep = 0 | 1 | 2 | 3

const STEPS = [
  { label: 'Info', description: 'Token details' },
  { label: 'Review', description: 'Contract preview' },
  { label: 'Deploy', description: 'Sign & publish' },
  { label: 'Done', description: 'Success' },
]

// ─── StepIndicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: WizardStep }) {
  return (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((step, index) => {
        const done = index < current
        const active = index === current
        const stepNum = index as WizardStep

        return (
          <div key={step.label} className="flex items-center">
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300"
                style={{
                  background: done
                    ? 'linear-gradient(135deg, #6366F1, #06B6D4)'
                    : active
                    ? 'rgba(99,102,241,0.2)'
                    : 'rgba(255,255,255,0.05)',
                  border: active
                    ? '2px solid #6366F1'
                    : done
                    ? 'none'
                    : '2px solid rgba(255,255,255,0.1)',
                  color: done ? 'white' : active ? '#818CF8' : '#475569',
                  boxShadow: active ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
                }}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  stepNum + 1
                )}
              </div>
              <span
                className="text-xs font-medium hidden sm:block"
                style={{ color: active ? '#818CF8' : done ? '#6366F1' : '#475569' }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className="w-12 sm:w-20 h-0.5 mx-2 transition-all duration-500"
                style={{
                  background: index < current
                    ? 'linear-gradient(90deg, #6366F1, #06B6D4)'
                    : 'rgba(255,255,255,0.08)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── DeployPage ───────────────────────────────────────────────────────────────

export default function DeployPage() {
  const [step, setStep] = useState<WizardStep>(0)
  const [config, setConfig] = useState<Partial<TokenConfig>>({
    decimals: 9,
    initialSupply: 0,
    iconUrl: '',
    description: '',
  })
  const [source, setSource] = useState<string>('')
  const [result, setResult] = useState<DeploymentResult | null>(null)

  function handleConfigNext() {
    // Generate Move source when moving to review step
    const fullConfig = config as TokenConfig
    setSource(generateMoveSource(fullConfig))
    setStep(1)
  }

  function handleDeploySuccess(deployResult: DeploymentResult) {
    setResult(deployResult)
    setStep(3)
  }

  return (
    <main
      className="min-h-screen py-12 px-4"
      style={{ background: '#060611' }}
    >
      {/* Page header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#deploy-icon-grad)" strokeWidth="2">
              <defs>
                <linearGradient id="deploy-icon-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Token Deployer</h1>
            <p className="text-sm text-slate-400">
              Launch your Sui coin in minutes — no coding required.
            </p>
          </div>
        </div>
      </div>

      {/* Wizard card */}
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(99,102,241,0.15)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Step indicator */}
          {step < 3 && <StepIndicator current={step} />}

          {/* Step content */}
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white">Token Information</h2>
                  <p className="text-sm text-slate-400 mt-1">Configure your token&apos;s basic properties.</p>
                </div>
                <TokenConfigForm
                  config={config}
                  onChange={setConfig}
                  onNext={handleConfigNext}
                />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <ContractPreview
                  config={config as TokenConfig}
                  source={source}
                  onBack={() => setStep(0)}
                  onNext={() => setStep(2)}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <DeployStep
                  config={config as TokenConfig}
                  source={source}
                  onBack={() => setStep(1)}
                  onSuccess={handleDeploySuccess}
                />
              </motion.div>
            )}

            {step === 3 && result && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <DeploySuccess result={result} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer note */}
        {step < 3 && (
          <p className="text-center text-xs text-slate-600 mt-6">
            Generated contracts use the standard Sui Coin framework and are fully open source.
          </p>
        )}
      </div>
    </main>
  )
}

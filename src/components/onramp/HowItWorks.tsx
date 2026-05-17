'use client'

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: 1,
    title: 'Enter Amount',
    description: 'Choose how much fiat you want to spend and which token to receive.',
    detail: 'Min $10 · Max $25,000',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    number: 2,
    title: 'Select Provider',
    description: 'Compare fees and processing times. Pick the provider that suits you best.',
    detail: 'Fees from 0.99%',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    number: 3,
    title: 'Complete Checkout',
    description: 'Securely enter your payment details on the provider\'s platform. KYC is done once.',
    detail: 'KYC once · buy anytime',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    number: 4,
    title: 'Receive Tokens',
    description: 'Tokens are delivered directly to your connected Sui wallet.',
    detail: 'Avg. 5–30 min delivery',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
]

const TRUST_SIGNALS = [
  { label: 'Non-custodial', icon: '🔒' },
  { label: 'Regulated providers', icon: '✅' },
  { label: 'Bank-grade encryption', icon: '🛡️' },
  { label: '160+ countries', icon: '🌍' },
]

export function HowItWorks() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(13, 13, 31, 0.6)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
      }}
    >
      <h3 className="text-sm font-semibold text-slate-200 mb-4">How It Works</h3>

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map((step, index) => (
          <div key={step.number} className="flex gap-3">
            {/* Step number + connector */}
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(6,182,212,0.15))',
                  border: '1px solid rgba(99,102,241,0.4)',
                  color: '#818CF8',
                }}
              >
                {step.number}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className="w-px flex-1 mt-1"
                  style={{ background: 'rgba(99,102,241,0.2)', minHeight: '16px' }}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-indigo-400" style={{ opacity: 0.8 }}>
                  {step.icon}
                </span>
                <span className="text-sm font-medium text-slate-200">{step.title}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
              <span
                className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(6,182,212,0.08)',
                  color: '#06B6D4',
                  border: '1px solid rgba(6,182,212,0.2)',
                }}
              >
                {step.detail}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Trust signals */}
      <div
        className="mt-4 pt-4 grid grid-cols-2 gap-2"
        style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}
      >
        {TRUST_SIGNALS.map((signal) => (
          <div key={signal.label} className="flex items-center gap-2">
            <span className="text-sm">{signal.icon}</span>
            <span className="text-xs text-slate-400">{signal.label}</span>
          </div>
        ))}
      </div>

      {/* Payment methods */}
      <div
        className="mt-4 pt-4"
        style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}
      >
        <p className="text-xs text-slate-500 mb-2">Supported payment methods</p>
        <div className="flex flex-wrap gap-2">
          {['Visa', 'Mastercard', 'Apple Pay', 'Google Pay', 'Bank Transfer'].map((method) => (
            <span
              key={method}
              className="text-xs px-2.5 py-1 rounded-lg"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8',
              }}
            >
              {method}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

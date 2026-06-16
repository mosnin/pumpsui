'use client'

import { ONRAMP_PROVIDERS, type ProviderId } from '@/lib/onramp'

// ─── Payment method icons ──────────────────────────────────────────────────────

function PaymentIcon({ method }: { method: string }) {
  const icons: Record<string, string> = {
    card: '💳',
    bank: '🏦',
    apple_pay: '',
    google_pay: '',
    coinbase_balance: '🔵',
  }
  return <span title={method.replace('_', ' ')}>{icons[method] ?? '💳'}</span>
}

// ─── Desktop table ─────────────────────────────────────────────────────────────

function DesktopTable({ bestProvider }: { bestProvider: ProviderId }) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
            {['Provider', 'Est. Fee', 'Min / Max', 'Time', 'Payment', 'Countries'].map((col) => (
              <th
                key={col}
                className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ONRAMP_PROVIDERS.map((provider) => {
            const isBest = provider.id === bestProvider
            return (
              <tr
                key={provider.id}
                className="transition-colors"
                style={{
                  borderBottom: '1px solid rgba(99,102,241,0.08)',
                  background: isBest ? 'rgba(99,102,241,0.05)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isBest) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'
                }}
                onMouseLeave={(e) => {
                  if (!isBest) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'
                }}
              >
                {/* Provider */}
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2.5">
                    {/* Color dot as logo fallback */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{
                        background: `${provider.color}22`,
                        border: `1px solid ${provider.color}44`,
                        color: provider.color,
                      }}
                    >
                      {provider.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-200 text-sm flex items-center gap-1.5">
                        {provider.name}
                        {isBest && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                            style={{
                              background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                              color: '#fff',
                              fontSize: '10px',
                            }}
                          >
                            Best Rate
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Fee */}
                <td className="py-3.5 px-3">
                  <span
                    className="font-medium"
                    style={{ color: isBest ? '#06B6D4' : '#94a3b8' }}
                  >
                    {provider.fee}
                  </span>
                </td>

                {/* Min/Max */}
                <td className="py-3.5 px-3 text-slate-400 text-xs">
                  ${provider.minAmount} – ${provider.maxAmount.toLocaleString()}
                </td>

                {/* Time */}
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-1 text-slate-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-xs">{provider.estimatedTime}</span>
                  </div>
                </td>

                {/* Payment methods */}
                <td className="py-3.5 px-3">
                  <div className="flex gap-1">
                    {provider.paymentMethods.map((method) => (
                      <PaymentIcon key={method} method={method} />
                    ))}
                  </div>
                </td>

                {/* Countries */}
                <td className="py-3.5 px-3 text-slate-400 text-xs">
                  🌍 {provider.supportedCountries}+
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Mobile cards ─────────────────────────────────────────────────────────────

function MobileCards({ bestProvider }: { bestProvider: ProviderId }) {
  return (
    <div className="md:hidden space-y-3">
      {ONRAMP_PROVIDERS.map((provider) => {
        const isBest = provider.id === bestProvider
        return (
          <div
            key={provider.id}
            className="rounded-xl p-4"
            style={{
              background: isBest
                ? 'rgba(99,102,241,0.08)'
                : 'rgba(255,255,255,0.02)',
              border: isBest
                ? '1px solid rgba(99,102,241,0.3)'
                : '1px solid rgba(99,102,241,0.1)',
            }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    background: `${provider.color}22`,
                    border: `1px solid ${provider.color}44`,
                    color: provider.color,
                  }}
                >
                  {provider.name.charAt(0)}
                </div>
                <span className="font-semibold text-slate-200">{provider.name}</span>
              </div>
              {isBest && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                    color: '#fff',
                  }}
                >
                  Best Rate
                </span>
              )}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Fee</span>
                <div className="font-medium mt-0.5" style={{ color: isBest ? '#06B6D4' : '#94a3b8' }}>
                  {provider.fee}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Time</span>
                <div className="text-slate-300 mt-0.5">{provider.estimatedTime}</div>
              </div>
              <div>
                <span className="text-slate-500">Limits</span>
                <div className="text-slate-400 mt-0.5">
                  ${provider.minAmount}–${provider.maxAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Countries</span>
                <div className="text-slate-400 mt-0.5">🌍 {provider.supportedCountries}+</div>
              </div>
            </div>

            {/* Payment methods */}
            <div className="flex gap-1 mt-3">
              {provider.paymentMethods.map((method) => (
                <PaymentIcon key={method} method={method} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ProviderComparisonTableProps {
  bestProvider?: ProviderId
}

export function ProviderComparisonTable({
  bestProvider = 'transak',
}: ProviderComparisonTableProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(13, 13, 31, 0.6)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Provider Comparison</h3>
        <span className="text-xs text-slate-500">
          Best rate:{' '}
          <span className="text-cyan-400 font-medium">
            {ONRAMP_PROVIDERS.find((p) => p.id === bestProvider)?.name}
          </span>
        </span>
      </div>

      <DesktopTable bestProvider={bestProvider} />
      <MobileCards bestProvider={bestProvider} />
    </div>
  )
}

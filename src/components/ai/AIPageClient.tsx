'use client'

import { AIChat } from './AIChat'

const SUGGESTED_PROMPTS = [
  { icon: '💱', label: 'Swap tokens', prompt: 'Swap 100 SUI to USDC' },
  { icon: '📊', label: 'Portfolio analysis', prompt: 'Analyze my portfolio and suggest rebalancing' },
  { icon: '📈', label: 'Market prices', prompt: "What's the current price of SUI and USDC?" },
  { icon: '🔄', label: 'DCA strategy', prompt: 'Set up a DCA strategy for SUI' },
  { icon: '💡', label: 'Best APY', prompt: 'What are the best APY opportunities on Sui right now?' },
  { icon: '🛡️', label: 'Slippage guide', prompt: 'Explain slippage and how to minimize it' },
]

function SuggestedPromptButton({ icon, label, prompt }: { icon: string; label: string; prompt: string }) {
  const handleClick = () => {
    // Dispatch a custom event that AIChat can listen to
    window.dispatchEvent(new CustomEvent('ai-prompt', { detail: prompt }))
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5 group"
    >
      <span className="mr-2">{icon}</span>
      <span className="text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
    </button>
  )
}

function Sidebar() {
  return (
    <aside
      className="hidden lg:flex flex-col w-64 flex-shrink-0 p-4 gap-3"
      style={{ borderRight: '1px solid rgba(99,102,241,0.15)' }}
    >
      <div className="mb-2">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Suggested Prompts
        </h2>
        <div className="space-y-1.5">
          {SUGGESTED_PROMPTS.map(({ icon, label, prompt }) => (
            <SuggestedPromptButton key={prompt} icon={icon} label={label} prompt={prompt} />
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
        <p className="text-xs text-slate-600 leading-relaxed">
          OmniWeave AI uses Claude to provide real-time DeFi insights. Always verify trades before
          executing.
        </p>
      </div>
    </aside>
  )
}

export function AIPageClient() {
  return (
    <div className="flex h-[calc(100vh-64px-40px)]" style={{ background: '#060611' }}>
      {/* Left sidebar */}
      <Sidebar />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page header */}
        <div
          className="px-6 py-4 flex-shrink-0 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}
        >
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}
              >
                ✦
              </span>
              OmniWeave AI
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Powered by Claude &mdash; Natural language DeFi on Sui
            </p>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{
              background: 'rgba(99,102,241,0.15)',
              color: '#a5b4fc',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            Beta
          </span>
        </div>

        {/* Chat */}
        <div className="flex-1 min-h-0">
          <AIChat fullPage />
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { useAIChat, Message } from '@/hooks/useAIChat'

// ─── Quick action chips ──────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  "What's SUI price?",
  'Swap SUI→USDC',
  'Explain DCA',
  'Best APY?',
]

// ─── Parse swap info from AI response ───────────────────────────────────────

function parseSwapFromContent(content: string): { tokenIn?: string; tokenOut?: string } | null {
  const match = content.match(/swap(?:ping)?\s+[\d.,]+\s+(\w+)\s*(?:→|->|to)\s*(\w+)/i)
  if (match) return { tokenIn: match[1].toUpperCase(), tokenOut: match[2].toUpperCase() }
  return null
}

// ─── Message bubble ──────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const swap = !isUser ? parseSwapFromContent(message.content) : null

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full mr-2 mt-0.5 flex items-center justify-center text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}>
          ✦
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-tr-sm text-white'
            : 'rounded-tl-sm text-slate-200'
        }`}
        style={
          isUser
            ? { background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }
            : {
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
              }
        }
      >
        {message.content ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <span className="text-slate-500 italic text-xs">Thinking…</span>
        )}

        {/* Streaming cursor */}
        {message.isStreaming && message.content && (
          <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 align-middle animate-pulse" />
        )}

        {/* Go to Swap button */}
        {swap && swap.tokenIn && swap.tokenOut && !message.isStreaming && (
          <a
            href={`/swap?from=${swap.tokenIn}&to=${swap.tokenOut}`}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 w-fit transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', color: '#fff' }}
          >
            Go to Swap →
          </a>
        )}
      </div>
    </div>
  )
}

// ─── AIChat component ────────────────────────────────────────────────────────

interface AIChatProps {
  onClose?: () => void
  fullPage?: boolean
}

export function AIChat({ onClose, fullPage = false }: AIChatProps) {
  const { messages, sendMessage, loading, clearChat } = useAIChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'rgba(6,6,17,0.98)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{
          borderBottom: '1px solid rgba(99,102,241,0.2)',
          background: 'rgba(99,102,241,0.06)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}
          >
            ✦
          </div>
          <div>
            <p className="text-sm font-semibold text-white">OmniWeave AI</p>
            <p className="text-xs text-slate-500">Powered by Claude</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded hover:bg-white/5"
          >
            Clear
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded hover:bg-white/5"
              aria-label="Close AI chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick action chips */}
      <div
        className="px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0"
        style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}
      >
        {QUICK_ACTIONS.map(action => (
          <button
            key={action}
            onClick={() => sendMessage(action)}
            disabled={loading}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40"
            style={{
              borderColor: 'rgba(99,102,241,0.35)',
              color: '#a5b4fc',
              background: 'rgba(99,102,241,0.08)',
            }}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div
        className="px-4 py-3 flex gap-2 items-end flex-shrink-0"
        style={{ borderTop: '1px solid rgba(99,102,241,0.15)' }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask OmniWeave AI anything…"
          rows={1}
          className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
          style={{ maxHeight: '120px' }}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}
          aria-label="Send message"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

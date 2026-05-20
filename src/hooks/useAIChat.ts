'use client'
import { useState, useCallback } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export function useAIChat() {
  const account = useCurrentAccount()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hey! I'm OmniWeave AI. Ask me to swap tokens, analyze prices, or explain any DeFi concept. What can I help you trade today?",
      timestamp: new Date(),
    },
  ])
  const [loading, setLoading] = useState(false)

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true }])

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context: { address: account?.address },
        }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const { text } = JSON.parse(data) as { text: string }
            fullText += text
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m))
          } catch { /* ignore */ }
        }
      }
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m))
    } catch {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: 'Sorry, I had trouble connecting. Please try again.', isStreaming: false } : m))
    } finally {
      setLoading(false)
    }
  }, [messages, account])

  const clearChat = useCallback(() => {
    setMessages([{ id: '0', role: 'assistant', content: "Fresh start! What would you like to trade?", timestamp: new Date() }])
  }, [])

  return { messages, sendMessage, loading, clearChat }
}

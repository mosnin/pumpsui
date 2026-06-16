import type { Metadata } from 'next'
import { AIPageClient } from '@/components/ai/AIPageClient'

export const metadata: Metadata = {
  title: 'OmniWeave AI — Powered by Claude',
  description: 'Your intelligent DeFi trading assistant. Natural language swaps, portfolio analysis, and smart market insights — all powered by Claude AI.',
}

export default function AIPage() {
  return <AIPageClient />
}

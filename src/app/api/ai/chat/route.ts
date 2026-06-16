import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are OmniWeave AI, an expert DeFi trading assistant for the Sui blockchain.

You help users:
1. Understand swap quotes and routes (call get_quote tool when user wants to swap)
2. Analyze their portfolio and suggest rebalancing
3. Explain DeFi concepts in plain English
4. Identify market opportunities
5. Set up DCA/TWAP strategies

Available tokens on Sui: SUI, USDC, USDT, WETH, CETUS, TURBOS, DEEP (DeepBook), FLX (FlowX)

When a user says things like:
- "swap 100 SUI to USDC" → call get_quote with their intent
- "what's SUI price?" → call get_price
- "analyze my portfolio" → provide analysis based on context
- "set up a DCA" → explain DCA and guide them to /dca

Always be concise, use numbers, be direct. Never say "I cannot" — say what you CAN do.
Protocol fee: 0.05% (5 bps). Always mention this when quoting.`

export async function POST(request: NextRequest) {
  const { messages, context } = await request.json() as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    context?: { address?: string; portfolio?: unknown }
  }

  // Stream the response using Anthropic SDK streaming
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT + (context?.address ? `\nUser wallet: ${context.address}` : ''),
    messages,
    tools: [
      {
        name: 'get_quote',
        description: 'Get a swap quote for a token pair',
        input_schema: {
          type: 'object' as const,
          properties: {
            tokenIn: { type: 'string', description: 'Input token symbol (e.g. SUI)' },
            tokenOut: { type: 'string', description: 'Output token symbol (e.g. USDC)' },
            amountIn: { type: 'number', description: 'Amount to swap (human readable)' },
          },
          required: ['tokenIn', 'tokenOut', 'amountIn'],
        },
      },
      {
        name: 'get_price',
        description: 'Get current price of a token',
        input_schema: {
          type: 'object' as const,
          properties: {
            token: { type: 'string', description: 'Token symbol' },
          },
          required: ['token'],
        },
      },
    ],
  })

  // Return SSE stream
  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
          }
          if (chunk.type === 'message_stop') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}

import type { Metadata } from 'next'
import type React from 'react'
import { CodeBlock } from '@/components/docs/CodeBlock'
import { TryItWidget } from '@/components/docs/TryItWidget'

export const metadata: Metadata = {
  title: 'Developer API | OmniWeave',
  description:
    "Integrate OmniWeave's DEX aggregation routing layer into your protocol. Real-time quotes, live token prices, pool data, and cross-DEX routing across Sui mainnet.",
}

// ---------------------------------------------------------------------------
// Code examples
// ---------------------------------------------------------------------------

const EXAMPLES = {
  curl_quote: `curl "https://omniweave.xyz/api/v1/quote?\\
  tokenIn=0x2::sui::SUI&\\
  tokenOut=0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN&\\
  amountIn=1000000000&\\
  slippage=50" \\
  -H "x-api-key: ow_your_api_key"`,

  ts_quote: `import { OmniWeaveClient } from '@omniweave/sdk' // coming soon

// Or call the REST API directly:
const SUI_TYPE = '0x2::sui::SUI'
const USDC_TYPE = '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN'

async function getSwapQuote() {
  const response = await fetch(
    \`https://omniweave.xyz/api/v1/quote?\${new URLSearchParams({
      tokenIn: SUI_TYPE,
      tokenOut: USDC_TYPE,
      amountIn: '1000000000',  // 1 SUI (9 decimals)
      slippage: '50',           // 0.5% slippage
    })}\`,
    {
      headers: {
        'x-api-key': process.env.OMNIWEAVE_API_KEY!,
      },
    }
  )

  const data = await response.json()

  console.log('Output amount:', data.quote.outputAmount)
  console.log('Min amount out:', data.minAmountOut)
  console.log('Route type:', data.routeDetails.type)
  console.log('DEX breakdown:', data.dexBreakdown)
  console.log('Gas estimate:', data.gasEstimate.totalSui, 'SUI')
}`,

  py_quote: `import httpx

OMNIWEAVE_BASE = "https://omniweave.xyz/api/v1"
API_KEY = "ow_your_api_key"  # optional — raises rate limit to 1000 req/min

SUI_TYPE = "0x2::sui::SUI"
USDC_TYPE = "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN"

def get_quote(amount_in: int, slippage_bps: int = 50):
    params = {
        "tokenIn": SUI_TYPE,
        "tokenOut": USDC_TYPE,
        "amountIn": str(amount_in),
        "slippage": str(slippage_bps),
    }
    headers = {"x-api-key": API_KEY}

    with httpx.Client() as client:
        r = client.get(f"{OMNIWEAVE_BASE}/quote", params=params, headers=headers)
        r.raise_for_status()
        data = r.json()

    print(f"Output: {data['quote']['outputAmount']} USDC base units")
    print(f"Min out: {data['minAmountOut']}")
    print(f"Route: {data['routeDetails']['type']}")
    print(f"Gas: {data['gasEstimate']['totalSui']} SUI")
    return data

if __name__ == "__main__":
    get_quote(1_000_000_000)  # 1 SUI`,

  ts_price: `// Fetch prices for multiple tokens in one call
const response = await fetch(
  'https://omniweave.xyz/api/v1/price?tokens=SUI,USDC,ETH,BTC',
  { headers: { 'x-api-key': process.env.OMNIWEAVE_API_KEY! } }
)

const { prices } = await response.json()

// prices.SUI = { priceUsd: 1.84, priceChange24h: 3.2, source: 'coingecko+pyth', ... }
for (const [symbol, data] of Object.entries(prices)) {
  console.log(\`\${symbol}: $\${data.priceUsd} (\${data.priceChange24h > 0 ? '+' : ''}\${data.priceChange24h?.toFixed(2)}%)\`)
}`,

  curl_pools: `# Get all pools for a SUI/USDC pair
curl "https://omniweave.xyz/api/v1/pools?\\
  tokenA=0x2::sui::SUI&\\
  tokenB=0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN&\\
  dex=cetus" \\
  -H "x-api-key: ow_your_api_key"`,

  response_quote: `{
  "quote": {
    "useSplit": true,
    "outputAmount": "1842930",
    "priceImpact": 0.08,
    "executionPrice": 1.84293,
    "midPrice": 1.84201,
    "bestRoute": {
      "inputAmount": "1000000000",
      "outputAmount": "1841100",
      "priceImpact": 0.12,
      "gasEstimate": "3200000",
      "path": [
        {
          "dexId": "cetus",
          "poolId": "0xb8d7d9e66a60c239e7a60110efcf8de6c705580ed924d0dde141f4a0e2c90105",
          "tokenIn": "0x2::sui::SUI",
          "tokenOut": "0x5d4b...::coin::COIN",
          "amountIn": "1000000000",
          "amountOut": "1841100",
          "fee": 25
        }
      ]
    },
    "bestSplitRoute": {
      "totalOutput": "1842930",
      "priceImpact": 0.08,
      "routes": [
        { "portionBps": 6000, "inputAmount": "600000000", "outputAmount": "1106100", "dexId": "cetus" },
        { "portionBps": 4000, "inputAmount": "400000000", "outputAmount": "736830", "dexId": "turbos" }
      ]
    }
  },
  "minAmountOut": "1833715",
  "slippageBps": 50,
  "fee": {
    "bps": 5,
    "amountIn": "500000",
    "amountInAfterFee": "999500000"
  },
  "routeDetails": {
    "type": "split",
    "portions": [
      {
        "portionBps": 6000,
        "portionPct": "60.0",
        "dex": "cetus",
        "hops": 1
      },
      {
        "portionBps": 4000,
        "portionPct": "40.0",
        "dex": "turbos",
        "hops": 1
      }
    ]
  },
  "gasEstimate": {
    "totalMist": "7200000",
    "totalSui": "0.007200"
  },
  "dexBreakdown": [
    { "dex": "cetus", "portionBps": 6000, "portionPct": "60.0" },
    { "dex": "turbos", "portionBps": 4000, "portionPct": "40.0" }
  ],
  "executedAt": "2026-05-17T14:32:00.000Z"
}`,

  response_price: `{
  "prices": {
    "SUI": {
      "symbol": "SUI",
      "priceUsd": 1.842930,
      "priceChange24h": 3.21,
      "confidence": 0.0012,
      "source": "coingecko+pyth",
      "publishTime": "2026-05-17T14:32:00.000Z"
    },
    "USDC": {
      "symbol": "USDC",
      "priceUsd": 0.9998,
      "priceChange24h": -0.01,
      "confidence": 0.00001,
      "source": "coingecko+pyth",
      "publishTime": "2026-05-17T14:32:00.000Z"
    },
    "ETH": {
      "symbol": "ETH",
      "priceUsd": 3412.84,
      "priceChange24h": 1.74,
      "confidence": 0.42,
      "source": "coingecko+pyth",
      "publishTime": "2026-05-17T14:32:00.000Z"
    }
  },
  "updatedAt": "2026-05-17T14:32:00.500Z"
}`,

  response_stats: `{
  "totalVolumeUSD": 284920411.72,
  "volume24hUSD": 1842930.15,
  "volume7dUSD": 12304887.44,
  "volume30dUSD": 47820110.80,
  "totalSwaps": 2847193,
  "uniqueUsers": 41208,
  "feesCollectedUSD": 142460.21,
  "fees24hUSD": 921.47,
  "supportedDEXes": ["cetus", "turbos", "deepbook", "aftermath", "flowx", "kriya"],
  "supportedBridges": ["wormhole", "layerzero", "axelar"],
  "feeBps": 5,
  "chain": "sui",
  "network": "mainnet",
  "dataSource": "estimated",
  "updatedAt": "2026-05-17T14:32:00.000Z"
}`,
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({
  id,
  number,
  title,
  subtitle,
}: {
  id: string
  number: string
  title: string
  subtitle?: string
}) {
  return (
    <div id={id} className="flex items-start gap-4 scroll-mt-24">
      <span
        className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))',
          border: '1px solid rgba(99,102,241,0.3)',
          color: '#818CF8',
        }}
      >
        {number}
      </span>
      <div>
        <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
        {subtitle && <p className="text-slate-400 mt-1 text-sm">{subtitle}</p>}
      </div>
    </div>
  )
}

function ParamTable({
  params,
}: {
  params: Array<{
    name: string
    type: string
    required: boolean
    default?: string
    description: string
  }>
}) {
  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'rgba(99,102,241,0.07)', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
            <th className="text-left px-4 py-3 font-semibold text-slate-300">Parameter</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-300">Type</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-300">Required</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-300">Default</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-300">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr
              key={p.name}
              style={{
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <td className="px-4 py-3">
                <code className="font-mono text-indigo-300">{p.name}</code>
              </td>
              <td className="px-4 py-3">
                <code className="font-mono text-cyan-400 text-xs">{p.type}</code>
              </td>
              <td className="px-4 py-3">
                {p.required ? (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">
                    required
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">optional</span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.default ?? '—'}</td>
              <td className="px-4 py-3 text-slate-400">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EndpointBadge({ method, path }: { method: string; path: string }) {
  const colors: Record<string, string> = {
    GET: '#10B981',
    POST: '#6366F1',
    PUT: '#F59E0B',
    DELETE: '#EF4444',
  }
  const color = colors[method] ?? '#94A3B8'

  return (
    <div
      className="inline-flex items-center gap-3 rounded-xl px-4 py-3 font-mono text-sm"
      style={{
        background: 'rgba(13,13,31,0.8)',
        border: `1px solid ${color}30`,
      }}
    >
      <span
        className="rounded-md px-2 py-0.5 text-xs font-bold"
        style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
      >
        {method}
      </span>
      <span className="text-slate-300">{path}</span>
    </div>
  )
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'rgba(99,102,241,0.05)',
        border: '1px solid rgba(99,102,241,0.2)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: '#818CF8' }}>{icon}</span>
        <h4 className="font-semibold text-slate-200">{title}</h4>
      </div>
      <div className="text-sm text-slate-400 leading-relaxed">{children}</div>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="block text-sm text-slate-400 hover:text-indigo-300 transition-colors duration-150 py-0.5"
    >
      {children}
    </a>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DocsPage() {
  return (
    <div className="min-h-screen" style={{ background: '#060611' }}>
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
          borderBottom: '1px solid rgba(99,102,241,0.15)',
        }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold mb-6"
            style={{
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#818CF8',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            API v1 · Sui Mainnet
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-4 tracking-tight">
            OmniWeave{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Developer API
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mb-8">
            Embed OmniWeave&apos;s routing engine in your protocol. Get best-price quotes, live
            token prices, and pool data from all major Sui DEXes in a single REST call.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="#endpoints"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #06B6D4)',
                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
              }}
            >
              Browse Endpoints
              <ArrowDownIcon />
            </a>
            <a
              href="#authentication"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#CBD5E1',
              }}
            >
              Get API Key
            </a>
          </div>

          {/* Quick stats row */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'DEXes Integrated', value: '6' },
              { label: 'Request / min (free)', value: '100' },
              { label: 'Request / min (key)', value: '1,000' },
              { label: 'Price Cache TTL', value: '15s' },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(13,13,31,0.8)',
                  border: '1px solid rgba(99,102,241,0.15)',
                }}
              >
                <div className="text-2xl font-bold text-slate-100 mb-1">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex gap-12">
          {/* Sidebar navigation (sticky, desktop only) */}
          <aside className="hidden xl:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <nav className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                  On this page
                </p>
                <NavLink href="#overview">Overview</NavLink>
                <NavLink href="#authentication">Authentication</NavLink>
                <NavLink href="#rate-limits">Rate Limits</NavLink>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-4 mb-3">
                  Endpoints
                </p>
                <NavLink href="#endpoint-quote">GET /quote</NavLink>
                <NavLink href="#endpoint-price">GET /price</NavLink>
                <NavLink href="#endpoint-tokens">GET /tokens</NavLink>
                <NavLink href="#endpoint-pools">GET /pools</NavLink>
                <NavLink href="#endpoint-stats">GET /stats</NavLink>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-4 mb-3">
                  Resources
                </p>
                <NavLink href="#code-examples">Code Examples</NavLink>
                <NavLink href="#sdks">SDKs</NavLink>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0 flex-1 flex flex-col gap-16">

            {/* ── 1. Overview ─────────────────────────────────────────────────── */}
            <section>
              <SectionHeader
                id="overview"
                number="1"
                title="Overview"
                subtitle="What OmniWeave API provides"
              />

              <div className="mt-6 text-slate-400 leading-relaxed space-y-4">
                <p>
                  The OmniWeave Developer API exposes the same routing engine that powers{' '}
                  <strong className="text-slate-300">omniweave.xyz</strong> as a versioned REST
                  interface. Any Sui protocol — wallets, aggregators, lending markets, yield
                  optimisers — can route swaps through OmniWeave without building or maintaining
                  their own DEX integrations.
                </p>
                <p>
                  All endpoints live under the versioned base URL:
                </p>
              </div>

              <div className="mt-4">
                <CodeBlock
                  code="https://omniweave.xyz/api/v1"
                  language="bash"
                  filename="Base URL"
                />
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <InfoCard icon={<LightningIcon />} title="Multi-hop routing">
                  OmniWeave searches up to 4 hops and splits orders across up to 4 pools
                  simultaneously to find the route with the highest post-fee output.
                </InfoCard>
                <InfoCard icon={<ShieldIcon />} title="Zero-integration DEX coverage">
                  We handle Cetus, Turbos, DeepBook, Aftermath, FlowX, and KriyaDEX.
                  You call one endpoint; we handle the rest.
                </InfoCard>
                <InfoCard icon={<ClockIcon />} title="Real-time prices">
                  Prices are fused from CoinGecko (market data) and Pyth Network (on-chain
                  oracle) and cached for 15 seconds. Quotes are never cached — always fresh.
                </InfoCard>
                <InfoCard icon={<KeyIcon />} title="Simple key-based auth">
                  Anonymous access at 100 req/min for exploration. Add an{' '}
                  <code className="text-indigo-300">x-api-key</code> header to unlock 1,000
                  req/min for production use.
                </InfoCard>
              </div>
            </section>

            {/* ── 2. Authentication ────────────────────────────────────────────── */}
            <section>
              <SectionHeader
                id="authentication"
                number="2"
                title="Authentication"
                subtitle="API key header — optional but recommended"
              />

              <div className="mt-6 space-y-4 text-slate-400 leading-relaxed">
                <p>
                  All API endpoints work without authentication at a reduced rate limit.
                  To get higher throughput, request an API key and pass it as the{' '}
                  <code className="text-indigo-300 font-mono">x-api-key</code> header on every request.
                </p>

                <CodeBlock
                  code={`# With API key (1,000 req/min)
curl https://omniweave.xyz/api/v1/stats \\
  -H "x-api-key: ow_your_api_key_here"

# Without API key (100 req/min)
curl https://omniweave.xyz/api/v1/stats`}
                  language="bash"
                  filename="Authentication"
                />

                <div
                  className="rounded-xl p-4 text-sm"
                  style={{
                    background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    color: '#FCD34D',
                  }}
                >
                  <strong>Request an API key:</strong>{' '}
                  <span className="text-amber-200/70">
                    Email <code>api@omniweave.xyz</code> with your protocol name, expected
                    request volume, and intended use case. We respond within 24 hours.
                  </span>
                </div>
              </div>
            </section>

            {/* ── 3. Rate Limits ───────────────────────────────────────────────── */}
            <section>
              <SectionHeader
                id="rate-limits"
                number="3"
                title="Rate Limits"
                subtitle="Per-minute limits, reset headers included"
              />

              <div className="mt-6 space-y-4">
                <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'rgba(99,102,241,0.07)', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                        <th className="text-left px-4 py-3 font-semibold text-slate-300">Tier</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-300">Limit</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-300">Window</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-300">How to qualify</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className="px-4 py-3 text-slate-300">Anonymous</td>
                        <td className="px-4 py-3 font-mono text-amber-400">100 req/min</td>
                        <td className="px-4 py-3 text-slate-500">Rolling 60s</td>
                        <td className="px-4 py-3 text-slate-400">Default — no setup required</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-slate-300">API Key</td>
                        <td className="px-4 py-3 font-mono text-emerald-400">1,000 req/min</td>
                        <td className="px-4 py-3 text-slate-500">Rolling 60s</td>
                        <td className="px-4 py-3 text-slate-400">Pass <code className="text-indigo-300">x-api-key</code> header</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-sm text-slate-400">
                  Every response includes rate-limit headers so you can back off proactively:
                </p>

                <CodeBlock
                  code={`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1747490400   # Unix timestamp (seconds)
X-OmniWeave-Version: 1.0.0

# When you hit the limit:
HTTP/2 429 Too Many Requests
Retry-After: 60`}
                  language="bash"
                  filename="Rate limit headers"
                />
              </div>
            </section>

            {/* ── 4. Endpoints ─────────────────────────────────────────────────── */}
            <section id="endpoints">
              <SectionHeader
                id="endpoints"
                number="4"
                title="Endpoints"
                subtitle="All endpoints return JSON with the X-OmniWeave-Version header"
              />

              {/* ── GET /quote ──────────────────────────────────────────────────── */}
              <div id="endpoint-quote" className="mt-10 scroll-mt-24">
                <div className="flex items-center gap-3 mb-5">
                  <EndpointBadge method="GET" path="/api/v1/quote" />
                  <span className="text-slate-400 text-sm">Best swap route from OmniWeave</span>
                </div>

                <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                  Computes the optimal route for a token swap using multi-hop search and split routing
                  across all integrated DEXes. Returns both the best single-path and best split-path
                  so you can compare before executing.
                </p>

                <h4 className="text-slate-300 font-semibold text-sm mb-3">Parameters</h4>
                <ParamTable
                  params={[
                    { name: 'tokenIn', type: 'string', required: true, description: 'Fully-qualified Sui coin type, e.g. 0x2::sui::SUI' },
                    { name: 'tokenOut', type: 'string', required: true, description: 'Fully-qualified Sui coin type for output token' },
                    { name: 'amountIn', type: 'string', required: true, description: 'Integer amount in base units (no decimals). For 1 SUI: "1000000000"' },
                    { name: 'maxHops', type: 'number', required: false, default: '3', description: 'Maximum hops in a single route path. Range: 1–4' },
                    { name: 'maxSplits', type: 'number', required: false, default: '3', description: 'Maximum number of split route portions. Range: 1–4' },
                    { name: 'slippage', type: 'number', required: false, default: '50', description: 'Slippage tolerance in basis points (50 = 0.5%) for minAmountOut' },
                  ]}
                />

                <div className="mt-6 grid lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-slate-300 font-semibold text-sm mb-3">Example response</h4>
                    <CodeBlock code={EXAMPLES.response_quote} language="json" filename="200 OK" />
                  </div>
                  <div>
                    <h4 className="text-slate-300 font-semibold text-sm mb-3">Try it live</h4>
                    <TryItWidget
                      endpoint="/api/v1/quote"
                      defaultParams={{
                        tokenIn: '0x2::sui::SUI',
                        tokenOut: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
                        amountIn: '1000000000',
                        slippage: '50',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ── GET /price ──────────────────────────────────────────────────── */}
              <div id="endpoint-price" className="mt-14 scroll-mt-24">
                <div className="flex items-center gap-3 mb-5">
                  <EndpointBadge method="GET" path="/api/v1/price" />
                  <span className="text-slate-400 text-sm">Live token prices from CoinGecko + Pyth</span>
                </div>

                <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                  Returns current USD prices for up to 20 tokens per request. Prices are fused from
                  CoinGecko (market data, 24h change) and Pyth Network (on-chain oracle, sub-second
                  updates). Cached for 15 seconds.
                </p>

                <h4 className="text-slate-300 font-semibold text-sm mb-3">Parameters</h4>
                <ParamTable
                  params={[
                    { name: 'tokens', type: 'string', required: true, description: 'Comma-separated token symbols: "SUI,USDC,ETH,BTC". Max 20 tokens per request.' },
                  ]}
                />

                <div className="mt-6 grid lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-slate-300 font-semibold text-sm mb-3">Example response</h4>
                    <CodeBlock code={EXAMPLES.response_price} language="json" filename="200 OK" />
                  </div>
                  <div>
                    <h4 className="text-slate-300 font-semibold text-sm mb-3">Try it live</h4>
                    <TryItWidget
                      endpoint="/api/v1/price"
                      defaultParams={{ tokens: 'SUI,USDC,ETH' }}
                    />
                  </div>
                </div>
              </div>

              {/* ── GET /tokens ─────────────────────────────────────────────────── */}
              <div id="endpoint-tokens" className="mt-14 scroll-mt-24">
                <div className="flex items-center gap-3 mb-5">
                  <EndpointBadge method="GET" path="/api/v1/tokens" />
                  <span className="text-slate-400 text-sm">Full token list with live prices</span>
                </div>

                <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                  Returns the complete list of tokens supported by OmniWeave, enriched with current
                  USD price and 24-hour price change. Response is cached for 60 seconds.
                </p>

                <h4 className="text-slate-300 font-semibold text-sm mb-3">Parameters</h4>
                <ParamTable
                  params={[
                    { name: 'search', type: 'string', required: false, description: 'Filter by symbol, name, or token type string (case-insensitive substring match)' },
                    { name: 'limit', type: 'number', required: false, default: '50', description: 'Maximum tokens to return. Range: 1–200' },
                    { name: 'verified', type: 'boolean', required: false, description: 'Set to "true" to return only curated/popular tokens' },
                  ]}
                />

                <div className="mt-6">
                  <h4 className="text-slate-300 font-semibold text-sm mb-3">Try it live</h4>
                  <TryItWidget
                    endpoint="/api/v1/tokens"
                    defaultParams={{ search: '', limit: '10' }}
                  />
                </div>
              </div>

              {/* ── GET /pools ──────────────────────────────────────────────────── */}
              <div id="endpoint-pools" className="mt-14 scroll-mt-24">
                <div className="flex items-center gap-3 mb-5">
                  <EndpointBadge method="GET" path="/api/v1/pools" />
                  <span className="text-slate-400 text-sm">Pool data for a token pair</span>
                </div>

                <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                  Returns all pools across integrated DEXes for a given token pair. Useful for
                  displaying liquidity depth, comparing fee tiers, or building custom routing logic
                  on top of the OmniWeave pool graph.
                </p>

                <h4 className="text-slate-300 font-semibold text-sm mb-3">Parameters</h4>
                <ParamTable
                  params={[
                    { name: 'tokenA', type: 'string', required: true, description: 'Fully-qualified Sui coin type for the first token' },
                    { name: 'tokenB', type: 'string', required: true, description: 'Fully-qualified Sui coin type for the second token' },
                    { name: 'dex', type: 'string', required: false, description: 'Filter to a single DEX: cetus | turbos | deepbook | aftermath | flowx | kriya' },
                  ]}
                />

                <div className="mt-6">
                  <h4 className="text-slate-300 font-semibold text-sm mb-3">Try it live</h4>
                  <TryItWidget
                    endpoint="/api/v1/pools"
                    defaultParams={{
                      tokenA: '0x2::sui::SUI',
                      tokenB: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
                    }}
                  />
                </div>
              </div>

              {/* ── GET /stats ──────────────────────────────────────────────────── */}
              <div id="endpoint-stats" className="mt-14 scroll-mt-24">
                <div className="flex items-center gap-3 mb-5">
                  <EndpointBadge method="GET" path="/api/v1/stats" />
                  <span className="text-slate-400 text-sm">Protocol statistics</span>
                </div>

                <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                  Returns aggregate protocol metrics: total volume, 24h volume, total swaps, unique
                  users, fees collected, and the list of integrated DEXes and bridges. Cached for 5
                  minutes. Currently estimated data — live indexer integration coming soon.
                </p>

                <div className="mt-6 grid lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-slate-300 font-semibold text-sm mb-3">Example response</h4>
                    <CodeBlock code={EXAMPLES.response_stats} language="json" filename="200 OK" />
                  </div>
                  <div>
                    <h4 className="text-slate-300 font-semibold text-sm mb-3">Try it live</h4>
                    <TryItWidget endpoint="/api/v1/stats" defaultParams={{}} />
                  </div>
                </div>
              </div>
            </section>

            {/* ── 5. Code Examples ──────────────────────────────────────────────── */}
            <section>
              <SectionHeader
                id="code-examples"
                number="5"
                title="Code Examples"
                subtitle="Copy-paste ready snippets for common use cases"
              />

              <div className="mt-8 space-y-8">
                <div>
                  <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-xs font-bold"
                      style={{ background: 'rgba(6,182,212,0.15)', color: '#06B6D4', border: '1px solid rgba(6,182,212,0.3)' }}
                    >
                      TypeScript
                    </span>
                    Get a swap quote
                  </h3>
                  <CodeBlock code={EXAMPLES.ts_quote} language="typescript" filename="quote.ts" />
                </div>

                <div>
                  <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-xs font-bold"
                      style={{ background: 'rgba(6,182,212,0.15)', color: '#06B6D4', border: '1px solid rgba(6,182,212,0.3)' }}
                    >
                      TypeScript
                    </span>
                    Fetch token prices
                  </h3>
                  <CodeBlock code={EXAMPLES.ts_price} language="typescript" filename="prices.ts" />
                </div>

                <div>
                  <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-xs font-bold"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}
                    >
                      Python
                    </span>
                    Get a swap quote
                  </h3>
                  <CodeBlock code={EXAMPLES.py_quote} language="python" filename="quote.py" />
                </div>

                <div>
                  <h3 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-xs font-bold"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}
                    >
                      curl
                    </span>
                    Get a quote · Get pool data
                  </h3>
                  <div className="space-y-4">
                    <CodeBlock code={EXAMPLES.curl_quote} language="bash" filename="quote.sh" />
                    <CodeBlock code={EXAMPLES.curl_pools} language="bash" filename="pools.sh" />
                  </div>
                </div>
              </div>
            </section>

            {/* ── 6. SDKs ───────────────────────────────────────────────────────── */}
            <section>
              <SectionHeader
                id="sdks"
                number="6"
                title="SDKs"
                subtitle="Native library wrappers — coming soon"
              />

              <div className="mt-6">
                <div
                  className="rounded-xl p-8 text-center"
                  style={{
                    background: 'rgba(99,102,241,0.05)',
                    border: '1px dashed rgba(99,102,241,0.3)',
                  }}
                >
                  <div className="text-4xl mb-4">📦</div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">
                    @omniweave/sdk — npm package
                  </h3>
                  <p className="text-slate-400 text-sm max-w-lg mx-auto mb-6">
                    A typed TypeScript SDK with built-in retry logic, response caching, and
                    transaction builder helpers is under development.
                  </p>

                  <CodeBlock
                    code={`# Coming soon
npm install @omniweave/sdk

# Usage (preview API)
import { OmniWeave } from '@omniweave/sdk'

const ow = new OmniWeave({ apiKey: 'ow_...' })

const quote = await ow.quote({
  tokenIn: '0x2::sui::SUI',
  tokenOut: USDC_TYPE,
  amountIn: 1_000_000_000n,
})

// Execute the best route via PTB
const txb = await ow.buildSwapTransaction(quote)`}
                    language="typescript"
                    filename="@omniweave/sdk (preview)"
                  />

                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    {[
                      { label: 'TypeScript / JavaScript', status: 'In progress' },
                      { label: 'Python', status: 'Planned' },
                      { label: 'Rust', status: 'Planned' },
                    ].map(({ label, status }) => (
                      <div
                        key={label}
                        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                        style={{
                          background: 'rgba(99,102,241,0.08)',
                          border: '1px solid rgba(99,102,241,0.2)',
                        }}
                      >
                        <span className="text-slate-300">{label}</span>
                        <span
                          className="text-xs rounded-full px-2 py-0.5"
                          style={{
                            background:
                              status === 'In progress'
                                ? 'rgba(16,185,129,0.15)'
                                : 'rgba(99,102,241,0.15)',
                            color: status === 'In progress' ? '#10B981' : '#818CF8',
                          }}
                        >
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small inline icons (no extra deps)
// ---------------------------------------------------------------------------

function ArrowDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function LightningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  )
}

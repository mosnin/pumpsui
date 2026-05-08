# OmniWeave — The Ultimate Sui Liquidity Layer

OmniWeave is a DEX aggregator built natively on the Sui blockchain. It routes swaps across every major Sui DEX to guarantee best execution, charges a 0.05 % protocol fee, and lets users bridge assets in from any major chain.

## Features

- **Smart Routing** — Graph-based multi-hop and split-route engine across Cetus, Turbos, DeepBook, Aftermath, FlowX, and Kriya
- **Bridge Aggregator** — Compare Wormhole, LayerZero/Stargate, Celer cBridge, Mayan Finance, Axelar, and AllBridge in one UI
- **Real-time Prices** — Pyth Network SSE price feeds + CoinGecko metadata
- **MEV Protection** — Slippage tolerance and transaction deadline enforcement on-chain
- **Limit Orders** — Native CLOB limit orders via DeepBook v3
- **Protocol Fee** — 5 bps on every swap, collected in a shared Move treasury

## Tech Stack

| Layer | Tech |
|---|---|
| Blockchain | Sui (Move 2024) |
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Wallet | @mysten/dapp-kit |
| Prices | Pyth Network, CoinGecko |
| Charts | Recharts |
| State | Zustand, TanStack Query |

## Project Structure

```
omniweave/
├── contracts/              # Move smart contracts
│   ├── sources/
│   │   ├── omniweave_router.move   # Aggregator router + fee logic
│   │   ├── omniweave_fees.move     # Treasury & fee collection
│   │   ├── omniweave_config.move   # Admin config, pause switch
│   │   └── omniweave_quoter.move   # Off-chain quote types
│   └── tests/
├── src/
│   ├── app/                # Next.js routes
│   │   ├── swap/           # Main swap interface
│   │   ├── bridge/         # Cross-chain bridge aggregator
│   │   ├── pools/          # Pool explorer
│   │   ├── analytics/      # Protocol analytics
│   │   ├── portfolio/      # User portfolio
│   │   └── api/            # Quote + token API routes
│   ├── components/
│   │   ├── swap/           # SwapCard, TokenSelector, RouteDisplay
│   │   ├── bridge/         # BridgeCard, ChainSelector
│   │   ├── analytics/      # Charts, StatsCard
│   │   └── layout/         # Header, Footer, MobileMenu
│   ├── lib/
│   │   ├── routing/        # Aggregator engine + DEX adapters
│   │   ├── bridges/        # Bridge provider adapters
│   │   ├── tokens.ts       # Sui mainnet token list
│   │   └── pyth.ts         # Price feed integration
│   └── hooks/              # useSwap, useQuote, useSuiBalance, ...
```

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Smart Contract Deployment

```bash
cd contracts
sui client publish --gas-budget 200000000
```

After publishing, set `NEXT_PUBLIC_ROUTER_PACKAGE_ID` in `.env.local`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```
NEXT_PUBLIC_SUI_NETWORK=mainnet
NEXT_PUBLIC_ROUTER_PACKAGE_ID=0x...
NEXT_PUBLIC_CONFIG_OBJECT_ID=0x...
NEXT_PUBLIC_TREASURY_OBJECT_ID=0x...
PYTH_HERMES_URL=https://hermes.pyth.network
```

## Integrated DEXes

| DEX | Type |
|---|---|
| Cetus | CLMM (concentrated liquidity) |
| Turbos Finance | CLMM |
| DeepBook v3 | Central limit order book |
| Aftermath Finance | Weighted AMM |
| FlowX Finance | Constant-product AMM |
| Kriya DEX | Constant-product AMM |

## Integrated Bridges

| Bridge | Chains | Notes |
|---|---|---|
| Wormhole | EVM + Solana | Native SDK, CCTP USDC |
| LayerZero V2 / Stargate V3 | EVM (140+ chains) | OFT standard |
| Celer cBridge | EVM | Lock-and-mint |
| Mayan Finance | Solana + EVM | Auction model |
| Axelar ITS | EVM | Institutional focus |
| AllBridge Core | Solana + EVM | CCTP zero-slippage USDC |

## License

MIT

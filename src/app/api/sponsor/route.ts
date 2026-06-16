import { NextRequest, NextResponse } from 'next/server'
import { getQuiClient } from '@/lib/suiClient'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { Transaction } from '@mysten/sui/transactions'

export const runtime = 'nodejs'

// Sponsor keypair loaded from env (SPONSOR_PRIVATE_KEY = base64 encoded private key)
// To generate a key: node -e "const {Ed25519Keypair}=require('@mysten/sui/keypairs/ed25519');const kp=new Ed25519Keypair();console.log(Buffer.from(kp.getSecretKey()).toString('base64'))"
// Then set SPONSOR_PRIVATE_KEY=<output> in your .env.local
function getSponsorKeypair(): Ed25519Keypair {
  const key = process.env.SPONSOR_PRIVATE_KEY
  if (!key) throw new Error('SPONSOR_PRIVATE_KEY not configured')
  return Ed25519Keypair.fromSecretKey(Buffer.from(key, 'base64'))
}

// Daily gas budget per user address (in MIST) — 0.1 SUI = 100_000_000 MIST
const DAILY_GAS_BUDGET_MIST = 100_000_000n

// In-memory rate limit (use Redis in production)
const gasUsage = new Map<string, { used: bigint; resetAt: number }>()

function checkGasLimit(userAddress: string, gasBudget: bigint): boolean {
  const now = Date.now()
  const entry = gasUsage.get(userAddress)
  if (!entry || now > entry.resetAt) {
    gasUsage.set(userAddress, { used: gasBudget, resetAt: now + 86_400_000 })
    return true
  }
  if (entry.used + gasBudget > DAILY_GAS_BUDGET_MIST) return false
  entry.used += gasBudget
  return true
}

export async function POST(request: NextRequest) {
  try {
    const { txBytes, userAddress, gasBudget = 10_000_000 } = (await request.json()) as {
      txBytes: string // base64 encoded transaction bytes
      userAddress: string
      gasBudget?: number
    }

    if (!txBytes || !userAddress) {
      return NextResponse.json({ error: 'Missing txBytes or userAddress' }, { status: 400 })
    }

    // Rate limit check
    if (!checkGasLimit(userAddress, BigInt(gasBudget))) {
      return NextResponse.json({ error: 'Daily gas limit exceeded (0.1 SUI/day)' }, { status: 429 })
    }

    const client = getQuiClient()
    const sponsorKeypair = getSponsorKeypair()
    const sponsorAddress = sponsorKeypair.toSuiAddress()

    // Rebuild transaction from bytes and set gas payment from sponsor
    const tx = Transaction.from(Buffer.from(txBytes, 'base64'))

    // Get sponsor's gas coins
    const gasCoins = await client.getCoins({ owner: sponsorAddress, coinType: '0x2::sui::SUI' })
    if (!gasCoins.data.length) {
      return NextResponse.json({ error: 'Sponsor out of gas funds' }, { status: 503 })
    }

    // Set gas payment
    tx.setGasOwner(sponsorAddress)
    tx.setGasPayment(
      gasCoins.data.slice(0, 1).map((c) => ({
        objectId: c.coinObjectId,
        version: c.version,
        digest: c.digest,
      })),
    )
    tx.setGasBudget(gasBudget)

    // Sponsor signs
    const sponsorBytes = await tx.build({ client })
    const { signature: sponsorSignature } = await sponsorKeypair.signTransaction(sponsorBytes)

    return NextResponse.json({
      sponsorSignature,
      sponsorAddress,
      // Return the built tx bytes so client can build final tx
      builtTxBytes: Buffer.from(sponsorBytes).toString('base64'),
    })
  } catch (err) {
    console.error('[/api/sponsor]', err)
    return NextResponse.json({ error: 'Sponsorship failed' }, { status: 500 })
  }
}

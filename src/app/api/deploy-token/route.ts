// POST /api/deploy-token
// Body: { config: TokenConfig, senderAddress: string }
// Returns: { source: string, compiledModules: string[] | null, compilationError: string | null, deployInstructions: string[] }
//
// IMPORTANT: Actual Move compilation requires the Sui CLI (`sui move build`)
// which is not available in the Next.js server environment.
//
// This endpoint returns the generated Move source + instructions, and
// provides the compiled modules IF the Sui CLI is available (via child_process).
// Falls back gracefully to returning source-only mode with CLI instructions.

import { NextRequest, NextResponse } from 'next/server'
import { generateMoveSource, validateTokenConfig } from '@/lib/tokenDeployer'
import type { TokenConfig } from '@/lib/tokenDeployer'
import { execSync } from 'child_process'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const { config, senderAddress: _senderAddress } = await request.json() as { config: TokenConfig; senderAddress: string }

  const errors = validateTokenConfig(config)
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 400 })
  }

  const source = generateMoveSource(config)

  // Try to compile with Sui CLI if available
  let compiledModules: string[] | null = null
  let compilationError: string | null = null

  try {
    // Check if sui CLI is available
    execSync('sui --version', { timeout: 5000 })

    // Create temp directory with Move.toml + source
    const tmpDir = path.join(tmpdir(), `omniweave-token-${Date.now()}`)
    mkdirSync(path.join(tmpDir, 'sources'), { recursive: true })

    const moduleName = config.symbol.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    writeFileSync(path.join(tmpDir, 'sources', `${moduleName}.move`), source)
    writeFileSync(path.join(tmpDir, 'Move.toml'), `
[package]
name = "deployer"
version = "0.0.1"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/mainnet" }

[addresses]
deployer = "0x0"
    `.trim())

    const output = execSync(`sui move build --path ${tmpDir} --dump-bytecode-as-base64 2>&1`, {
      timeout: 60_000,
      encoding: 'utf8',
    })

    // Parse compiled modules from output
    const match = output.match(/\[([^\]]+)\]/)
    if (match) {
      compiledModules = JSON.parse(`[${match[1]}]`) as string[]
    }

    // Cleanup
    rmSync(tmpDir, { recursive: true, force: true })

  } catch {
    compilationError = 'Sui CLI not available on server — use source download + CLI deploy'
  }

  return NextResponse.json({
    source,
    compiledModules,
    compilationError,
    // Instructions for manual deployment when CLI unavailable
    deployInstructions: [
      '1. Install Sui CLI: https://docs.sui.io/guides/developer/getting-started/sui-install',
      '2. Download the generated Move source below',
      '3. Run: sui client publish --gas-budget 50000000',
      '4. Copy the PackageID from the output',
    ],
  })
}

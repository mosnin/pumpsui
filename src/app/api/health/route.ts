import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    network: process.env.NEXT_PUBLIC_SUI_NETWORK || 'mainnet',
    timestamp: new Date().toISOString(),
  })
}

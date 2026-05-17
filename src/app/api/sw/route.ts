import { NextResponse } from 'next/server'

interface CacheManifest {
  version: string
  cacheName: string
  urlsToCache: string[]
  offlineFallback: string
}

export async function GET(): Promise<NextResponse<CacheManifest>> {
  return NextResponse.json({
    version: '1.0.0',
    cacheName: 'omniweave-v1',
    urlsToCache: ['/', '/swap', '/portfolio', '/bridge'],
    offlineFallback: '/swap',
  })
}

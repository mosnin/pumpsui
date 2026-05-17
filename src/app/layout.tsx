import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AppProviders } from '@/providers/AppProviders'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { InstallPrompt } from '@/components/common/InstallPrompt'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'OmniWeave | Best DEX Aggregator on Sui',
    template: '%s | OmniWeave',
  },
  description: 'Trade any token on Sui at the best price. OmniWeave aggregates liquidity from Cetus, Turbos, DeepBook, Aftermath and more. Best rates, MEV protection, multi-hop routing.',
  keywords: ['Sui', 'DEX', 'aggregator', 'DeFi', 'swap', 'Cetus', 'Turbos', 'DeepBook', 'Aftermath', 'liquidity', 'OmniWeave'],
  authors: [{ name: 'OmniWeave' }],
  openGraph: {
    title: 'OmniWeave | Best DEX Aggregator on Sui',
    description: 'Trade any token on Sui at the best price.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OmniWeave | Best DEX Aggregator on Sui',
    description: 'Trade any token on Sui at the best price.',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'OmniWeave',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="bg-[#060611] text-slate-200 min-h-screen flex flex-col">
        <AppProviders>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <InstallPrompt />
        </AppProviders>
      </body>
    </html>
  )
}

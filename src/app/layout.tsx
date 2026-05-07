import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AppProviders } from '@/providers/AppProviders'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

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
  title: 'OmniWeave | The Ultimate Sui Liquidity Layer',
  description:
    'Trade any token on Sui at the best prices. OmniWeave aggregates liquidity from Cetus, Turbos, DeepBook, and more.',
  keywords: 'Sui, DEX, aggregator, DeFi, swap, Cetus, Turbos, DeepBook',
  openGraph: {
    title: 'OmniWeave | The Ultimate Sui Liquidity Layer',
    description: 'Trade any token on Sui at the best prices.',
    type: 'website',
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
        </AppProviders>
      </body>
    </html>
  )
}

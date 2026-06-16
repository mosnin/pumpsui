import type { Metadata } from 'next'
import { AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin — OmniWeave',
  description: 'Protocol administration dashboard',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Warning banner */}
      <div
        className="w-full flex items-center justify-center gap-2.5 px-4 py-2 text-xs font-semibold"
        style={{
          background: 'linear-gradient(90deg, rgba(239,68,68,0.12) 0%, rgba(245,158,11,0.12) 100%)',
          borderBottom: '1px solid rgba(239,68,68,0.25)',
          color: '#FCA5A5',
        }}
      >
        <AlertTriangle size={13} className="shrink-0 text-amber-400" />
        <span>Admin Area — Restricted Access. Actions taken here are irreversible on-chain.</span>
        <AlertTriangle size={13} className="shrink-0 text-amber-400" />
      </div>

      {children}
    </>
  )
}

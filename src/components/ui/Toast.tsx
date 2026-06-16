'use client'

import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  duration?: number
}

// ─── Per-variant config ───────────────────────────────────────────────────────

const variantConfig: Record<
  ToastVariant,
  {
    icon: React.ComponentType<{ className?: string }>
    border: string
    iconClass: string
    bg: string
  }
> = {
  success: {
    icon: CheckCircle,
    border: 'border-emerald-500/50',
    iconClass: 'text-emerald-400',
    bg: 'bg-emerald-950/30',
  },
  error: {
    icon: XCircle,
    border: 'border-red-500/50',
    iconClass: 'text-red-400',
    bg: 'bg-red-950/30',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-500/50',
    iconClass: 'text-amber-400',
    bg: 'bg-amber-950/30',
  },
  info: {
    icon: Info,
    border: 'border-indigo-500/50',
    iconClass: 'text-indigo-400',
    bg: 'bg-indigo-950/30',
  },
}

// ─── Individual Toast ─────────────────────────────────────────────────────────

function Toast({ toast }: { toast: ToastMessage }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const { icon: Icon, border, iconClass, bg } = variantConfig[toast.variant]

  return (
    <ToastPrimitive.Root
      defaultOpen
      duration={toast.duration ?? 5000}
      onOpenChange={(open) => {
        if (!open) removeToast(toast.id)
      }}
      className={cn(
        // layout & colours
        'relative flex items-start gap-3 rounded-xl border p-4',
        'min-w-[320px] max-w-[420px] shadow-2xl',
        bg,
        border,
        'backdrop-blur-md',
        // entrance / exit animations via data attributes
        'data-[state=open]:animate-toast-in',
        'data-[state=closed]:animate-toast-out',
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
        'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform',
        'data-[swipe=end]:animate-toast-swipe-out',
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', iconClass)} />

      <div className="flex-1 min-w-0">
        <ToastPrimitive.Title className="text-sm font-semibold text-slate-100 leading-tight">
          {toast.title}
        </ToastPrimitive.Title>
        {toast.description && (
          <ToastPrimitive.Description className="mt-0.5 text-xs text-slate-400 leading-snug">
            {toast.description}
          </ToastPrimitive.Description>
        )}
        {toast.action && (
          <ToastPrimitive.Action
            altText={toast.action.label}
            onClick={toast.action.onClick}
            className={cn(
              'mt-2 inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium',
              'bg-white/10 text-slate-200 hover:bg-white/20 transition-colors',
            )}
          >
            {toast.action.label}
          </ToastPrimitive.Action>
        )}
      </div>

      <ToastPrimitive.Close
        aria-label="Dismiss"
        className={cn(
          'shrink-0 rounded-md p-0.5 text-slate-500 hover:text-slate-200',
          'transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400',
        )}
      >
        <X className="h-4 w-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {children}

      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}

      <ToastPrimitive.Viewport
        className={cn(
          'fixed bottom-6 right-6 z-[9999]',
          'flex flex-col gap-3',
          // push above any fixed footers / modals
          'outline-none',
        )}
      />
    </ToastPrimitive.Provider>
  )
}

import { create } from 'zustand'
import type { ToastMessage, ToastVariant } from '@/components/ui/Toast'

interface ToastStore {
  toasts: ToastMessage[]
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toastData) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set((state) => ({
      toasts: [...state.toasts, { ...toastData, id }],
    }))
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))

function addToast(variant: ToastVariant, title: string, description?: string) {
  useToastStore.getState().addToast({ variant, title, description })
}

export const toast = {
  success: (title: string, description?: string) =>
    addToast('success', title, description),

  error: (title: string, description?: string) =>
    addToast('error', title, description),

  warning: (title: string, description?: string) =>
    addToast('warning', title, description),

  info: (title: string, description?: string) =>
    addToast('info', title, description),

  tx: (hash: string) =>
    toast.success(
      'Transaction confirmed',
      `View on Suiscan: ${hash.slice(0, 8)}...`,
    ),

  custom: (toastData: Omit<ToastMessage, 'id'>) =>
    useToastStore.getState().addToast(toastData),
}

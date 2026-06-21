export interface ToastOptions {
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
  duration?: number
}

type ToastListener = (toast: ToastOptions & { id: string }) => void

const listeners = new Set<ToastListener>()

export function toast(options: ToastOptions) {
  const id = Math.random().toString(36).substring(2, 9)
  listeners.forEach((listener) => listener({ ...options, id }))
}

export function subscribeToToast(listener: ToastListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useToast() {
  return {
    toast,
  }
}

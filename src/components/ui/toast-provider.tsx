"use client"

import * as React from "react"
import { subscribeToToast, ToastOptions } from "./use-toast"
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react"

interface ToastItem extends ToastOptions {
  id: string
}

export function ToastProvider() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  React.useEffect(() => {
    return subscribeToToast((newToast) => {
      setToasts((prev) => [...prev, newToast])
      
      const duration = newToast.duration || 5000
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
      }, duration)
    })
  }, [])

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-3 pointer-events-none md:left-auto md:right-4 md:max-w-sm">
      {toasts.map((toast) => {
        let borderClass = "border-neutral-300 bg-white/90 dark:border-white/[0.08] dark:bg-black/80 dark:backdrop-blur-2xl"
        let icon = <Info className="h-5 w-5 text-emerald-500" />
        
        if (toast.variant === "destructive") {
          borderClass = "border-red-500/20 bg-red-50/90 dark:border-red-500/20 dark:bg-red-950/60 dark:backdrop-blur-2xl"
          icon = <AlertTriangle className="h-5 w-5 text-red-500" />
        } else if (toast.variant === "success") {
          borderClass = "border-emerald-500/20 bg-emerald-50/90 dark:border-emerald-500/20 dark:bg-emerald-950/60 dark:backdrop-blur-2xl"
          icon = <CheckCircle className="h-5 w-5 text-emerald-500" />
        }

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 w-full rounded-2xl border p-4 shadow-2xl transition-all duration-300 animate-slide-in pointer-events-auto ${borderClass}`}
          >
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <div className="flex-grow">
              {toast.title && <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{toast.title}</h4>}
              {toast.description && (
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="flex-shrink-0 text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
import { useEffect } from 'react'
import { CircleCheck, CircleAlert, Info, TriangleAlert } from 'lucide-react'
import { useUiStore } from '@/app/store/ui.store'

const iconMap = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
}

const toneMap = {
  success: 'border-teal-200 bg-teal-50 text-teal-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  info: 'border-cyan-200 bg-cyan-50 text-cyan-700',
} as const

export function ToastProvider() {
  const toasts = useUiStore((state) => state.toasts)
  const removeToast = useUiStore((state) => state.removeToast)

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        removeToast(toast.id)
      }, toast.tone === 'error' ? 7000 : 4500),
    )

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [removeToast, toasts])

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] grid w-full max-w-sm gap-3">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.tone]
        return (
          <div
            key={toast.id}
            className={`app-panel-enter pointer-events-auto rounded-3xl border px-4 py-3 shadow-lg ${toneMap[toast.tone]}`}
          >
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? <p className="text-xs opacity-90">{toast.description}</p> : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ToastProvider

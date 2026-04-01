import { useEffect, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface DialogProps {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}

export function Dialog({ open, title, description, children, onClose, footer }: DialogProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="surface-panel w-full max-w-xl bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              {description ? <p className="text-sm text-slate-500">{description}</p> : null}
            </div>
            <Button variant="ghost" onClick={onClose} aria-label="Dong hoi thoai">
              Dong
            </Button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-slate-200 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  )
}

export default Dialog

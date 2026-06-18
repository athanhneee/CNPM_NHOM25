import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useDataStore } from '@/app/store/data.store'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  loading?: boolean
  ignoreMaintenance?: boolean
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-active)] focus-visible:ring-[var(--color-accent)]',
  secondary:
    'bg-white text-[var(--color-ink)] ring-1 ring-[var(--color-ink)] hover:bg-[var(--color-surface-soft)] focus-visible:ring-[var(--color-ink)]',
  ghost:
    'bg-transparent text-[var(--color-ink)] hover:underline focus-visible:ring-[var(--color-ink)]',
  danger:
    'bg-gradient-to-r from-teal-700 to-teal-600 text-white hover:from-teal-800 hover:to-teal-700 focus-visible:ring-teal-600',
}

export function Button({
  children,
  className,
  variant = 'primary',
  leftIcon,
  rightIcon,
  loading = false,
  ignoreMaintenance = false,
  disabled,
  ...props
}: ButtonProps) {
  const isDemoMode = import.meta.env.VITE_APP_MODE === 'demo'
  const apiStatus = useDataStore((state) => state.apiStatus)
  const maintenanceMode = useDataStore((state) => state.settings.maintenanceMode)
  const isApiError = apiStatus === 'error' && !isDemoMode
  const isWriteAction = !props.type || props.type === 'submit' || (props.type === 'button' && (variant === 'primary' || variant === 'danger'))
  const shouldDisable = disabled || loading || (isWriteAction && (isApiError || (maintenanceMode && !ignoreMaintenance && !isDemoMode)))

  return (
    <button
      className={cn(
        'brand-ring interactive-press inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold leading-normal tracking-[0.01em] transition disabled:cursor-not-allowed disabled:opacity-60',
        variantClassMap[variant],
        className,
      )}
      disabled={shouldDisable}
      {...props}
    >
      {leftIcon}
      <span>{loading ? 'Đang xử lý...' : children}</span>
      {rightIcon}
    </button>
  )
}

export default Button

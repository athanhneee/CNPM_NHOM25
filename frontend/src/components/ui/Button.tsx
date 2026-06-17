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
    'bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 text-white shadow-[0_18px_38px_rgba(8,145,178,0.24)] hover:shadow-[0_24px_50px_rgba(8,145,178,0.28)] focus-visible:ring-teal-500',
  secondary:
    'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 hover:bg-cyan-100 focus-visible:ring-cyan-500',
  ghost:
    'bg-white/72 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 focus-visible:ring-slate-400',
  danger:
    'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-[0_18px_38px_rgba(244,63,94,0.22)] hover:shadow-[0_24px_50px_rgba(244,63,94,0.28)] focus-visible:ring-rose-500',
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
        'brand-ring interactive-press inline-flex items-center justify-center gap-2 rounded-[26px] px-5 py-3 text-sm font-semibold tracking-[0.01em] transition disabled:cursor-not-allowed disabled:opacity-60',
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

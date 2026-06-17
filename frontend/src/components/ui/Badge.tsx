import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: ReactNode
  className?: string
  title?: string
}

export function Badge({ children, className, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1',
        className,
      )}
    >
      {children}
    </span>
  )
}

export default Badge

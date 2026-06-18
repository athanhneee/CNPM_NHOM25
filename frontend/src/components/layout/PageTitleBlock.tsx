import type { ReactNode } from 'react'

interface PageTitleBlockProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageTitleBlock({ title, subtitle, actions }: PageTitleBlockProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-[28px] font-bold leading-[1.43] tracking-tight text-[var(--color-ink)]">{title}</h1>
        <p className="max-w-3xl text-sm text-[var(--color-muted)]">{subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  )
}

export default PageTitleBlock

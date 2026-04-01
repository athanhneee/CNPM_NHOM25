import type { ReactNode } from 'react'

interface PageTitleBlockProps {
  title: string
  subtitle: string
  actions?: ReactNode
}

export function PageTitleBlock({ title, subtitle, actions }: PageTitleBlockProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="max-w-3xl text-sm text-slate-500">{subtitle}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}

export default PageTitleBlock

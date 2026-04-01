interface InfoItem {
  label: string
  value: string
}

interface InfoListProps {
  items: InfoItem[]
  compact?: boolean
}

export function InfoList({ items, compact = false }: InfoListProps) {
  return (
    <dl className={compact ? 'grid gap-2' : 'grid gap-4'}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
        >
          <dt className="text-sm text-slate-500">{item.label}</dt>
          <dd className="text-right text-sm font-medium text-slate-800">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default InfoList

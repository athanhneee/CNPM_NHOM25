import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

interface TabsProps {
  items: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
}

export function Tabs({ items, activeTab, onChange }: TabsProps) {
  const activeItem = items.find((item) => item.id === activeTab) ?? items[0]

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
        {items.map((item) => (
          <button
            key={item.id}
            className={cn(
              'brand-ring rounded-2xl px-4 py-2 text-sm font-medium transition',
              item.id === activeTab
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-500 hover:bg-white hover:text-slate-700',
            )}
            onClick={() => onChange(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div>{activeItem?.content}</div>
    </div>
  )
}

export default Tabs

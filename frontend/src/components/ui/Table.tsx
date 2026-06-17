import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TableColumn<T> {
  key: string
  header: string
  className?: string
  render: (row: T) => ReactNode
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
}

export function Table<T>({ columns, rows, rowKey, onRowClick }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-slate-100 text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={cn('whitespace-nowrap px-4 py-3 font-semibold', column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {rows.map((row, index) => (
            <tr
              key={rowKey(row)}
              className={cn(
                'transition hover:bg-cyan-50/50',
                index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white',
                onRowClick ? 'cursor-pointer' : '',
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn('whitespace-nowrap px-4 py-3 align-middle text-slate-700', column.className)}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table


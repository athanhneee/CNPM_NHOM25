import { useState, useMemo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
  pageSize?: number
}

export function Table<T>({ columns, rows, rowKey, onRowClick, pageSize }: TableProps<T>) {
  const [page, setPage] = useState(1)

  const totalPages = pageSize ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1
  const currentPage = Math.min(page, totalPages)

  const paginatedRows = useMemo(() => {
    if (!pageSize) return rows
    const start = (currentPage - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, currentPage, pageSize])

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-3xl border border-slate-200">
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
            {paginatedRows.map((row, index) => (
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
      {pageSize && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-2 py-1">
          <span className="text-sm text-slate-500">
            Hiển thị từ {(currentPage - 1) * pageSize + 1} đến {Math.min(currentPage * pageSize, rows.length)} trên tổng số {rows.length}
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-base font-medium text-slate-900">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Table


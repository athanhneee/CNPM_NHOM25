import { useEffect, useRef, useState } from 'react'
import { X, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CourseOption {
  code: string
  name: string
}

interface CourseMultiSelectProps {
  label: string
  hint?: string
  options: CourseOption[]
  value: string[]
  onChange: (value: string[]) => void
}

export function CourseMultiSelect({
  label,
  hint,
  options,
  value,
  onChange,
}: CourseMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = options.filter((option) => {
    if (value.includes(option.code)) return false
    if (!search.trim()) return true
    const keyword = search.trim().toLowerCase()
    return (
      option.code.toLowerCase().includes(keyword) ||
      option.name.toLowerCase().includes(keyword)
    )
  })

  function toggle(code: string) {
    if (value.includes(code)) {
      onChange(value.filter((item) => item !== code))
    } else {
      onChange([...value, code])
      setSearch('')
    }
  }

  function remove(code: string) {
    onChange(value.filter((item) => item !== code))
  }

  const selectedOptions = value
    .map((code) => options.find((option) => option.code === code))
    .filter((option): option is CourseOption => Boolean(option))

  return (
    <div className="grid gap-2" ref={containerRef}>
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>

      {/* Selected chips */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((option) => (
            <span
              key={option.code}
              className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200"
            >
              {option.code}
              <button
                type="button"
                onClick={() => remove(option.code)}
                className="rounded-full p-0.5 hover:bg-teal-100 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger + search */}
      <div className="relative">
        <div
          className={cn(
            'flex items-center gap-2 rounded-full border border-transparent bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-sm transition cursor-pointer',
            open && 'bg-white border-teal-500 ring-2 ring-teal-500/20',
          )}
          onClick={() => {
            setOpen(!open)
            if (!open) {
              setTimeout(() => inputRef.current?.focus(), 50)
            }
          }}
        >
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none placeholder:text-slate-400 text-sm min-w-0"
            placeholder={value.length ? 'Thêm môn...' : 'Tìm và chọn mã môn học...'}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              if (!open) setOpen(true)
            }}
            onFocus={() => setOpen(true)}
          />
          <ChevronDown
            className={cn(
              'h-4 w-4 text-slate-400 shrink-0 transition-transform',
              open && 'rotate-180',
            )}
          />
        </div>

        {/* Dropdown list */}
        {open && (
          <div className="absolute z-50 mt-1.5 w-full max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400">
                {search ? 'Không tìm thấy môn phù hợp' : 'Đã chọn hết'}
              </div>
            ) : (
              filtered.slice(0, 30).map((option) => (
                <button
                  key={option.code}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                  onClick={() => toggle(option.code)}
                >
                  <span className="font-semibold text-teal-700 shrink-0 w-20">
                    {option.code}
                  </span>
                  <span className="text-slate-600 truncate">{option.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {hint && <span className="text-xs text-[var(--color-muted)]">{hint}</span>}
    </div>
  )
}

export default CourseMultiSelect

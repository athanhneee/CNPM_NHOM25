import type { InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  hint?: string
}

export function Checkbox({ label, hint, id, ...props }: CheckboxProps) {
  const resolvedId = id ?? props.name

  return (
    <label className="interactive-press flex items-center gap-3 rounded-3xl border border-[var(--color-hairline)] bg-white px-5 py-3.5 text-sm text-[var(--color-body)]">
      <input
        id={resolvedId}
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
        {...props}
      />
      <span className="grid gap-1">
        <span className="font-medium text-slate-800">{label}</span>
        {hint ? <span className="text-sm text-slate-500">{hint}</span> : null}
      </span>
    </label>
  )
}

export default Checkbox


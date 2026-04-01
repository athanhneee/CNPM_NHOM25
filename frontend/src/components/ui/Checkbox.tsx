import type { InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  hint?: string
}

export function Checkbox({ label, hint, id, ...props }: CheckboxProps) {
  const resolvedId = id ?? props.name

  return (
    <label className="interactive-press flex items-start gap-3 rounded-[28px] border border-slate-200 bg-white/96 px-5 py-4 text-sm text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
      <input
        id={resolvedId}
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
        {...props}
      />
      <span className="grid gap-1">
        <span className="font-medium text-slate-800">{label}</span>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </span>
    </label>
  )
}

export default Checkbox

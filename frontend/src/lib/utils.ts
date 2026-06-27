import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function createId(prefix: string, index: number) {
  return `${prefix}${String(index).padStart(3, '0')}`
}

export function toDigest(value: string) {
  return `demo::${value.trim().toLowerCase()}`
}

export function formatCredits(value: number) {
  return `${value} tin chi`
}

export function formatPercentage(value: number) {
  return `${Math.round(value * 100)}%`
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function getRandomDelay() {
  return 300 + Math.round(Math.random() * 600)
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function isWeekInWeeksString(week: number, weeksString: string): boolean {
  if (!weeksString) return true
  const parts = weeksString.split(',')
  for (const part of parts) {
    if (part.includes('-')) {
      const splitPart = part.split('-').map(Number)
      const start = splitPart[0] ?? 0
      const end = splitPart[1] ?? 0
      if (week >= start && week <= end) return true
    } else {
      if (week === Number(part)) return true
    }
  }
  return false
}

export function getMaxWeek(entries: { weeks?: string | null }[]): number {
  let max = 15
  for (const entry of entries) {
    if (!entry.weeks) continue
    const parts = entry.weeks.split(',')
    for (const part of parts) {
      if (part.includes('-')) {
        const splitPart = part.split('-')
        const end = Number(splitPart[1] ?? 0)
        if (end > max) max = end
      } else {
        const val = Number(part)
        if (val > max) max = val
      }
    }
  }
  return max
}

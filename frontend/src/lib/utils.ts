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

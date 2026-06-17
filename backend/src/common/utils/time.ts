const DURATION_PATTERN = /^(\d+)([smhd])$/

export function parseDurationMs(value: string, fallbackMs: number) {
  const match = DURATION_PATTERN.exec(value.trim())
  if (!match) {
    return fallbackMs
  }

  const amount = Number(match[1])
  const unit = match[2]

  switch (unit) {
    case 's':
      return amount * 1000
    case 'm':
      return amount * 60 * 1000
    case 'h':
      return amount * 60 * 60 * 1000
    case 'd':
      return amount * 24 * 60 * 60 * 1000
    default:
      return fallbackMs
  }
}

export function isWithinRange(now: Date, start: Date, end: Date) {
  const nowTime = now.getTime()
  return nowTime >= start.getTime() && nowTime <= end.getTime()
}

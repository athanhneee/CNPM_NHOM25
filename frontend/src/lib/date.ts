const VIETNAMESE_DATE_TIME = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const VIETNAMESE_DATE = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
})

export function formatDateTime(value?: string) {
  if (!value) {
    return '--'
  }

  return VIETNAMESE_DATE_TIME.format(new Date(value))
}

export function formatDate(value?: string) {
  if (!value) {
    return '--'
  }

  return VIETNAMESE_DATE.format(new Date(value))
}

export function isWithinRange(nowIso: string, startIso: string, endIso: string) {
  const now = new Date(nowIso).getTime()
  return now >= new Date(startIso).getTime() && now <= new Date(endIso).getTime()
}

export function isBefore(dateIso: string, targetIso: string) {
  return new Date(dateIso).getTime() < new Date(targetIso).getTime()
}

export function isAfter(dateIso: string, targetIso: string) {
  return new Date(dateIso).getTime() > new Date(targetIso).getTime()
}

export function addMinutes(value: string, minutes: number) {
  return new Date(new Date(value).getTime() + minutes * 60_000).toISOString()
}

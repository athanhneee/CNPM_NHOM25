export function formatDateTime(value?: string) {
  if (!value) {
    return '--'
  }

  const date = new Date(value);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

export function formatDate(value?: string) {
  if (!value) {
    return '--'
  }

  const date = new Date(value);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  
  return `${dd}/${mm}/${yyyy}`;
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

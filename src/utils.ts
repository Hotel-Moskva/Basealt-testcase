
import type { Task } from './types'

export function parseDateFromTask(t: Task): string {
  const keys = ['date', 'time', 'created_at', 'finished_at', 'updated_at', 'buildtime', 'ts']
  for (const k of keys) {
    const v = t[k]
    if (typeof v === 'string') {
      const d = new Date(v)
      if (!isNaN(d.getTime())) return d.toLocaleString()
    } else if (typeof v === 'number') {
      const n = v > 1e12 ? v : v * 1000
      const d = new Date(n)
      if (!isNaN(d.getTime())) return d.toLocaleString()
    }
  }
  return '—'
}

export function asId(x: unknown): string {
  if (x == null) return ''
  return String(x)
}

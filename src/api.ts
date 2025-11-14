import type { ApiParams, Task } from './types'

const BASE = import.meta.env.VITE_API_BASE ?? 'https://rdb.altlinux.org/api'


function toQuery(params: Record<string, unknown>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue
    const s = String(v).trim()
    if (s !== '') q.set(k, s)
  }
  return q.toString()
}

function normalize(data: any): Task[] {
  if (Array.isArray(data)) return data as Task[]
  if (Array.isArray(data?.tasks)) return data.tasks as Task[]
  if (Array.isArray(data?.list)) return data.list as Task[]
  const firstArr = Object.values(data ?? {}).find(Array.isArray) as Task[] | undefined
  return firstArr ?? []
}

async function requestWithAutoClean(params: Record<string, unknown>): Promise<Task[]> {
  
  let current = { ...params }
  for (let attempt = 0; attempt < 3; attempt++) {
    const url = `${BASE}/site/tasks_history?${toQuery(current)}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })

    if (res.ok) return normalize(await res.json())

    
    let body = ''
    try { body = await res.text() } catch {}
    const m = /Unknown arguments:\s*([^"}\]]+)/i.exec(body)
    if (res.status === 400 && m) {
      
      const badKeys = m[0].split(',').map(s => s.trim()).filter(Boolean)
      if (badKeys.length) {
        for (const k of badKeys) delete (current as any)[k]
        continue 
      }
    }
    
    throw new Error(`HTTP ${res.status} — ${res.statusText}\n${body}`)
  }
  
  const url = `${BASE}/site/tasks_history?${toQuery(current)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}\n${await res.text().catch(()=> '')}`)
  return normalize(await res.json())
}

export async function fetchTasks(params: ApiParams = {}): Promise<Task[]> {
  return requestWithAutoClean(params as Record<string, unknown>)
}
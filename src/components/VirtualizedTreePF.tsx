
import React from 'react'
import { VariableSizeList as List } from 'react-window'
import { Button, Badge } from '@patternfly/react-core'
import { AngleRightIcon, AngleDownIcon, CubesIcon } from '@patternfly/react-icons'
import type { Task } from '../types'
import { asId, parseDateFromTask } from '../utils'

interface Node {
  key: string
  depth: number
  type: 'branch' | 'task'
  isExpanded: boolean
  parentKey?: string
  childrenKeys: string[]
  task?: Task
  branch?: string
}

function buildTree(tasks: Task[], branchFilter: string[] | null) {
  const nodes = new Map<string, Node>()
  const byId = new Map<string, Task>()
  const byBranch = new Map<string, Task[]>()
  for (const t of tasks) {
    const id = asId(t.id)
    if (!id) continue
    byId.set(id, t)
    const br = String(t.branch ?? 'unknown')
    if (!byBranch.has(br)) byBranch.set(br, [])
    byBranch.get(br)!.push(t)
  }
  let branches = Array.from(byBranch.keys()).sort()
  if (branchFilter && branchFilter.length) {
    const set = new Set(branchFilter)
    branches = branches.filter(b => set.has(b))
  }
  const roots: string[] = []

  for (const br of branches) {
    const bKey = `branch:${br}`
    nodes.set(bKey, { key: bKey, depth: 0, type: 'branch', isExpanded: true, childrenKeys: [], branch: br })
    roots.push(bKey)
    const tasksInBranch = byBranch.get(br) ?? []
    const idToChildren = new Map<string, string[]>()
    const idToParent = new Map<string, string | undefined>()
    for (const t of tasksInBranch) {
      const id = asId(t.id)
      const prev = asId(t.prev as any)
      if (prev && byId.has(prev)) {
        if (!idToChildren.has(prev)) idToChildren.set(prev, [])
        idToChildren.get(prev)!.push(id)
        idToParent.set(id, prev)
      } else idToParent.set(id, undefined)
    }
    const taskNodes = new Map<string, Node>()
    for (const t of tasksInBranch) {
      const id = asId(t.id)
      const key = `task:${id}`
      taskNodes.set(id, { key, depth: 1, type: 'task', isExpanded: false, parentKey: bKey, childrenKeys: [], task: t })
    }
    for (const [pid, ch] of idToChildren.entries()) {
      const p = taskNodes.get(pid)
      if (p) p.childrenKeys = ch.map(cid => `task:${cid}`)
    }
    const bNode = nodes.get(bKey)!
    for (const t of tasksInBranch) {
      const id = asId(t.id)
      const n = taskNodes.get(id)!
      let d = 1, current = idToParent.get(id), guard = 0
      while (current && taskNodes.has(current) && guard < 50) {
        d += 1; current = idToParent.get(current); guard += 1
      }
      n.depth = d
      if (!idToParent.get(id)) bNode.childrenKeys.push(n.key)
      nodes.set(n.key, n)
    }
  }
  function computeVisible() {
    const out: string[] = []
    function walk(key: string) {
      const n = nodes.get(key)!
      out.push(n.key)
      if (n.isExpanded) for (const ck of n.childrenKeys) walk(ck)
    }
    for (const r of roots) walk(r)
    return out
  }
  return { nodes, roots, computeVisible }
}

export default function VirtualizedTreePF({ tasks, branchFilter, highlightId }:
  { tasks: Task[]; branchFilter: string[] | null; highlightId?: string }) {
  const { nodes, roots, computeVisible } = React.useMemo(() => buildTree(tasks, branchFilter), [tasks, branchFilter])
  const [visibleKeys, setVisibleKeys] = React.useState<string[]>(() => computeVisible())
  const listRef = React.useRef<any>(null)
  const rowHeights = React.useRef<Map<string, number>>(new Map())

  const toggle = (key: string) => {
    const n = nodes.get(key); if (!n) return
    n.isExpanded = !n.isExpanded
    setVisibleKeys(computeVisible())
    requestAnimationFrame(() => listRef.current?.resetAfterIndex(0, true))
  }

  const getSize = (index: number) => {
    const key = visibleKeys[index]
    return rowHeights.current.get(key ?? '') ?? 48
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const key = visibleKeys[index]
    const n = nodes.get(key ?? '')!
    const indent = n.type === 'branch' ? 0 : (n.depth - 1) * 16
    const hasChildren = n.childrenKeys.length > 0
    const isHighlighted = n.type === 'task' && highlightId && (String(n.task?.id) == highlightId)

    const ref = (el: HTMLDivElement | null) => {
      if (!el) return
      const h = el.getBoundingClientRect().height
      if (Math.abs((rowHeights.current.get(key ?? '') ?? 0) - h) > 1) {
        rowHeights.current.set(key ?? '', h)
        listRef.current?.resetAfterIndex(index, false)
      }
    }

    return (
      <div ref={ref} style={{ ...style, display: 'flex', alignItems: 'flex-start', padding: '6px 12px', borderBottom: '1px solid var(--pf-v5-global--BorderColor--100)' }}>
        <div style={{ width: indent }} />
        <Button variant="plain" isDisabled={!hasChildren} aria-label="toggle" onClick={() => hasChildren && toggle(key ?? '')} style={{ padding: 0, marginRight: 6 }}>
          {hasChildren ? (n.isExpanded ? <AngleDownIcon/> : <AngleRightIcon/>) : <CubesIcon />}
        </Button>
        {n.type === 'branch' ? (
          <div>
            <div style={{ fontWeight: 600 }}>Ветка: {n.branch} <Badge isRead>{n.childrenKeys.length}</Badge></div>
            <div style={{ color: 'var(--pf-v5-global--palette--black-600)' }}>Корневые задачи</div>
          </div>
        ) : (
          <div style={{ outline: isHighlighted ? '2px solid var(--pf-v5-global--palette--green-400)' : 'none', borderRadius: 6, padding: isHighlighted ? 2 : 0 }}>
            <div style={{ fontWeight: 600 }}>Задача #{String(n.task?.id)}</div>
            <div style={{ color: 'var(--pf-v5-global--palette--black-600)' }}>
              Дата: {n.task ? parseDateFromTask(n.task) : '—'} | prev: {String(n.task?.prev ?? '—')} | ветка: {String(n.task?.branch ?? '—')}
            </div>
          </div>
        )}
      </div>
    )
  }

  const height = Math.max(240, (typeof window !== 'undefined' ? window.innerHeight : 800) - 220)

  return (
    <List
      ref={listRef}
      height={height}
      width={'100%'}
      itemCount={visibleKeys.length}
      itemSize={getSize}
      overscanCount={10}
    >
      {Row as any}
    </List>
  )
}

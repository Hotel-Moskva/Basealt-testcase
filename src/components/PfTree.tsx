
import React from 'react'
import { TreeView, TreeViewDataItem } from '@patternfly/react-core'
import type { Task } from '../types'
import { asId, parseDateFromTask } from '../utils'

function taskToLabel(t: Task) {
  return `#${t.id} | prev: ${t.prev ?? '—'} | ${parseDateFromTask(t)}`
}

export interface PfTreeProps {
  tasks: Task[]
  branchesFilter: string[] | null
  highlightTaskId?: string
  onSelectTask?: (id: string) => void
}

export function buildPfItems(tasks: Task[], branchesFilter: string[] | null): TreeViewDataItem[] {
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
  if (branchesFilter && branchesFilter.length) {
    const set = new Set(branchesFilter)
    branches = branches.filter(b => set.has(b))
  }

  const items: TreeViewDataItem[] = []

  for (const br of branches) {
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
      } else {
        idToParent.set(id, undefined)
      }
    }

    const buildNode = (id: string): TreeViewDataItem => {
      const t = byId.get(id)!
      const children = (idToChildren.get(id) ?? []).map(cid => buildNode(cid))
      return {
        id: `task:${id}`,
        name: taskToLabel(t),
        children: children.length ? children : undefined,
        defaultExpanded: false
      }
    }

    const roots: TreeViewDataItem[] = []
    for (const t of tasksInBranch) {
      const id = asId(t.id)
      if (!idToParent.get(id)) roots.push(buildNode(id))
    }

    items.push({
      id: `branch:${br}`,
      name: `Ветка: ${br}`,
      defaultExpanded: false,
      children: roots.length ? roots : undefined
    })
  }

  return items
}

export default function PfTree({ tasks, branchesFilter, onSelectTask }: PfTreeProps) {
  const [activeItems, setActiveItems] = React.useState<TreeViewDataItem[]>([])
  const [pfItems, setPfItems] = React.useState<TreeViewDataItem[]>([])

  React.useEffect(() => {
    setPfItems(buildPfItems(tasks, branchesFilter))
  }, [tasks, branchesFilter])

  const onSelect = (_e: React.MouseEvent, item: TreeViewDataItem) => {
    setActiveItems([item])
    const idStr = String(item.id ?? '')
    if (idStr.startsWith('task:') && onSelectTask) onSelectTask(idStr.slice('task:'.length))
  }

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <TreeView data={pfItems} activeItems={activeItems} onSelect={onSelect} useMemo variant="compact" />
    </div>
  )
}

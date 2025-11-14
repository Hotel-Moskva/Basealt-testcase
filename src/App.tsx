
import React from 'react'
import {
  Page, PageSection, PageSectionVariants,
  Toolbar, ToolbarContent, ToolbarItem,
  Switch, LabelGroup, Label, Bullseye, Spinner, Alert, Title
} from '@patternfly/react-core'
import PfTree from './components/PfTree'
import VirtualizedTreePF from './components/VirtualizedTreePF'
import SearchBar from './components/SearchBar'
import { fetchTasks } from './api'
import type { Task } from './types'

export default function App() {
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [branches, setBranches] = React.useState<string[]>([])
  const [allBranches, setAllBranches] = React.useState<string[]>([])
  const [highlightId, setHighlightId] = React.useState<string>('')
  const [virtualized, setVirtualized] = React.useState<boolean>(false)

  const load = React.useCallback(async (task_id?: string) => {
    setLoading(true); setError(null)
    try {
      const t = await fetchTasks({ ...(task_id ? { task_id } : {}) })
      setTasks(t)
      const setB = Array.from(new Set(t.map(x => String(x.branch ?? 'unknown')))).sort()
      setAllBranches(setB); setBranches(setB)
    } catch (e: any) {
      setError(e?.message ?? String(e)); setTasks([])
    } finally { setLoading(false) }
  }, [])

  React.useEffect(() => { load() }, [load])

  const onSearch = async (taskId: string) => {
    if (!taskId) return
    setHighlightId('')
    await load(taskId)
    setHighlightId(taskId)
  }

  const autoVirtualize = tasks.length > 2500
  const useVirtual = virtualized || autoVirtualize

  return (
    <Page isManagedSidebar={false}>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h1" size="lg">Система Контроля Версий ALT Linux</Title>
        
      </PageSection>

      <PageSection>
        <Toolbar inset={{ default: 'insetNone' }}>
          <ToolbarContent>
            <ToolbarItem><SearchBar onSearch={onSearch} isLoading={loading} /></ToolbarItem>
            <ToolbarItem variant="separator" />
            <ToolbarItem>
              <LabelGroup numLabels={6} isCompact>
                {allBranches.map(b => (
                  <Label key={b} color={branches.includes(b) ? 'blue' : 'grey'} onClose={() => setBranches(prev => prev.filter(x => x !== b))}>{b}</Label>
                ))}
              </LabelGroup>
            </ToolbarItem>
            <ToolbarItem variant="separator" />
            <ToolbarItem>
              <Switch id="virt" label="Виртуализация" labelOff="Виртуализация" isChecked={useVirtual} onChange={(_, val) => setVirtualized(val)} />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </PageSection>

      <PageSection isFilled style={{ height: '60vh' }}>
        {loading && (
          <Bullseye><Spinner /></Bullseye>
        )}
        {!loading && error && <Alert isInline variant="danger" title="Ошибка загрузки">{error}</Alert>}
        {!loading && !error && tasks.length === 0 && <Alert isInline variant="info" title="Нет данных">Проверьте параметры запроса.</Alert>}
        {!loading && !error && tasks.length > 0 && (
          useVirtual
            ? <VirtualizedTreePF tasks={tasks} branchFilter={branches} highlightId={highlightId} />
            : <PfTree tasks={tasks} branchesFilter={branches} onSelectTask={(id) => setHighlightId(id)} />
        )}
      </PageSection>

      
    </Page>
  )
}

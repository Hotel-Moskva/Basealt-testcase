
import React from 'react'
import { TextInput, Button, InputGroup } from '@patternfly/react-core'

export default function SearchBar({ onSearch, isLoading }: { onSearch: (taskId: string) => void; isLoading?: boolean }) {
  const [value, setValue] = React.useState('')
  const submit = (e: React.FormEvent) => { e.preventDefault(); onSearch(value.trim()) }
  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
      <InputGroup>
        <TextInput value={value} onChange={(_, v) => setValue(v)} type="text" aria-label="Поиск task_id" placeholder="Например, 399129" />
        <Button variant="primary" type="submit" isLoading={!!isLoading}>Найти</Button>
      </InputGroup>
    </form>
  )
}

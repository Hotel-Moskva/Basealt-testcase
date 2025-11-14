
export type BranchName = string

export interface Task { 
  id: number | string
  branch?: BranchName
  prev?: number | string | null
  branch_commits?: Record<string, Array<string | { hash?: string; message?: string; date?: string }>> | null 
  [key: string]: unknown 
}

export interface ApiParams {
  task_id?: string | number
  project?: string
  branch?: string
  limit?: number
  offset?: number
}



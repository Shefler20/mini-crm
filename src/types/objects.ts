import type { TaskStatus } from '../hooks/useTaskDetails.ts'

export type { TaskStatus }

export interface ConstructionObject {
  id: string
  name: string
  address: string
  created_at: string
}

export interface ObjectTask {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  created_at: string
  executor_id: string
  executorName: string | null
}

export interface ObjectExecutor {
  id: string
  full_name: string
}

export interface CreateObjectTaskInput {
  title: string
  description: string
  executorId: string
}

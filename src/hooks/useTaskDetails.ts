import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.ts'

export type TaskStatus = 'new' | 'in_progress' | 'in_review' | 'accepted' | 'rework'

export interface TaskDetails {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  created_at: string
  executor_id: string
  author_id: string
  object_id: string
  objectName: string | null
  objectAddress: string | null
  executorName: string | null
  authorName: string | null
}

export interface HistoryEntry {
  id: string
  task_id: string
  changed_by: string | null
  old_status: TaskStatus | null
  new_status: TaskStatus
  comment: string | null
  created_at: string
  actorName: string | null
}

interface LoadedPage {
  taskId: string
  task: TaskDetails | null
  history: HistoryEntry[]
  taskError: string | null
  historyError: string | null
  notFound: boolean
}

export interface TaskDetailsState {
  loading: boolean
  task: TaskDetails | null
  history: HistoryEntry[]
  taskError: string | null
  historyError: string | null
  notFound: boolean
  reload: () => void
  beginRequest: () => number
  isCurrentRequest: (requestId: number) => boolean
  completeRequest: (requestId: number, taskId: string) => Promise<void>
}

const taskLoadErrorMessage = 'Не удалось загрузить задачу. Попробуйте ещё раз.'
const historyLoadErrorMessage = 'Не удалось загрузить историю изменений. Попробуйте ещё раз.'

const isTaskStatus = (value: unknown): value is TaskStatus => {
  return (
    value === 'new' ||
    value === 'in_progress' ||
    value === 'in_review' ||
    value === 'accepted' ||
    value === 'rework'
  )
}

const readSingleRecord = (value: unknown): Record<string, unknown> | null => {
  if (Array.isArray(value)) {
    const [first] = value

    if (value.length !== 1 || typeof first !== 'object' || first === null) {
      return null
    }

    return first as Record<string, unknown>
  }

  if (typeof value !== 'object' || value === null) {
    return null
  }

  return value as Record<string, unknown>
}

const readFullName = (value: unknown): string | null | undefined => {
  if (value === null) {
    return null
  }

  const record = readSingleRecord(value)

  if (!record || typeof record.full_name !== 'string') {
    return undefined
  }

  const trimmed = record.full_name.trim()

  return trimmed.length > 0 ? trimmed : null
}

const readObjectFields = (
  value: unknown,
): { name: string | null; address: string | null } | null | undefined => {
  if (value === null) {
    return null
  }

  const record = readSingleRecord(value)

  if (!record || typeof record.name !== 'string' || typeof record.address !== 'string') {
    return undefined
  }

  const name = record.name.trim()
  const address = record.address.trim()

  return {
    name: name.length > 0 ? name : null,
    address: address.length > 0 ? address : null,
  }
}

const parseTask = (value: unknown): TaskDetails | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  const description = record.description
  const relatedObject = readObjectFields(record.objects)
  const executorName = readFullName(record.executor)
  const authorName = readFullName(record.author)

  if (
    typeof record.id !== 'string' ||
    typeof record.title !== 'string' ||
    (description !== null && typeof description !== 'string') ||
    !isTaskStatus(record.status) ||
    typeof record.created_at !== 'string' ||
    typeof record.executor_id !== 'string' ||
    typeof record.author_id !== 'string' ||
    typeof record.object_id !== 'string' ||
    relatedObject === undefined ||
    executorName === undefined ||
    authorName === undefined
  ) {
    return null
  }

  return {
    id: record.id,
    title: record.title,
    description,
    status: record.status,
    created_at: record.created_at,
    executor_id: record.executor_id,
    author_id: record.author_id,
    object_id: record.object_id,
    objectName: relatedObject?.name ?? null,
    objectAddress: relatedObject?.address ?? null,
    executorName,
    authorName,
  }
}

const parseHistoryEntry = (value: unknown): HistoryEntry | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  const changedBy = record.changed_by
  const oldStatus = record.old_status
  const comment = record.comment
  const actorName = readFullName(record.profiles)

  if (
    typeof record.id !== 'string' ||
    typeof record.task_id !== 'string' ||
    (changedBy !== null && typeof changedBy !== 'string') ||
    (oldStatus !== null && !isTaskStatus(oldStatus)) ||
    !isTaskStatus(record.new_status) ||
    (comment !== null && typeof comment !== 'string') ||
    typeof record.created_at !== 'string' ||
    actorName === undefined
  ) {
    return null
  }

  return {
    id: record.id,
    task_id: record.task_id,
    changed_by: changedBy,
    old_status: oldStatus,
    new_status: record.new_status,
    comment,
    created_at: record.created_at,
    actorName,
  }
}

const parseHistoryList = (value: unknown): HistoryEntry[] | null => {
  if (!Array.isArray(value)) {
    return null
  }

  const history: HistoryEntry[] = []

  for (const item of value) {
    const entry = parseHistoryEntry(item)

    if (!entry) {
      return null
    }

    history.push(entry)
  }

  return history
}

const failedPage = (taskId: string): LoadedPage => {
  return {
    taskId,
    task: null,
    history: [],
    taskError: taskLoadErrorMessage,
    historyError: null,
    notFound: false,
  }
}

const queryTask = (taskId: string) => {
  return supabase
    .from('tasks')
    .select(
      'id, title, description, status, created_at, executor_id, author_id, object_id, objects!tasks_object_id_fkey(name, address), executor:profiles!tasks_executor_id_fkey(full_name), author:profiles!tasks_author_id_fkey(full_name)',
    )
    .eq('id', taskId)
    .maybeSingle()
}

const queryHistory = (taskId: string) => {
  return supabase
    .from('task_history')
    .select(
      'id, task_id, changed_by, old_status, new_status, comment, created_at, profiles!task_history_changed_by_fkey(full_name)',
    )
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
}

const loadPage = async (taskId: string): Promise<LoadedPage> => {
  try {
    const [taskResult, historyResult] = await Promise.all([queryTask(taskId), queryHistory(taskId)])

    if (taskResult.error || (taskResult.data !== null && !parseTask(taskResult.data))) {
      return failedPage(taskId)
    }

    if (taskResult.data === null) {
      return {
        taskId,
        task: null,
        history: [],
        taskError: null,
        historyError: null,
        notFound: true,
      }
    }

    const task = parseTask(taskResult.data)

    if (!task) {
      return failedPage(taskId)
    }

    const history = parseHistoryList(historyResult.data)

    if (historyResult.error || !history) {
      return {
        taskId,
        task,
        history: [],
        taskError: null,
        historyError: historyLoadErrorMessage,
        notFound: false,
      }
    }

    return {
      taskId,
      task,
      history,
      taskError: null,
      historyError: null,
      notFound: false,
    }
  } catch {
    return failedPage(taskId)
  }
}

export const useTaskDetails = (taskId: string | undefined): TaskDetailsState => {
  const requestRef = useRef(0)
  const [page, setPage] = useState<LoadedPage | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const beginRequest = (): number => {
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    return requestId
  }

  const isCurrentRequest = (requestId: number): boolean => {
    return requestRef.current === requestId
  }

  const completeRequest = async (requestId: number, requestedTaskId: string): Promise<void> => {
    const result = await loadPage(requestedTaskId)

    if (requestRef.current !== requestId) {
      return
    }

    setPage(result)
  }

  useEffect(() => {
    if (!taskId) {
      return
    }

    const requestId = requestRef.current + 1
    requestRef.current = requestId
    const requestedTaskId = taskId

    void loadPage(requestedTaskId).then((result) => {
      if (requestRef.current !== requestId) {
        return
      }

      setPage(result)
    })
  }, [taskId, reloadKey])

  const current = page?.taskId === taskId ? page : null
  const loading = Boolean(taskId) && current === null
  const taskError = current?.taskError ?? null

  const reload = () => {
    setPage(null)
    setReloadKey((currentKey) => currentKey + 1)
  }

  return {
    loading,
    task: current?.task ?? null,
    history: current?.history ?? [],
    taskError,
    historyError: current?.historyError ?? null,
    notFound: !loading && !taskError && (!taskId || current?.notFound === true),
    reload,
    beginRequest,
    isCurrentRequest,
    completeRequest,
  }
}

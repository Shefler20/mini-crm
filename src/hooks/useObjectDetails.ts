import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.ts'
import type { ConstructionObject, ObjectTask, TaskStatus } from '../types/objects.ts'

export interface ObjectDetailsState {
  object: ConstructionObject | null
  tasks: ObjectTask[]
  loading: boolean
  objectError: string | null
  tasksError: string | null
  notFound: boolean
  reload: () => void
}

interface LoadedDetails {
  objectId: string
  object: ConstructionObject | null
  tasks: ObjectTask[]
  objectError: string | null
  tasksError: string | null
  notFound: boolean
}

const objectLoadErrorMessage = 'Не удалось загрузить объект. Попробуйте ещё раз.'
const tasksLoadErrorMessage = 'Не удалось загрузить задачи объекта. Попробуйте ещё раз.'

const isTaskStatus = (value: unknown): value is TaskStatus => {
  return (
    value === 'new' ||
    value === 'in_progress' ||
    value === 'in_review' ||
    value === 'accepted' ||
    value === 'rework'
  )
}

const isConstructionObject = (value: unknown): value is ConstructionObject => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.address === 'string' &&
    typeof record.created_at === 'string'
  )
}

const readExecutorName = (value: unknown): string | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const fullName = (value as Record<string, unknown>).full_name

  if (typeof fullName !== 'string') {
    return null
  }

  const trimmed = fullName.trim()

  return trimmed.length > 0 ? trimmed : null
}

const parseTask = (value: unknown): ObjectTask | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  const description = record.description

  if (
    typeof record.id !== 'string' ||
    typeof record.title !== 'string' ||
    (description !== null && typeof description !== 'string') ||
    !isTaskStatus(record.status) ||
    typeof record.created_at !== 'string' ||
    typeof record.executor_id !== 'string'
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
    executorName: readExecutorName(record.executor),
  }
}

const parseTaskList = (value: unknown): ObjectTask[] | null => {
  if (!Array.isArray(value)) {
    return null
  }

  const tasks: ObjectTask[] = []

  for (const item of value) {
    const task = parseTask(item)

    if (!task) {
      return null
    }

    tasks.push(task)
  }

  return tasks
}

const queryObject = (objectId: string) => {
  return supabase
    .from('objects')
    .select('id, name, address, created_at')
    .eq('id', objectId)
    .maybeSingle()
}

const queryTasks = (objectId: string) => {
  return supabase
    .from('tasks')
    .select(
      'id, title, description, status, created_at, executor_id, executor:profiles!tasks_executor_id_fkey(full_name)',
    )
    .eq('object_id', objectId)
    .order('created_at', { ascending: false })
}

const failedDetails = (objectId: string): LoadedDetails => {
  return {
    objectId,
    object: null,
    tasks: [],
    objectError: objectLoadErrorMessage,
    tasksError: null,
    notFound: false,
  }
}

export const useObjectDetails = (objectId: string | undefined): ObjectDetailsState => {
  const [details, setDetails] = useState<LoadedDetails | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!objectId) {
      return
    }

    let active = true
    const requestedId = objectId

    void Promise.all([queryObject(requestedId), queryTasks(requestedId)]).then(
      ([objectResult, tasksResult]) => {
        if (!active) {
          return
        }

        if (objectResult.error || (objectResult.data !== null && !isConstructionObject(objectResult.data))) {
          setDetails(failedDetails(requestedId))
          return
        }

        if (objectResult.data === null) {
          setDetails({
            objectId: requestedId,
            object: null,
            tasks: [],
            objectError: null,
            tasksError: null,
            notFound: true,
          })
          return
        }

        const parsedTasks = parseTaskList(tasksResult.data)

        if (tasksResult.error || !parsedTasks) {
          setDetails({
            objectId: requestedId,
            object: objectResult.data,
            tasks: [],
            objectError: null,
            tasksError: tasksLoadErrorMessage,
            notFound: false,
          })
          return
        }

        setDetails({
          objectId: requestedId,
          object: objectResult.data,
          tasks: parsedTasks,
          objectError: null,
          tasksError: null,
          notFound: false,
        })
      },
      () => {
        if (!active) {
          return
        }

        setDetails(failedDetails(requestedId))
      },
    )

    return () => {
      active = false
    }
  }, [objectId, reloadKey])

  const current = details?.objectId === objectId ? details : null
  const loading = Boolean(objectId) && current === null

  const reload = () => {
    setDetails(null)
    setReloadKey((currentKey) => currentKey + 1)
  }

  return {
    object: current?.object ?? null,
    tasks: current?.tasks ?? [],
    loading,
    objectError: current?.objectError ?? null,
    tasksError: current?.tasksError ?? null,
    notFound: !loading && (!objectId || current?.notFound === true),
    reload,
  }
}

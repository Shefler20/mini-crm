import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.ts'
import type { TaskDetails } from './useTaskDetails.ts'

export interface TaskObjectOption {
  id: string
  name: string
}

export interface TaskExecutorOption {
  id: string
  full_name: string
}

export interface TaskUpdateInput {
  title: string
  description: string
  objectId: string
  executorId: string
}

export type DeleteTaskResult =
  | { deleted: true; objectId: string }
  | { deleted: false; objectId: null }

interface Params {
  task: TaskDetails | null
  enabled: boolean
  routeId: string | undefined
  reloadTask: () => void
}

interface OptionsState {
  objects: TaskObjectOption[]
  executors: TaskExecutorOption[]
  error: string | null
}

export interface TaskManagementState {
  objects: TaskObjectOption[]
  executors: TaskExecutorOption[]
  optionsLoading: boolean
  optionsError: string | null
  reloadOptions: () => void
  saving: boolean
  saveError: string | null
  deleting: boolean
  deleteError: string | null
  clearSaveError: () => void
  updateTask: (input: TaskUpdateInput) => Promise<boolean>
  deleteTask: () => Promise<DeleteTaskResult>
}

const optionsLoadErrorMessage = 'Не удалось загрузить данные для редактирования. Попробуйте ещё раз.'
const saveErrorMessage = 'Не удалось сохранить задачу. Попробуйте ещё раз.'
const deleteErrorMessage = 'Не удалось удалить задачу. Попробуйте ещё раз.'
const savePermissionMessage = 'Недостаточно прав для изменения задачи.'
const deletePermissionMessage = 'Недостаточно прав для удаления задачи.'
const titleValidationMessage = 'Укажите название задачи.'
const objectValidationMessage = 'Выберите объект из списка.'
const executorValidationMessage = 'Выберите исполнителя из списка.'
const unavailableTaskMessage = 'Задача не найдена или недоступна.'

const isTaskObjectOption = (value: unknown): value is TaskObjectOption => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>

  return typeof record.id === 'string' && typeof record.name === 'string'
}

const isTaskExecutorOption = (value: unknown): value is TaskExecutorOption => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>

  return typeof record.id === 'string' && typeof record.full_name === 'string'
}

const isObjectList = (value: unknown): value is TaskObjectOption[] => {
  return Array.isArray(value) && value.every(isTaskObjectOption)
}

const isExecutorList = (value: unknown): value is TaskExecutorOption[] => {
  return Array.isArray(value) && value.every(isTaskExecutorOption)
}

const readErrorText = (error: unknown): { text: string; code: string } => {
  if (typeof error !== 'object' || error === null) {
    return { text: '', code: '' }
  }

  const record = error as Record<string, unknown>
  const message = typeof record.message === 'string' ? record.message : ''
  const details = typeof record.details === 'string' ? record.details : ''
  const code = typeof record.code === 'string' ? record.code : ''

  return { text: `${message}\n${details}`, code }
}

const isPermissionError = (error: unknown): boolean => {
  const { text, code } = readErrorText(error)
  const normalized = text.toLowerCase()

  return (
    code === '42501' ||
    normalized.includes('row-level security') ||
    normalized.includes('permission denied')
  )
}

const failedDelete = (): DeleteTaskResult => {
  return { deleted: false, objectId: null }
}

const queryObjects = () => {
  return supabase.from('objects').select('id, name').order('name', { ascending: true })
}

const queryExecutors = () => {
  return supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'executor')
    .order('full_name', { ascending: true })
}

export const useTaskManagement = ({
  task,
  enabled,
  routeId,
  reloadTask,
}: Params): TaskManagementState => {
  const routeIdRef = useRef(routeId)
  const [boundRouteId, setBoundRouteId] = useState(routeId)
  const [options, setOptions] = useState<OptionsState | null>(null)
  const [optionsRequest, setOptionsRequest] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    routeIdRef.current = routeId
  }, [routeId])

  if (boundRouteId !== routeId) {
    setBoundRouteId(routeId)
    setSaveError(null)
    setDeleteError(null)
    setSaving(false)
    setDeleting(false)
  }

  useEffect(() => {
    if (!enabled) {
      return
    }

    let active = true

    void Promise.all([queryObjects(), queryExecutors()]).then(
      ([objectsResult, executorsResult]) => {
        if (!active) {
          return
        }

        if (
          objectsResult.error ||
          executorsResult.error ||
          !isObjectList(objectsResult.data) ||
          !isExecutorList(executorsResult.data)
        ) {
          setOptions({ objects: [], executors: [], error: optionsLoadErrorMessage })
          return
        }

        setOptions({
          objects: objectsResult.data,
          executors: executorsResult.data,
          error: null,
        })
      },
      () => {
        if (!active) {
          return
        }

        setOptions({ objects: [], executors: [], error: optionsLoadErrorMessage })
      },
    )

    return () => {
      active = false
    }
  }, [enabled, optionsRequest])

  const objects = enabled ? (options?.objects ?? []) : []
  const executors = enabled ? (options?.executors ?? []) : []
  const optionsLoading = enabled && options === null
  const optionsError = enabled ? (options?.error ?? null) : null

  const reloadOptions = () => {
    setOptions(null)
    setOptionsRequest((current) => current + 1)
  }

  const clearSaveError = () => {
    setSaveError(null)
  }

  const updateTask = async (input: TaskUpdateInput): Promise<boolean> => {
    if (!enabled || !task || saving || deleting) {
      return false
    }

    const taskId = task.id
    const requestRouteId = routeId
    const title = input.title.trim()
    const description = input.description.trim()

    if (title.length === 0) {
      setSaveError(titleValidationMessage)
      return false
    }

    if (!objects.some((object) => object.id === input.objectId)) {
      setSaveError(objectValidationMessage)
      return false
    }

    if (!executors.some((executor) => executor.id === input.executorId)) {
      setSaveError(executorValidationMessage)
      return false
    }

    setSaveError(null)
    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title,
          description: description.length > 0 ? description : null,
          object_id: input.objectId,
          executor_id: input.executorId,
        })
        .eq('id', taskId)
        .select('id')
        .maybeSingle()

      if (routeIdRef.current !== requestRouteId) {
        return false
      }

      if (error) {
        setSaveError(isPermissionError(error) ? savePermissionMessage : saveErrorMessage)
        return false
      }

      if (!data) {
        setSaveError(unavailableTaskMessage)
        return false
      }

      reloadTask()
      return true
    } catch {
      if (routeIdRef.current !== requestRouteId) {
        return false
      }

      setSaveError(saveErrorMessage)
      return false
    } finally {
      if (routeIdRef.current === requestRouteId) {
        setSaving(false)
      }
    }
  }

  const deleteTask = async (): Promise<DeleteTaskResult> => {
    if (!enabled || !task || deleting || saving) {
      return failedDelete()
    }

    const taskId = task.id
    const objectId = task.object_id
    const requestRouteId = routeId

    setDeleteError(null)
    setDeleting(true)

    try {
      const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .select('id')
        .maybeSingle()

      if (routeIdRef.current !== requestRouteId) {
        return failedDelete()
      }

      if (error) {
        setDeleteError(isPermissionError(error) ? deletePermissionMessage : deleteErrorMessage)
        return failedDelete()
      }

      if (!data) {
        setDeleteError(unavailableTaskMessage)
        return failedDelete()
      }

      return { deleted: true, objectId }
    } catch {
      if (routeIdRef.current !== requestRouteId) {
        return failedDelete()
      }

      setDeleteError(deleteErrorMessage)
      return failedDelete()
    } finally {
      if (routeIdRef.current === requestRouteId) {
        setDeleting(false)
      }
    }
  }

  return {
    objects,
    executors,
    optionsLoading,
    optionsError,
    reloadOptions,
    saving,
    saveError,
    deleting,
    deleteError,
    clearSaveError,
    updateTask,
    deleteTask,
  }
}

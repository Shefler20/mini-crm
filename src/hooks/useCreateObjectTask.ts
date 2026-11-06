import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.ts'
import type { CreateObjectTaskInput, ObjectExecutor } from '../types/objects.ts'

export interface CreateObjectTaskState {
  submitting: boolean
  error: string | null
  submit: (input: CreateObjectTaskInput) => Promise<boolean>
  clearError: () => void
}

interface Params {
  objectId: string | undefined
  authorId: string | undefined
  canCreate: boolean
  executors: ObjectExecutor[]
  onCreated: () => void
}

interface SubmitState {
  objectId: string | undefined
  submitting: boolean
  error: string | null
}

const saveErrorMessage = 'Не удалось создать задачу. Попробуйте ещё раз.'
const permissionErrorMessage = 'Недостаточно прав для создания задачи.'
const titleValidationMessage = 'Укажите название задачи.'
const executorValidationMessage = 'Выберите исполнителя из списка.'
const userValidationMessage = 'Не удалось определить текущего пользователя.'

const isPermissionError = (error: { code?: string; message?: string }): boolean => {
  const message = error.message?.toLowerCase() ?? ''

  return (
    error.code === '42501' ||
    message.includes('row-level security') ||
    message.includes('permission denied')
  )
}

const messageForError = (error: { code?: string; message?: string }, fallback: string): string => {
  return isPermissionError(error) ? permissionErrorMessage : fallback
}

export const useCreateObjectTask = ({
  objectId,
  authorId,
  canCreate,
  executors,
  onCreated,
}: Params): CreateObjectTaskState => {
  const objectIdRef = useRef(objectId)
  const submittingRef = useRef(false)
  const mountedRef = useRef(true)
  const [submitState, setSubmitState] = useState<SubmitState>({
    objectId,
    submitting: false,
    error: null,
  })

  useLayoutEffect(() => {
    objectIdRef.current = objectId
    submittingRef.current = false
  }, [objectId])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  const currentState = submitState.objectId === objectId ? submitState : null
  const submitting = currentState?.submitting ?? false
  const error = currentState?.error ?? null

  const clearError = () => {
    setSubmitState((current) => {
      return {
        objectId,
        submitting: current.objectId === objectId ? current.submitting : false,
        error: null,
      }
    })
  }

  const submit = async (input: CreateObjectTaskInput): Promise<boolean> => {
    if (!canCreate || submittingRef.current || !objectId) {
      return false
    }

    const trimmedTitle = input.title.trim()
    const trimmedDescription = input.description.trim()
    const selectedExecutor = executors.find((executor) => executor.id === input.executorId)

    if (!trimmedTitle) {
      setSubmitState({ objectId, submitting: false, error: titleValidationMessage })
      return false
    }

    if (!selectedExecutor) {
      setSubmitState({ objectId, submitting: false, error: executorValidationMessage })
      return false
    }

    if (!authorId) {
      setSubmitState({ objectId, submitting: false, error: userValidationMessage })
      return false
    }

    const savedObjectId = objectId
    const savedAuthorId = authorId
    let nextError: string | null = null

    submittingRef.current = true
    setSubmitState({ objectId: savedObjectId, submitting: true, error: null })

    try {
      const { error: insertError } = await supabase.from('tasks').insert({
        title: trimmedTitle,
        description: trimmedDescription.length > 0 ? trimmedDescription : null,
        object_id: savedObjectId,
        executor_id: selectedExecutor.id,
        author_id: savedAuthorId,
      })

      if (!mountedRef.current || objectIdRef.current !== savedObjectId) {
        return false
      }

      if (insertError) {
        nextError = messageForError(insertError, saveErrorMessage)
        return false
      }

      onCreated()
      return true
    } catch {
      if (!mountedRef.current || objectIdRef.current !== savedObjectId) {
        return false
      }

      nextError = saveErrorMessage
      return false
    } finally {
      if (mountedRef.current && objectIdRef.current === savedObjectId) {
        submittingRef.current = false
        setSubmitState({
          objectId: savedObjectId,
          submitting: false,
          error: nextError,
        })
      }
    }
  }

  return {
    submitting,
    error,
    submit,
    clearError,
  }
}

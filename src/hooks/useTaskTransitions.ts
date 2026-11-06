import { useState } from 'react'
import { supabase } from '../lib/supabase.ts'
import type { TaskDetails, TaskStatus } from './useTaskDetails.ts'

interface Params {
  task: TaskDetails | null
  routeId: string | undefined
  beginRequest: () => number
  isCurrentRequest: (requestId: number) => boolean
  completeRequest: (requestId: number, taskId: string) => Promise<void>
}

export interface TaskTransitionsState {
  comment: string
  commentError: string | null
  actionError: string | null
  pendingStatus: TaskStatus | null
  transitioning: boolean
  onCommentChange: (value: string) => void
  onExecutorAction: (nextStatus: TaskStatus) => void
  onAccept: () => void
  onRework: () => void
  clearFeedback: () => void
}

const notFoundMessage = 'Задача не найдена или недоступна.'
const transitionErrorMessage = 'Не удалось изменить статус. Попробуйте ещё раз.'
const commentRequiredMessage = 'Укажите комментарий для возврата на доработку.'

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

const messageForTransitionError = (error: unknown): string => {
  const { text, code } = readErrorText(error)
  const normalized = text.toLowerCase()

  if (normalized.includes('comment is required')) {
    return commentRequiredMessage
  }

  if (normalized.includes('not assigned')) {
    return 'Эта задача назначена другому исполнителю.'
  }

  if (normalized.includes('not allowed')) {
    return 'Этот переход статуса сейчас недоступен.'
  }

  if (normalized.includes('task not found')) {
    return notFoundMessage
  }

  if (normalized.includes('authentication required')) {
    return 'Не удалось подтвердить вход. Войдите снова.'
  }

  if (normalized.includes('profile not found')) {
    return 'Профиль пользователя не найден.'
  }

  if (
    code === '42501' ||
    normalized.includes('row-level security') ||
    normalized.includes('permission denied')
  ) {
    return 'Недостаточно прав для изменения статуса.'
  }

  return transitionErrorMessage
}

export const useTaskTransitions = ({
  task,
  routeId,
  beginRequest,
  isCurrentRequest,
  completeRequest,
}: Params): TaskTransitionsState => {
  const [boundRouteId, setBoundRouteId] = useState(routeId)
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<TaskStatus | null>(null)

  if (boundRouteId !== routeId) {
    setBoundRouteId(routeId)
    setComment('')
    setCommentError(null)
    setActionError(null)
    setPendingStatus(null)
  }

  const clearFeedback = () => {
    setCommentError(null)
    setActionError(null)
  }

  const runTransition = (nextStatus: TaskStatus, nextComment: string | null) => {
    if (!task || pendingStatus !== null) {
      return
    }

    const taskId = task.id
    const requestId = beginRequest()

    setActionError(null)
    setCommentError(null)
    setPendingStatus(nextStatus)

    void (async () => {
      try {
        const { error } = await supabase.rpc('transition_task', {
          p_task_id: taskId,
          p_new_status: nextStatus,
          p_comment: nextComment,
        })

        if (!isCurrentRequest(requestId)) {
          return
        }

        if (error) {
          setActionError(messageForTransitionError(error))
          return
        }

        setComment('')
        await completeRequest(requestId, taskId)
      } catch {
        if (!isCurrentRequest(requestId)) {
          return
        }

        setActionError(transitionErrorMessage)
      } finally {
        if (isCurrentRequest(requestId)) {
          setPendingStatus(null)
        }
      }
    })()
  }

  const onCommentChange = (value: string) => {
    setComment(value)
    setCommentError(null)
  }

  const onExecutorAction = (nextStatus: TaskStatus) => {
    runTransition(nextStatus, null)
  }

  const onAccept = () => {
    runTransition('accepted', null)
  }

  const onRework = () => {
    const trimmedComment = comment.trim()

    if (trimmedComment.length === 0) {
      setCommentError(commentRequiredMessage)
      setActionError(null)
      return
    }

    runTransition('rework', trimmedComment)
  }

  return {
    comment,
    commentError,
    actionError,
    pendingStatus,
    transitioning: pendingStatus !== null,
    onCommentChange,
    onExecutorAction,
    onAccept,
    onRework,
    clearFeedback,
  }
}

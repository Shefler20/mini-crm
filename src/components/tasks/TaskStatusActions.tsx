import type * as React from 'react'
import type { UserRole } from '../../types/auth.ts'
import type { TaskStatus } from '../../hooks/useTaskDetails.ts'

interface Props {
  status: TaskStatus
  role: UserRole | undefined
  isAssignedExecutor: boolean
  comment: string
  commentError: string | null
  actionError: string | null
  pendingStatus: TaskStatus | null
  onCommentChange: (value: string) => void
  onExecutorAction: (nextStatus: TaskStatus) => void
  onAccept: () => void
  onRework: () => void
}

interface StatusAction {
  label: string
  pendingLabel: string
  nextStatus: TaskStatus
}

const noActionsMessage = 'Для этой задачи сейчас нет доступных вам действий.'

const inputClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

const primaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-blue-400'

const secondaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60'

const executorActions: Partial<Record<TaskStatus, StatusAction>> = {
  new: {
    label: 'Взять в работу',
    pendingLabel: 'Берём в работу...',
    nextStatus: 'in_progress',
  },
  in_progress: {
    label: 'Отправить на проверку',
    pendingLabel: 'Отправляем...',
    nextStatus: 'in_review',
  },
  rework: {
    label: 'Возобновить работу',
    pendingLabel: 'Возобновляем...',
    nextStatus: 'in_progress',
  },
}

const TaskStatusActions: React.FC<Props> = ({
  status,
  role,
  isAssignedExecutor,
  comment,
  commentError,
  actionError,
  pendingStatus,
  onCommentChange,
  onExecutorAction,
  onAccept,
  onRework,
}) => {
  const transitioning = pendingStatus !== null
  const executorAction = role === 'executor' && isAssignedExecutor ? (executorActions[status] ?? null) : null
  const managerCanReview = role === 'manager' && status === 'in_review'

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold text-slate-900">Доступные действия</h2>

      {executorAction ? (
        <div className="mt-6">
          <button
            type="button"
            className={primaryButtonClassName}
            disabled={transitioning}
            onClick={() => {
              onExecutorAction(executorAction.nextStatus)
            }}
          >
            {pendingStatus === executorAction.nextStatus ? executorAction.pendingLabel : executorAction.label}
          </button>
        </div>
      ) : null}

      {managerCanReview ? (
        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="rework-comment" className="text-sm font-medium text-slate-700">
              Комментарий для доработки
            </label>
            <textarea
              id="rework-comment"
              name="comment"
              value={comment}
              rows={4}
              disabled={transitioning}
              placeholder="Что нужно исправить"
              className={`${inputClassName} min-h-28 py-2`}
              onChange={(event) => {
                onCommentChange(event.target.value)
              }}
            />
            <p className="text-sm text-slate-500">Обязателен при возврате на доработку.</p>
            {commentError ? (
              <p className="text-sm text-red-600" role="alert">
                {commentError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className={primaryButtonClassName} disabled={transitioning} onClick={onAccept}>
              {pendingStatus === 'accepted' ? 'Принимаем...' : 'Принять'}
            </button>
            <button type="button" className={secondaryButtonClassName} disabled={transitioning} onClick={onRework}>
              {pendingStatus === 'rework' ? 'Возвращаем...' : 'Вернуть на доработку'}
            </button>
          </div>
        </div>
      ) : null}

      {!executorAction && !managerCanReview ? <p className="mt-3 text-slate-600">{noActionsMessage}</p> : null}

      {actionError ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}

      {transitioning ? (
        <p className="mt-4 text-sm text-slate-600" role="status" aria-live="polite">
          Обновляем статус
        </p>
      ) : null}
    </section>
  )
}

export default TaskStatusActions

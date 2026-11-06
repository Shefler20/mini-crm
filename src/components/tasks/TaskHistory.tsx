import type * as React from 'react'
import type { HistoryEntry, TaskStatus } from '../../hooks/useTaskDetails.ts'

interface Props {
  history: HistoryEntry[]
  error: string | null
  retryDisabled: boolean
  onRetry: () => void
}

const unknownActorName = 'Пользователь'

const primaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-blue-400'

const statusLabels: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  in_review: 'На проверке',
  accepted: 'Принята',
  rework: 'На доработке',
}

const formatDateTime = (value: string): string => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Дата не указана'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatHistoryChange = (entry: HistoryEntry): string => {
  if (entry.old_status === null) {
    return 'Создание задачи'
  }

  return `${statusLabels[entry.old_status]} → ${statusLabels[entry.new_status]}`
}

const TaskHistory: React.FC<Props> = ({ history, error, retryDisabled, onRetry }) => {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold text-slate-900">История изменений</h2>

      {error ? (
        <div className="mt-6" role="alert">
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" className={`${primaryButtonClassName} mt-4`} disabled={retryDisabled} onClick={onRetry}>
            Повторить
          </button>
        </div>
      ) : null}

      {!error && history.length === 0 ? <p className="mt-3 text-slate-600">История изменений пока пуста.</p> : null}

      {history.length > 0 ? (
        <ol className="mt-6 flex flex-col gap-3">
          {history.map((entry) => {
            const entryComment = entry.comment?.trim()

            return (
              <li key={entry.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-slate-900">{entry.actorName ?? unknownActorName}</p>
                  <time className="text-sm text-slate-500" dateTime={entry.created_at}>
                    {formatDateTime(entry.created_at)}
                  </time>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-800">{formatHistoryChange(entry)}</p>
                {entryComment ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{entryComment}</p>
                ) : null}
              </li>
            )
          })}
        </ol>
      ) : null}
    </section>
  )
}

export default TaskHistory

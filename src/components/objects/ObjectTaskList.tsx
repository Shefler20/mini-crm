import type * as React from 'react'
import { Link } from 'react-router-dom'
import type { ObjectTask } from '../../types/objects.ts'

interface Props {
  tasks: ObjectTask[]
  error: string | null
  onRetry: () => void
}

const emptyTasksMessage = 'По этому объекту пока нет задач.'

const primaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-blue-400'

const statusLabels: Record<ObjectTask['status'], string> = {
  new: 'Новая',
  in_progress: 'В работе',
  in_review: 'На проверке',
  accepted: 'Принята',
  rework: 'На доработке',
}

const statusBadgeClassNames: Record<ObjectTask['status'], string> = {
  new: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-800',
  in_review: 'bg-violet-100 text-violet-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rework: 'bg-amber-100 text-amber-900',
}

const formatCreatedAt = (value: string): string => {
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

const ObjectTaskList: React.FC<Props> = ({ tasks, error, onRetry }) => {
  return (
    <>
      {error ? (
        <div className="mt-6" role="alert">
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" className={`${primaryButtonClassName} mt-4`} onClick={onRetry}>
            Повторить
          </button>
        </div>
      ) : null}

      {!error && tasks.length === 0 ? <p className="mt-6 text-slate-600">{emptyTasksMessage}</p> : null}

      {tasks.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-3">
          {tasks.map((task) => {
            const description = task.description?.trim()

            return (
              <li key={task.id} className="rounded-xl border border-slate-200 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      to={`/tasks/${task.id}`}
                      className="text-lg font-semibold text-slate-900 underline-offset-4 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    >
                      {task.title}
                    </Link>
                    <p className={`mt-2 line-clamp-3 text-sm ${description ? 'text-slate-600' : 'text-slate-400'}`}>
                      {description || 'Описание не указано'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClassNames[task.status]}`}
                  >
                    {statusLabels[task.status]}
                  </span>
                </div>
                <dl className="mt-4 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-6">
                  <div>
                    <dt className="inline font-medium text-slate-700">Исполнитель: </dt>
                    <dd className="inline">{task.executorName ?? 'Имя недоступно'}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-slate-700">Создана: </dt>
                    <dd className="inline">{formatCreatedAt(task.created_at)}</dd>
                  </div>
                </dl>
              </li>
            )
          })}
        </ul>
      ) : null}
    </>
  )
}

export default ObjectTaskList

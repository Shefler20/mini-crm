import type * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { TaskDetails, TaskStatus } from '../../hooks/useTaskDetails.ts'

interface Props {
  task: TaskDetails
}

const unavailableObjectName = 'Название недоступно'
const unavailableObjectAddress = 'Адрес недоступен'
const unavailablePersonName = 'Имя недоступно'
const emptyDescription = 'Описание не указано'

const backLinkClassName =
  'inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30'

const statusLabels: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  in_review: 'На проверке',
  accepted: 'Принята',
  rework: 'На доработке',
}

const statusBadgeClassNames: Record<TaskStatus, string> = {
  new: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-800',
  in_review: 'bg-violet-100 text-violet-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rework: 'bg-amber-100 text-amber-900',
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

const TaskInfo: React.FC<Props> = ({ task }) => {
  const description = task.description?.trim() ?? ''

  return (
    <>
      <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <Link to={`/objects/${task.object_id}`} className={backLinkClassName}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          К объекту
        </Link>
        <h1 className="mt-6 text-3xl font-bold break-words text-slate-900">{task.title}</h1>
        <p className={`mt-3 whitespace-pre-wrap ${description ? 'text-slate-600' : 'text-slate-400'}`}>
          {description || emptyDescription}
        </p>
        <dl className="mt-6 flex flex-col gap-2 text-sm text-slate-600">
          <div>
            <dt className="inline font-medium text-slate-700">Объект: </dt>
            <dd className="inline">{task.objectName ?? unavailableObjectName}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-700">Адрес: </dt>
            <dd className="inline">{task.objectAddress ?? unavailableObjectAddress}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-700">Исполнитель: </dt>
            <dd className="inline">{task.executorName ?? unavailablePersonName}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-700">Постановщик: </dt>
            <dd className="inline">{task.authorName ?? unavailablePersonName}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-slate-700">Создана: </dt>
            <dd className="inline">
              <time dateTime={task.created_at}>{formatDateTime(task.created_at)}</time>
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Текущий статус</h2>
        <span
          className={`mt-4 inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClassNames[task.status]}`}
        >
          {statusLabels[task.status]}
        </span>
      </section>
    </>
  )
}

export default TaskInfo

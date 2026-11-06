import type * as React from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import { supabase } from '../lib/supabase.ts'

type TaskStatus = 'new' | 'in_progress' | 'in_review' | 'accepted' | 'rework'

interface TaskObject {
  name: string
  address: string
}

interface AssignedTask {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  created_at: string
  object_id: string
  executor_id: string
  objectName: string | null
  objectAddress: string | null
}

interface LoadedTasks {
  userId: string
  tasks: AssignedTask[]
  error: string | null
}

const loadErrorMessage = 'Не удалось загрузить задачи. Попробуйте ещё раз.'
const emptyTasksMessage = 'У вас пока нет назначенных задач'
const unavailableObjectName = 'Название недоступно'
const unavailableObjectAddress = 'Адрес недоступен'

const primaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30'

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

const isTaskStatus = (value: unknown): value is TaskStatus => {
  return (
    value === 'new' ||
    value === 'in_progress' ||
    value === 'in_review' ||
    value === 'accepted' ||
    value === 'rework'
  )
}

const isTaskObject = (value: unknown): value is TaskObject => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>

  return typeof record.name === 'string' && typeof record.address === 'string'
}

const readTaskObject = (value: unknown): TaskObject | null | undefined => {
  if (value === null) {
    return null
  }

  if (isTaskObject(value)) {
    return value
  }

  if (!Array.isArray(value)) {
    return undefined
  }

  if (value.length === 0) {
    return null
  }

  if (value.length === 1 && isTaskObject(value[0])) {
    return value[0]
  }

  return undefined
}

const parseTask = (value: unknown): AssignedTask | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  const description = record.description
  const relatedObject = readTaskObject(record.objects)

  if (
    typeof record.id !== 'string' ||
    typeof record.title !== 'string' ||
    (description !== null && typeof description !== 'string') ||
    !isTaskStatus(record.status) ||
    typeof record.created_at !== 'string' ||
    typeof record.object_id !== 'string' ||
    typeof record.executor_id !== 'string' ||
    relatedObject === undefined
  ) {
    return null
  }

  const objectName = relatedObject?.name.trim() ?? ''
  const objectAddress = relatedObject?.address.trim() ?? ''

  return {
    id: record.id,
    title: record.title,
    description,
    status: record.status,
    created_at: record.created_at,
    object_id: record.object_id,
    executor_id: record.executor_id,
    objectName: objectName.length > 0 ? objectName : null,
    objectAddress: objectAddress.length > 0 ? objectAddress : null,
  }
}

const parseTaskList = (value: unknown): AssignedTask[] | null => {
  if (!Array.isArray(value)) {
    return null
  }

  const tasks: AssignedTask[] = []

  for (const item of value) {
    const task = parseTask(item)

    if (!task) {
      return null
    }

    tasks.push(task)
  }

  return tasks
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

const queryMyTasks = (executorId: string) => {
  return supabase
    .from('tasks')
    .select(
      'id, title, description, status, created_at, object_id, executor_id, objects!tasks_object_id_fkey(name, address)',
    )
    .eq('executor_id', executorId)
    .order('created_at', { ascending: false })
}

const MyTasksPage: React.FC = () => {
  const { user } = useAuth()
  const userId = user?.id
  const [details, setDetails] = useState<LoadedTasks | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!userId) {
      return
    }

    let active = true

    void queryMyTasks(userId).then(
      ({ data, error }) => {
        if (!active) {
          return
        }

        const tasks = parseTaskList(data)

        if (error || !tasks) {
          setDetails({ userId, tasks: [], error: loadErrorMessage })
          return
        }

        setDetails({ userId, tasks, error: null })
      },
      () => {
        if (!active) {
          return
        }

        setDetails({ userId, tasks: [], error: loadErrorMessage })
      },
    )

    return () => {
      active = false
    }
  }, [userId, reloadKey])

  const current = details?.userId === userId ? details : null
  const loading = Boolean(userId) && current === null
  const tasks = current?.tasks ?? []
  const loadError = current?.error ?? null
  const showEmpty = Boolean(userId) && !loading && !loadError && tasks.length === 0

  const reload = () => {
    setDetails(null)
    setReloadKey((currentKey) => currentKey + 1)
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold text-slate-900">Мои задачи</h1>
        <p className="mt-3 text-slate-600">Список задач, назначенных текущему сотруднику.</p>
      </section>

      {loading ? (
        <section
          className="flex items-center justify-center rounded-xl bg-white px-6 py-16 shadow-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-3">
            <span
              className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-slate-600">Загрузка задач</p>
          </div>
        </section>
      ) : null}

      {!loading && loadError ? (
        <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8" role="alert">
          <h2 className="text-lg font-semibold text-slate-900">Не удалось загрузить задачи</h2>
          <p className="mt-3 text-slate-600">{loadError}</p>
          <button type="button" className={`${primaryButtonClassName} mt-6`} onClick={reload}>
            Повторить
          </button>
        </section>
      ) : null}

      {showEmpty ? (
        <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8" role="status">
          <h2 className="text-lg font-semibold text-slate-900">{emptyTasksMessage}</h2>
          <p className="mt-3 text-slate-600">
            Когда постановщик назначит вам задачу, она появится в этом списке.
          </p>
        </section>
      ) : null}

      {tasks.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {tasks.map((task) => {
            const description = task.description?.trim()

            return (
              <li key={task.id}>
                <Link
                  to={`/tasks/${task.id}`}
                  className="block rounded-xl bg-white p-5 shadow-sm transition hover:ring-2 hover:ring-blue-600/20 focus:outline-none focus:ring-2 focus:ring-blue-600/30 sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-slate-900">{task.title}</h2>
                      <p
                        className={`mt-2 line-clamp-3 text-sm ${description ? 'text-slate-600' : 'text-slate-400'}`}
                      >
                        {description || 'Описание не указано'}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClassNames[task.status]}`}
                    >
                      {statusLabels[task.status]}
                    </span>
                  </div>
                  <dl className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
                    <div>
                      <dt className="inline font-medium text-slate-700">Объект: </dt>
                      <dd className="inline">{task.objectName ?? unavailableObjectName}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-slate-700">Адрес: </dt>
                      <dd className="inline">{task.objectAddress ?? unavailableObjectAddress}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-slate-700">Создана: </dt>
                      <dd className="inline">{formatCreatedAt(task.created_at)}</dd>
                    </div>
                  </dl>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export default MyTasksPage

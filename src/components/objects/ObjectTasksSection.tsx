import type * as React from 'react'
import { useState } from 'react'
import type { UserRole } from '../../types/auth.ts'
import type { CreateObjectTaskInput, ObjectExecutor, ObjectTask } from '../../types/objects.ts'
import CreateTaskForm from './CreateTaskForm.tsx'
import ObjectTaskList from './ObjectTaskList.tsx'

interface Props {
  visible: boolean
  role: UserRole | undefined
  canManage: boolean
  tasks: ObjectTask[]
  tasksError: string | null
  onRetryTasks: () => void
  executors: ObjectExecutor[]
  executorsLoading: boolean
  executorsError: string | null
  onRetryExecutors: () => void
  submitting: boolean
  createError: string | null
  onClearCreateError: () => void
  onCreateTask: (input: CreateObjectTaskInput) => Promise<boolean>
}

const emptyExecutorsMessage = 'Нет исполнителей, которых можно назначить.'

const primaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-blue-400'

const secondaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60'

const ObjectTasksSection: React.FC<Props> = ({
  visible,
  role,
  canManage,
  tasks,
  tasksError,
  onRetryTasks,
  executors,
  executorsLoading,
  executorsError,
  onRetryExecutors,
  submitting,
  createError,
  onClearCreateError,
  onCreateTask,
}) => {
  const [formOpen, setFormOpen] = useState(false)
  const tasksDescription =
    role === 'executor' ? 'Задачи этого объекта, назначенные вам.' : 'Все задачи этого объекта.'
  const executorsEmpty = canManage && !executorsLoading && executorsError === null && executors.length === 0
  const formLocked = submitting || executorsLoading || executorsEmpty || executorsError !== null

  const openForm = () => {
    onClearCreateError()
    setFormOpen(true)
  }

  const closeForm = () => {
    if (submitting) {
      return
    }

    onClearCreateError()
    setFormOpen(false)
  }

  const handleCreate = (input: CreateObjectTaskInput) => {
    void onCreateTask(input).then((created) => {
      if (created) {
        setFormOpen(false)
      }
    })
  }

  return (
    <section hidden={!visible} className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Задачи объекта</h2>
          <p className="mt-3 text-slate-600">{tasksDescription}</p>
        </div>
        {canManage && !formOpen ? (
          <button type="button" className={primaryButtonClassName} onClick={openForm}>
            Добавить задачу
          </button>
        ) : null}
      </div>

      {canManage && executorsLoading ? (
        <p className="mt-6 text-sm text-slate-600" role="status">
          Загрузка исполнителей
        </p>
      ) : null}

      {executorsError ? (
        <div className="mt-6" role="alert">
          <p className="text-sm text-red-600">{executorsError}</p>
          <button type="button" className={`${secondaryButtonClassName} mt-4`} onClick={onRetryExecutors}>
            Повторить
          </button>
        </div>
      ) : null}

      {executorsEmpty ? <p className="mt-6 text-sm text-slate-600">{emptyExecutorsMessage}</p> : null}

      {canManage && formOpen ? (
        <CreateTaskForm
          executors={executors}
          submitting={submitting}
          locked={formLocked}
          error={createError}
          onSubmit={handleCreate}
          onCancel={closeForm}
        />
      ) : null}

      <ObjectTaskList tasks={tasks} error={tasksError} onRetry={onRetryTasks} />
    </section>
  )
}

export default ObjectTasksSection

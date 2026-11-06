import type * as React from 'react'
import { useState } from 'react'
import type { TaskDetails } from '../../hooks/useTaskDetails.ts'
import type { TaskExecutorOption, TaskObjectOption, TaskUpdateInput } from '../../hooks/useTaskManagement.ts'

interface Props {
  task: TaskDetails
  objects: TaskObjectOption[]
  executors: TaskExecutorOption[]
  optionsLoading: boolean
  optionsError: string | null
  onRetryOptions: () => void
  saving: boolean
  saveError: string | null
  onSubmit: (values: TaskUpdateInput) => Promise<boolean>
  onCancel: () => void
}

const titleValidationMessage = 'Укажите название задачи.'
const objectValidationMessage = 'Выберите объект из списка.'
const executorValidationMessage = 'Выберите исполнителя из списка.'
const emptyObjectsMessage = 'Нет объектов, которые можно выбрать.'
const emptyExecutorsMessage = 'Нет исполнителей, которых можно назначить.'

const inputClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

const primaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-blue-400'

const secondaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60'

const TaskEditForm: React.FC<Props> = ({
  task,
  objects,
  executors,
  optionsLoading,
  optionsError,
  onRetryOptions,
  saving,
  saveError,
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [objectId, setObjectId] = useState(task.object_id)
  const [executorId, setExecutorId] = useState(task.executor_id)
  const [validationError, setValidationError] = useState<string | null>(null)

  const listsUnavailable = optionsLoading || optionsError !== null || objects.length === 0 || executors.length === 0
  const locked = saving || listsUnavailable
  const visibleError = validationError ?? saveError

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (saving) {
      return
    }

    const trimmedTitle = title.trim()

    if (trimmedTitle.length === 0) {
      setValidationError(titleValidationMessage)
      return
    }

    if (!objects.some((object) => object.id === objectId)) {
      setValidationError(objectValidationMessage)
      return
    }

    if (!executors.some((executor) => executor.id === executorId)) {
      setValidationError(executorValidationMessage)
      return
    }

    setValidationError(null)

    void onSubmit({
      title: trimmedTitle,
      description,
      objectId,
      executorId,
    })
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold text-slate-900">Редактирование задачи</h2>

        {optionsLoading ? (
          <p className="text-sm text-slate-600" role="status">
            Загрузка объектов и исполнителей
          </p>
        ) : null}

        {optionsError ? (
          <div role="alert">
            <p className="text-sm text-red-600">{optionsError}</p>
            <button type="button" className={`${secondaryButtonClassName} mt-4`} onClick={onRetryOptions}>
              Повторить
            </button>
          </div>
        ) : null}

        {!optionsLoading && !optionsError && objects.length === 0 ? (
          <p className="text-sm text-slate-600">{emptyObjectsMessage}</p>
        ) : null}

        {!optionsLoading && !optionsError && executors.length === 0 ? (
          <p className="text-sm text-slate-600">{emptyExecutorsMessage}</p>
        ) : null}

        <div className="flex flex-col gap-2">
          <label htmlFor="task-edit-title" className="text-sm font-medium text-slate-700">
            Название задачи
          </label>
          <input
            id="task-edit-title"
            name="title"
            type="text"
            value={title}
            disabled={locked}
            className={`${inputClassName} h-11`}
            onChange={(event) => {
              setTitle(event.target.value)
              setValidationError(null)
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="task-edit-description" className="text-sm font-medium text-slate-700">
            Описание
          </label>
          <textarea
            id="task-edit-description"
            name="description"
            value={description}
            rows={4}
            disabled={locked}
            className={`${inputClassName} min-h-28 py-2`}
            onChange={(event) => {
              setDescription(event.target.value)
              setValidationError(null)
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="task-edit-object" className="text-sm font-medium text-slate-700">
            Объект
          </label>
          <select
            id="task-edit-object"
            name="object"
            value={objectId}
            disabled={locked}
            className={`${inputClassName} h-11`}
            onChange={(event) => {
              setObjectId(event.target.value)
              setValidationError(null)
            }}
          >
            <option value="">Выберите объект</option>
            {objects.map((object) => (
              <option key={object.id} value={object.id}>
                {object.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="task-edit-executor" className="text-sm font-medium text-slate-700">
            Исполнитель
          </label>
          <select
            id="task-edit-executor"
            name="executor"
            value={executorId}
            disabled={locked}
            className={`${inputClassName} h-11`}
            onChange={(event) => {
              setExecutorId(event.target.value)
              setValidationError(null)
            }}
          >
            <option value="">Выберите исполнителя</option>
            {executors.map((executor) => (
              <option key={executor.id} value={executor.id}>
                {executor.full_name}
              </option>
            ))}
          </select>
        </div>

        {visibleError ? (
          <p className="text-sm text-red-600" role="alert">
            {visibleError}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" className={primaryButtonClassName} disabled={locked}>
            {saving ? 'Сохраняем...' : 'Сохранить'}
          </button>
          <button type="button" className={secondaryButtonClassName} disabled={saving} onClick={onCancel}>
            Отмена
          </button>
        </div>
      </form>
    </section>
  )
}

export default TaskEditForm

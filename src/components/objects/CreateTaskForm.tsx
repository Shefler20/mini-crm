import type * as React from 'react'
import { useState } from 'react'
import type { CreateObjectTaskInput, ObjectExecutor } from '../../types/objects.ts'

interface Props {
  executors: ObjectExecutor[]
  submitting: boolean
  locked: boolean
  error: string | null
  onSubmit: (input: CreateObjectTaskInput) => void
  onCancel: () => void
}

const inputClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

const primaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-blue-400'

const secondaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60'

const CreateTaskForm: React.FC<Props> = ({ executors, submitting, locked, error, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [executorId, setExecutorId] = useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({ title, description, executorId })
  }

  return (
    <form className="mt-6 flex flex-col gap-5 border-t border-slate-200 pt-6" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold text-slate-900">Новая задача</h3>
      <div className="flex flex-col gap-2">
        <label htmlFor="task-title" className="text-sm font-medium text-slate-700">
          Название задачи
        </label>
        <input
          id="task-title"
          name="title"
          type="text"
          value={title}
          disabled={submitting}
          className={`${inputClassName} h-11`}
          onChange={(event) => {
            setTitle(event.target.value)
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="task-description" className="text-sm font-medium text-slate-700">
          Описание
        </label>
        <textarea
          id="task-description"
          name="description"
          value={description}
          disabled={submitting}
          rows={4}
          className={`${inputClassName} min-h-28 py-2`}
          onChange={(event) => {
            setDescription(event.target.value)
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="task-executor" className="text-sm font-medium text-slate-700">
          Исполнитель
        </label>
        <select
          id="task-executor"
          name="executor"
          value={executorId}
          disabled={locked}
          className={`${inputClassName} h-11`}
          onChange={(event) => {
            setExecutorId(event.target.value)
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
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" className={primaryButtonClassName} disabled={locked}>
          {submitting ? 'Создаём...' : 'Создать задачу'}
        </button>
        <button type="button" className={secondaryButtonClassName} disabled={submitting} onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  )
}

export default CreateTaskForm

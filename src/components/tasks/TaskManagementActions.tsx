import type * as React from 'react'

interface Props {
  taskTitle: string
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
  disabled: boolean
  error: string | null
}

const secondaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60'

const dangerButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60'

const TaskManagementActions: React.FC<Props> = ({ taskTitle, onEdit, onDelete, deleting, disabled, error }) => {
  const locked = disabled || deleting

  const handleEdit = () => {
    if (locked) {
      return
    }

    onEdit()
  }

  const handleDelete = () => {
    if (locked) {
      return
    }

    const confirmed = window.confirm(`Удалить задачу «${taskTitle}»?`)

    if (!confirmed) {
      return
    }

    onDelete()
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold text-slate-900">Управление задачей</h2>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" className={secondaryButtonClassName} disabled={locked} onClick={handleEdit}>
          Редактировать
        </button>
        <button type="button" className={dangerButtonClassName} disabled={locked} onClick={handleDelete}>
          {deleting ? 'Удаляем...' : 'Удалить задачу'}
        </button>
      </div>
      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}

export default TaskManagementActions

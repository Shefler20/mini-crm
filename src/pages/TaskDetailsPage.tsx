import type * as React from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import TaskEditForm from '../components/tasks/TaskEditForm.tsx'
import TaskHistory from '../components/tasks/TaskHistory.tsx'
import TaskInfo from '../components/tasks/TaskInfo.tsx'
import TaskManagementActions from '../components/tasks/TaskManagementActions.tsx'
import TaskStatusActions from '../components/tasks/TaskStatusActions.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useTaskDetails } from '../hooks/useTaskDetails.ts'
import { useTaskManagement } from '../hooks/useTaskManagement.ts'
import { useTaskTransitions } from '../hooks/useTaskTransitions.ts'

const notFoundMessage = 'Задача не найдена или недоступна.'

const backLinkClassName =
  'inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30'

const primaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-blue-400'

const TaskDetailsPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const canManage = profile?.role === 'manager'
  const {
    loading,
    task,
    history,
    taskError,
    historyError,
    notFound,
    reload: reloadTask,
    beginRequest,
    isCurrentRequest,
    completeRequest,
  } = useTaskDetails(id)
  const {
    comment,
    commentError,
    actionError,
    pendingStatus,
    transitioning,
    onCommentChange,
    onExecutorAction,
    onAccept,
    onRework,
    clearFeedback,
  } = useTaskTransitions({
    task,
    routeId: id,
    beginRequest,
    isCurrentRequest,
    completeRequest,
  })

  const [boundTaskId, setBoundTaskId] = useState(id)
  const [editing, setEditing] = useState(false)

  if (boundTaskId !== id) {
    setBoundTaskId(id)
    setEditing(false)
  }

  const reload = () => {
    clearFeedback()
    reloadTask()
  }

  const {
    objects,
    executors,
    optionsLoading,
    optionsError,
    reloadOptions,
    saving,
    saveError,
    deleting,
    deleteError,
    clearSaveError,
    updateTask,
    deleteTask,
  } = useTaskManagement({
    task,
    enabled: canManage,
    routeId: id,
    reloadTask: reload,
  })

  const assignedExecutor = Boolean(task && user && task.executor_id === user.id)

  const openEditor = () => {
    clearSaveError()
    setEditing(true)
  }

  const closeEditor = () => {
    if (saving) {
      return
    }

    clearSaveError()
    setEditing(false)
  }

  const handleDelete = async () => {
    const result = await deleteTask()

    if (result.deleted) {
      navigate(`/objects/${result.objectId}`)
    }
  }

  return (
    <div className="flex flex-col gap-6">
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
            <p className="text-sm font-medium text-slate-600">Загрузка задачи</p>
          </div>
        </section>
      ) : null}

      {!loading && taskError ? (
        <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8" role="alert">
          <h1 className="text-lg font-semibold text-slate-900">Не удалось загрузить задачу</h1>
          <p className="mt-3 text-slate-600">{taskError}</p>
          <button type="button" className={`${primaryButtonClassName} mt-6`} onClick={reload}>
            Повторить
          </button>
        </section>
      ) : null}

      {!loading && notFound ? (
        <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8" role="status">
          <h1 className="text-lg font-semibold text-slate-900">{notFoundMessage}</h1>
          <p className="mt-3 text-slate-600">Проверьте ссылку или вернитесь к списку объектов.</p>
          <Link to="/objects" className={`${backLinkClassName} mt-6`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            К объектам
          </Link>
        </section>
      ) : null}

      {task ? (
        <>
          <TaskInfo task={task} />
          {canManage ? (
            <TaskManagementActions
              taskTitle={task.title}
              onEdit={openEditor}
              onDelete={() => {
                void handleDelete()
              }}
              deleting={deleting}
              disabled={saving || transitioning}
              error={deleteError}
            />
          ) : null}
          {canManage && editing ? (
            <TaskEditForm
              key={task.id}
              task={task}
              objects={objects}
              executors={executors}
              optionsLoading={optionsLoading}
              optionsError={optionsError}
              onRetryOptions={reloadOptions}
              saving={saving}
              saveError={saveError}
              onSubmit={async (values) => {
                const saved = await updateTask(values)

                if (saved) {
                  setEditing(false)
                }

                return saved
              }}
              onCancel={closeEditor}
            />
          ) : null}
          <TaskStatusActions
            status={task.status}
            role={profile?.role}
            isAssignedExecutor={assignedExecutor}
            comment={comment}
            commentError={commentError}
            actionError={actionError}
            pendingStatus={pendingStatus}
            onCommentChange={onCommentChange}
            onExecutorAction={onExecutorAction}
            onAccept={onAccept}
            onRework={onRework}
          />
          <TaskHistory history={history} error={historyError} retryDisabled={transitioning} onRetry={reload} />
        </>
      ) : null}
    </div>
  )
}

export default TaskDetailsPage

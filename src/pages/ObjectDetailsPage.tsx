import type * as React from 'react'
import { useParams } from 'react-router-dom'
import ObjectDetailsHeader from '../components/objects/ObjectDetailsHeader.tsx'
import ObjectTasksSection from '../components/objects/ObjectTasksSection.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import { useCreateObjectTask } from '../hooks/useCreateObjectTask.ts'
import { useObjectDetails } from '../hooks/useObjectDetails.ts'
import { useObjectExecutors } from '../hooks/useObjectExecutors.ts'

const ObjectDetailsPage: React.FC = () => {
  const { id } = useParams()
  const { profile, user } = useAuth()
  const canManage = profile?.role === 'manager'
  const { object, tasks, loading, objectError, tasksError, notFound, reload } = useObjectDetails(id)
  const {
    executors,
    loading: executorsLoading,
    error: executorsError,
    reload: reloadExecutors,
  } = useObjectExecutors(canManage)
  const { submitting, error: createError, submit, clearError } = useCreateObjectTask({
    objectId: id,
    authorId: user?.id,
    canCreate: canManage && object?.id === id,
    executors,
    onCreated: reload,
  })

  return (
    <div className="flex flex-col gap-6">
      <ObjectDetailsHeader
        loading={loading}
        object={object}
        error={objectError}
        notFound={notFound}
        onRetry={reload}
      />
      {id ? (
        <ObjectTasksSection
          key={id}
          visible={object !== null}
          role={profile?.role}
          canManage={canManage}
          tasks={tasks}
          tasksError={tasksError}
          onRetryTasks={reload}
          executors={executors}
          executorsLoading={executorsLoading}
          executorsError={executorsError}
          onRetryExecutors={reloadExecutors}
          submitting={submitting}
          createError={createError}
          onClearCreateError={clearError}
          onCreateTask={submit}
        />
      ) : null}
    </div>
  )
}

export default ObjectDetailsPage

import type * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import { supabase } from '../lib/supabase.ts'

interface ConstructionObject {
  id: string
  name: string
  address: string
  created_at: string
}

type FormMode = 'create' | 'edit'

const loadErrorMessage = 'Не удалось загрузить объекты. Попробуйте ещё раз.'
const saveErrorMessage = 'Не удалось сохранить объект. Попробуйте ещё раз.'
const deleteErrorMessage = 'Не удалось удалить объект. Попробуйте ещё раз.'
const permissionErrorMessage = 'Недостаточно прав для изменения объектов.'
const validationErrorMessage = 'Укажите название и адрес объекта.'

const inputClassName =
  'h-11 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

const primaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-blue-400'

const secondaryButtonClassName =
  'inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60'

const dangerButtonClassName =
  'inline-flex h-10 items-center justify-center rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600/30 disabled:cursor-not-allowed disabled:opacity-60'

const isConstructionObject = (value: unknown): value is ConstructionObject => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.address === 'string' &&
    typeof record.created_at === 'string'
  )
}

const isConstructionObjectList = (value: unknown): value is ConstructionObject[] => {
  return Array.isArray(value) && value.every(isConstructionObject)
}

const isPermissionError = (error: { code?: string; message?: string }): boolean => {
  const message = error.message?.toLowerCase() ?? ''

  return (
    error.code === '42501' ||
    message.includes('row-level security') ||
    message.includes('permission denied')
  )
}

const messageForError = (error: { code?: string; message?: string }, fallback: string): string => {
  return isPermissionError(error) ? permissionErrorMessage : fallback
}

const queryObjects = () => {
  return supabase
    .from('objects')
    .select('id, name, address, created_at')
    .order('created_at', { ascending: false })
}

const ObjectsPage: React.FC = () => {
  const { profile, user } = useAuth()
  const canManage = profile?.role === 'manager'

  const [objects, setObjects] = useState<ConstructionObject[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const requestId = useRef(0)

  const loadObjects = useCallback(async () => {
    const currentRequest = requestId.current + 1
    requestId.current = currentRequest

    try {
      const { data, error } = await queryObjects()

      if (currentRequest !== requestId.current) {
        return
      }

      if (error || !isConstructionObjectList(data)) {
        setLoadError(loadErrorMessage)
        setLoading(false)
        return
      }

      setObjects(data)
      setLoadError(null)
      setLoading(false)
    } catch {
      if (currentRequest !== requestId.current) {
        return
      }

      setLoadError(loadErrorMessage)
      setLoading(false)
    }
  }, [])

  const reloadObjects = () => {
    setLoading(true)
    setLoadError(null)
    void loadObjects()
  }

  useEffect(() => {
    let active = true
    const currentRequest = requestId.current + 1
    requestId.current = currentRequest

    void queryObjects().then(
      ({ data, error }) => {
        if (!active || currentRequest !== requestId.current) {
          return
        }

        if (error || !isConstructionObjectList(data)) {
          setLoadError(loadErrorMessage)
          setLoading(false)
          return
        }

        setObjects(data)
        setLoadError(null)
        setLoading(false)
      },
      () => {
        if (!active || currentRequest !== requestId.current) {
          return
        }

        setLoadError(loadErrorMessage)
        setLoading(false)
      },
    )

    return () => {
      active = false
    }
  }, [])

  const closeForm = () => {
    setFormMode(null)
    setEditingId(null)
    setName('')
    setAddress('')
    setFormError(null)
  }

  const openCreateForm = () => {
    setActionError(null)
    setFormError(null)
    setFormMode('create')
    setEditingId(null)
    setName('')
    setAddress('')
  }

  const openEditForm = (object: ConstructionObject) => {
    setActionError(null)
    setFormError(null)
    setFormMode('edit')
    setEditingId(object.id)
    setName(object.name)
    setAddress(object.address)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canManage || submitting) {
      return
    }

    const trimmedName = name.trim()
    const trimmedAddress = address.trim()

    if (formMode === null) {
      return
    }

    if (!trimmedName || !trimmedAddress) {
      setFormError(validationErrorMessage)
      return
    }

    if (formMode === 'create' && !user) {
      setFormError('Не удалось определить текущего пользователя.')
      return
    }

    if (formMode === 'edit' && !editingId) {
      setFormError(saveErrorMessage)
      return
    }

    const createdBy = user?.id
    const objectId = editingId

    setFormError(null)
    setSubmitting(true)

    void (async () => {
      try {
        if (formMode === 'create' && createdBy) {
          const { error } = await supabase.from('objects').insert({
            name: trimmedName,
            address: trimmedAddress,
            created_by: createdBy,
          })

          if (error) {
            setFormError(messageForError(error, saveErrorMessage))
            setSubmitting(false)
            return
          }
        } else if (objectId) {
          const { error } = await supabase
            .from('objects')
            .update({
              name: trimmedName,
              address: trimmedAddress,
            })
            .eq('id', objectId)

          if (error) {
            setFormError(messageForError(error, saveErrorMessage))
            setSubmitting(false)
            return
          }
        } else {
          setFormError(saveErrorMessage)
          setSubmitting(false)
          return
        }

        closeForm()
        setSubmitting(false)
        reloadObjects()
      } catch {
        setFormError(saveErrorMessage)
        setSubmitting(false)
      }
    })()
  }

  const handleDelete = (object: ConstructionObject) => {
    if (!canManage || deletingId || submitting) {
      return
    }

    const confirmed = window.confirm(`Удалить объект «${object.name}»? Это действие нельзя отменить.`)

    if (!confirmed) {
      return
    }

    setActionError(null)
    setDeletingId(object.id)

    void supabase
      .from('objects')
      .delete()
      .eq('id', object.id)
      .then(
        ({ error }) => {
          if (error) {
            setActionError(messageForError(error, deleteErrorMessage))
            setDeletingId(null)
            return
          }

          if (editingId === object.id) {
            closeForm()
          }

          setDeletingId(null)
          reloadObjects()
        },
        () => {
          setActionError(deleteErrorMessage)
          setDeletingId(null)
        },
      )
  }

  const busy = submitting || deletingId !== null
  const showEmpty = !loading && !loadError && objects.length === 0

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Объекты</h1>
            <p className="mt-3 text-slate-600">
              {canManage
                ? 'Список строительных объектов. Можно создать объект, изменить название и адрес или удалить его.'
                : 'Список строительных объектов, доступных вам по назначенным задачам.'}
            </p>
          </div>
          {canManage ? (
            <button
              type="button"
              className={primaryButtonClassName}
              disabled={busy}
              onClick={formMode === 'create' ? closeForm : openCreateForm}
            >
              {formMode === 'create' ? 'Закрыть форму' : 'Добавить объект'}
            </button>
          ) : null}
        </div>

        {canManage && formMode ? (
          <form className="mt-8 flex flex-col gap-5 border-t border-slate-200 pt-6" onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold text-slate-900">
              {formMode === 'create' ? 'Новый объект' : 'Редактирование объекта'}
            </h2>
            <div className="flex flex-col gap-2">
              <label htmlFor="object-name" className="text-sm font-medium text-slate-700">
                Название
              </label>
              <input
                id="object-name"
                name="name"
                type="text"
                required
                value={name}
                disabled={submitting}
                className={inputClassName}
                onChange={(event) => {
                  setName(event.target.value)
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="object-address" className="text-sm font-medium text-slate-700">
                Адрес
              </label>
              <input
                id="object-address"
                name="address"
                type="text"
                required
                value={address}
                disabled={submitting}
                className={inputClassName}
                onChange={(event) => {
                  setAddress(event.target.value)
                }}
              />
            </div>
            {formError ? (
              <p className="text-sm text-red-600" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" className={primaryButtonClassName} disabled={submitting}>
                {submitting ? 'Сохраняем...' : formMode === 'create' ? 'Создать' : 'Сохранить'}
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                disabled={submitting}
                onClick={closeForm}
              >
                Отмена
              </button>
            </div>
          </form>
        ) : null}
      </section>

      {actionError ? (
        <p className="rounded-xl bg-white px-6 py-4 text-sm text-red-600 shadow-sm" role="alert">
          {actionError}
        </p>
      ) : null}

      {loading && objects.length === 0 ? (
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
            <p className="text-sm font-medium text-slate-600">Загрузка объектов</p>
          </div>
        </section>
      ) : null}

      {!loading && loadError && objects.length === 0 ? (
        <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8" role="alert">
          <h2 className="text-lg font-semibold text-slate-900">Не удалось загрузить объекты</h2>
          <p className="mt-3 text-slate-600">{loadError}</p>
          <button type="button" className={`${primaryButtonClassName} mt-6`} onClick={reloadObjects}>
            Повторить
          </button>
        </section>
      ) : null}

      {loadError && objects.length > 0 ? (
        <section className="rounded-xl bg-white px-6 py-4 shadow-sm" role="alert">
          <p className="text-sm text-red-600">{loadError}</p>
          <button
            type="button"
            className={`${secondaryButtonClassName} mt-3`}
            onClick={reloadObjects}
          >
            Повторить
          </button>
        </section>
      ) : null}

      {showEmpty ? (
        <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Объектов пока нет</h2>
          <p className="mt-3 text-slate-600">
            {canManage
              ? 'Добавьте первый строительный объект, чтобы начать работу с задачами.'
              : 'Здесь появятся объекты, по которым вам назначены задачи.'}
          </p>
        </section>
      ) : null}

      {objects.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {objects.map((object) => {
            const deleting = deletingId === object.id

            return (
              <li key={object.id} className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      to={`/objects/${object.id}`}
                      className="text-lg font-semibold text-slate-900 underline-offset-4 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    >
                      {object.name}
                    </Link>
                    <p className="mt-2 text-sm text-slate-600">{object.address}</p>
                  </div>
                  {canManage ? (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        className={secondaryButtonClassName}
                        disabled={busy}
                        onClick={() => {
                          openEditForm(object)
                        }}
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        className={dangerButtonClassName}
                        disabled={busy}
                        onClick={() => {
                          handleDelete(object)
                        }}
                      >
                        {deleting ? 'Удаляем...' : 'Удалить'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export default ObjectsPage

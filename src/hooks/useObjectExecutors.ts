import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.ts'
import type { ObjectExecutor } from '../types/objects.ts'

export interface ObjectExecutorsState {
  executors: ObjectExecutor[]
  loading: boolean
  error: string | null
  reload: () => void
}

interface ExecutorListState {
  executors: ObjectExecutor[]
  error: string | null
}

const executorsLoadErrorMessage = 'Не удалось загрузить исполнителей. Попробуйте ещё раз.'

const isExecutor = (value: unknown): value is ObjectExecutor => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>

  return typeof record.id === 'string' && typeof record.full_name === 'string'
}

const isExecutorList = (value: unknown): value is ObjectExecutor[] => {
  return Array.isArray(value) && value.every(isExecutor)
}

const queryExecutors = () => {
  return supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'executor')
    .order('full_name', { ascending: true })
}

export const useObjectExecutors = (enabled: boolean): ObjectExecutorsState => {
  const [executorList, setExecutorList] = useState<ExecutorListState | null>(null)
  const [requestKey, setRequestKey] = useState(0)

  useEffect(() => {
    if (!enabled) {
      return
    }

    let active = true

    void queryExecutors().then(
      ({ data, error }) => {
        if (!active) {
          return
        }

        if (error || !isExecutorList(data)) {
          setExecutorList({ executors: [], error: executorsLoadErrorMessage })
          return
        }

        setExecutorList({ executors: data, error: null })
      },
      () => {
        if (!active) {
          return
        }

        setExecutorList({ executors: [], error: executorsLoadErrorMessage })
      },
    )

    return () => {
      active = false
    }
  }, [enabled, requestKey])

  const reload = () => {
    setExecutorList(null)
    setRequestKey((current) => current + 1)
  }

  return {
    executors: enabled ? (executorList?.executors ?? []) : [],
    loading: enabled && executorList === null,
    error: enabled ? (executorList?.error ?? null) : null,
    reload,
  }
}

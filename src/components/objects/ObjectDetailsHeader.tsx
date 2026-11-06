import type * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ConstructionObject } from '../../types/objects.ts'

interface Props {
  loading: boolean
  object: ConstructionObject | null
  error: string | null
  notFound: boolean
  onRetry: () => void
}

const notFoundMessage = 'Объект не найден или недоступен.'

const backLinkClassName =
  'inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30'

const primaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-blue-400'

const ObjectDetailsHeader: React.FC<Props> = ({ loading, object, error, notFound, onRetry }) => {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
      <Link to="/objects" className={backLinkClassName}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        К объектам
      </Link>

      {loading ? (
        <div className="mt-8 flex flex-col items-center gap-3 py-10" role="status" aria-live="polite">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-slate-600">Загрузка объекта</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="mt-8" role="alert">
          <h1 className="text-lg font-semibold text-slate-900">Не удалось загрузить объект</h1>
          <p className="mt-3 text-slate-600">{error}</p>
          <button type="button" className={`${primaryButtonClassName} mt-6`} onClick={onRetry}>
            Повторить
          </button>
        </div>
      ) : null}

      {!loading && notFound ? (
        <div className="mt-8" role="status">
          <h1 className="text-lg font-semibold text-slate-900">{notFoundMessage}</h1>
          <p className="mt-3 text-slate-600">Проверьте ссылку или вернитесь к списку объектов.</p>
        </div>
      ) : null}

      {!loading && object ? (
        <div className="mt-6">
          <h1 className="text-3xl font-bold text-slate-900">{object.name}</h1>
          <p className="mt-3 text-slate-600">{object.address}</p>
        </div>
      ) : null}
    </section>
  )
}

export default ObjectDetailsHeader

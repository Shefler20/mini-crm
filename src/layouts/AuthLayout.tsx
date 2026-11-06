import type * as React from 'react'
import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'

const AuthLayout: React.FC = () => {
  const { user, profile, loading, signOut } = useAuth()
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const handleSignOut = () => {
    setSignOutError(null)

    void signOut().catch(() => {
      setSignOutError('Не удалось выйти из аккаунта. Попробуйте ещё раз.')
    })
  }

  if (loading) {
    return (
      <div
        className="flex min-h-screen min-w-[320px] items-center justify-center bg-slate-100 px-4 py-8"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-slate-600">Загрузка</p>
        </div>
      </div>
    )
  }

  if (user !== null && profile !== null) {
    const destination = profile.role === 'manager' ? '/objects' : '/my-tasks'

    return <Navigate to={destination} replace />
  }

  if (user !== null && profile === null) {
    return (
      <div className="flex min-h-screen min-w-[320px] items-center justify-center bg-slate-100 px-4 py-8">
        <div className="w-full max-w-md">
          <section className="w-full rounded-xl bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Профиль не найден</h1>
            <p className="mt-3 text-slate-600">
              Вы вошли в систему, но профиль сотрудника не найден или его не удалось загрузить.
              Обратитесь к администратору или выйдите и попробуйте снова.
            </p>
            {signOutError ? <p className="mt-3 text-sm text-red-600">{signOutError}</p> : null}
            <button
              type="button"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
              onClick={handleSignOut}
            >
              Выйти
            </button>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen min-w-[320px] items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout

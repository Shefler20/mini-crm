import type * as React from 'react'
import { useState } from 'react'
import { LogOut, Menu, User } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.ts'

interface Props {
  onMenuClick: () => void
}

const signOutErrorMessage = 'Не удалось выйти. Попробуйте ещё раз'

const sectionTitle = (pathname: string): string => {
  if (pathname === '/objects') {
    return 'Объекты'
  }
  if (pathname.startsWith('/objects/')) {
    return 'Карточка объекта'
  }
  if (pathname.startsWith('/tasks/')) {
    return 'Карточка задачи'
  }
  if (pathname === '/my-tasks') {
    return 'Мои задачи'
  }
  return 'СтройКонтроль'
}

const Header: React.FC<Props> = ({ onMenuClick }) => {
  const { pathname } = useLocation()
  const { signOut, profile } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const handleSignOut = () => {
    if (signingOut) {
      return
    }

    setSignOutError(null)
    setSigningOut(true)

    void signOut().catch(() => {
      setSignOutError(signOutErrorMessage)
      setSigningOut(false)
    })
  }

  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label="Открыть меню"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <h1 className="truncate text-lg font-semibold text-slate-900">{sectionTitle(pathname)}</h1>
      </div>
      <div className="flex min-w-0 flex-col items-end gap-1 py-2">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <User className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 max-w-40 truncate text-sm font-medium text-slate-700 sm:max-w-none">
            {profile?.full_name ?? 'пользователь'}
          </span>
          <button
            type="button"
            disabled={signingOut}
            aria-busy={signingOut}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {signingOut ? 'Выходим...' : 'Выйти'}
          </button>
        </div>
        {signOutError ? (
          <p className="max-w-full text-right text-xs text-red-600" role="alert">
            {signOutError}
          </p>
        ) : null}
      </div>
    </header>
  )
}

export default Header

import type * as React from 'react'
import { Building2, ClipboardList, HardHat } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.ts'

interface Props {
  open: boolean
  onClose: () => void
}

const linkClassName = ({ isActive }: { isActive: boolean }): string => {
  const base = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors'
  if (isActive) {
    return `${base} bg-blue-600 text-white`
  }
  return `${base} text-slate-300 hover:bg-slate-800 hover:text-white`
}

const Sidebar: React.FC<Props> = ({ open, onClose }) => {
  const { profile } = useAuth()
  const isExecutor = profile?.role === 'executor'

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Закрыть меню"
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-slate-900 text-white transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <HardHat className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">СтройКонтроль</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Основная навигация">
          <NavLink to="/objects" className={linkClassName} onClick={onClose}>
            <Building2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            Объекты
          </NavLink>
          {isExecutor ? (
            <NavLink to="/my-tasks" className={linkClassName} onClick={onClose}>
              <ClipboardList className="h-5 w-5 shrink-0" aria-hidden="true" />
              Мои задачи
            </NavLink>
          ) : null}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar

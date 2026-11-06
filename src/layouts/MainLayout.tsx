import type * as React from 'react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header.tsx'
import Sidebar from '../components/layout/Sidebar.tsx'

const MainLayout: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  return (
    <div className="flex min-h-screen min-w-[320px] bg-slate-100">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMenuOpen(true)} />
        <main className="min-w-0 flex-1 overflow-x-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout

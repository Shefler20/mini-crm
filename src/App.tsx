import type * as React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import RoleRoute from './components/RoleRoute.tsx'
import AuthLayout from './layouts/AuthLayout.tsx'
import MainLayout from './layouts/MainLayout.tsx'
import LoginPage from './pages/LoginPage.tsx'
import MyTasksPage from './pages/MyTasksPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import ObjectDetailsPage from './pages/ObjectDetailsPage.tsx'
import ObjectsPage from './pages/ObjectsPage.tsx'
import TaskDetailsPage from './pages/TaskDetailsPage.tsx'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/objects" replace />} />
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/objects" element={<ObjectsPage />} />
          <Route path="/objects/:id" element={<ObjectDetailsPage />} />
          <Route path="/tasks/:id" element={<TaskDetailsPage />} />
          <Route element={<RoleRoute allow="executor" redirectTo="/objects" />}>
            <Route path="/my-tasks" element={<MyTasksPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App

import type * as React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import type { UserRole } from '../types/auth.ts'

interface Props {
  allow: UserRole
  redirectTo: string
}

const RoleRoute: React.FC<Props> = ({ allow, redirectTo }) => {
  const { profile, loading } = useAuth()

  if (loading || profile === null) {
    return null
  }

  if (profile.role !== allow) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}

export default RoleRoute

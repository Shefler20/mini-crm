import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '../contexts/AuthContext.ts'

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider')
  }

  return context
}

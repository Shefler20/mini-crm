import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { UserProfile } from '../types/auth.ts'

export interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

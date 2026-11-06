import type * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase.ts'
import type { UserProfile } from '../types/auth.ts'
import { AuthContext, type AuthContextValue } from './AuthContext.ts'

const isUserProfile = (value: unknown): value is UserProfile => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.id === 'string' &&
    typeof record.full_name === 'string' &&
    (record.role === 'manager' || record.role === 'executor')
  )
}

interface Props {
  children: React.ReactNode
}

const AuthProvider: React.FC<Props> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const profileRequestId = useRef(0)
  const currentUserId = useRef<string | null>(null)

  useEffect(() => {
    let active = true
    let authEventSeen = false
    const timeouts = new Set<number>()

    const clearScheduledLoads = () => {
      timeouts.forEach((timeoutId) => {
        window.clearTimeout(timeoutId)
      })
      timeouts.clear()
    }

    const scheduleProfileLoad = (userId: string) => {
      clearScheduledLoads()
      const requestId = profileRequestId.current + 1
      profileRequestId.current = requestId

      const timeoutId = window.setTimeout(() => {
        timeouts.delete(timeoutId)

        void (async () => {
          if (!active || requestId !== profileRequestId.current) {
            return
          }

          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('id, full_name, role')
              .eq('id', userId)
              .maybeSingle()

            if (!active || requestId !== profileRequestId.current) {
              return
            }

            if (error) {
              console.error('Failed to load user profile:', error)

              currentUserId.current = null
              setProfile(null)
              setLoading(false)
              return
            }

            setProfile(isUserProfile(data) ? data : null)
            setLoading(false)
          } catch (error) {
            if (!active || requestId !== profileRequestId.current) {
              return
            }

            console.error('Unexpected error while loading profile:', error)

            currentUserId.current = null
            setProfile(null)
            setLoading(false)
          }
        })()
      }, 0)

      timeouts.add(timeoutId)
    }

    const applySession = (nextSession: Session | null) => {
      if (!active) {
        return
      }

      const nextUser = nextSession?.user ?? null
      setSession(nextSession)
      setUser(nextUser)

      if (!nextUser) {
        profileRequestId.current += 1
        currentUserId.current = null
        clearScheduledLoads()
        setProfile(null)
        setLoading(false)
        return
      }

      if (nextUser.id === currentUserId.current) {
        return
      }

      currentUserId.current = nextUser.id
      setProfile(null)
      setLoading(true)
      scheduleProfileLoad(nextUser.id)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'INITIAL_SESSION') {
        return
      }

      authEventSeen = true
      applySession(nextSession)
    })

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || authEventSeen) {
          return
        }

        if (error) {
          applySession(null)
          return
        }

        applySession(data.session)
      })
      .catch(() => {
        if (!active || authEventSeen) {
          return
        }

        applySession(null)
      })

    return () => {
      active = false
      subscription.unsubscribe()
      clearScheduledLoads()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    profileRequestId.current += 1
    currentUserId.current = null
    setSession(null)
    setUser(null)
    setProfile(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      signIn,
      signOut,
    }),
    [session, user, profile, loading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider

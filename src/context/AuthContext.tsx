import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { dataService } from '../services/dataService'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  /** False in local IndexedDB mode, where no credentials are needed. */
  requiresAuth: boolean
  /** True after opening a password-recovery link from Supabase Auth. */
  isRecovery: boolean
  signIn: (email: string, password: string) => Promise<void>
  /** Returns true when email confirmation is required before signing in. */
  signUp: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  cancelRecovery: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [isRecovery, setIsRecovery] = useState(false)

  useEffect(() => {
    if (!supabase) return
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return
      setSession(next)
      setUser(next?.user ?? null)
      setLoading(false)
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
      if (event === 'SIGNED_OUT') setIsRecovery(false)
      // RLS-scoped data becomes visible only after sign-in.
      void dataService.refresh().catch(() => {})
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) return
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) return false
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
    return !data.session
  }

  const signOut = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setIsRecovery(false)
  }

  const resetPassword = async (email: string) => {
    if (!supabase) return
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })
    if (error) throw error
  }

  const updatePassword = async (password: string) => {
    if (!supabase) return
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    setIsRecovery(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        requiresAuth: isSupabaseConfigured,
        isRecovery,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        cancelRecovery: () => setIsRecovery(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

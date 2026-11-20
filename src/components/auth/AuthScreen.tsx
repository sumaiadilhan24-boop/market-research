import { useState, type FormEvent } from 'react'
import {
  AlertCircle,
  Cat,
  CheckCircle2,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { haptic } from '../../utils'

export function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const switchMode = () => {
    haptic(8)
    setMode((current) => (current === 'signin' ? 'signup' : 'signin'))
    setError(null)
    setNotice(null)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)

    if (!email.trim() || password.length < 6) {
      setError('Enter a valid email and a password of at least 6 characters.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        haptic([10, 25, 10])
      } else {
        const needsConfirmation = await signUp(email, password)
        if (needsConfirmation) {
          setNotice('Account created! Check your email to confirm, then sign in.')
        } else {
          haptic([10, 25, 10])
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Authentication failed.')
      haptic(30)
    } finally {
      setBusy(false)
    }
  }

  const forgot = async () => {
    setError(null)
    setNotice(null)
    if (!email.trim()) {
      setError('Enter your email first, then tap Reset password.')
      return
    }
    setBusy(true)
    try {
      await resetPassword(email)
      setNotice('Password reset link sent to your email.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not send reset link.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_10px_34px_-8px_rgba(5,150,105,.25)]">
            <Cat size={34} strokeWidth={2.4} />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">Market Research</h1>
          <p className="mt-1 text-xs text-slate-600">Field sales &amp; market research</p>
        </div>

        <form
          onSubmit={(event) => void submit(event)}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl backdrop-blur-xl"
        >
          <h2 className="text-lg font-bold text-slate-900">
            {mode === 'signin' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            {mode === 'signin'
              ? 'Sign in to sync your field data with Supabase.'
              : 'Set up email and password access for your team.'}
          </p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-inset ring-rose-200">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}
          {notice && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          <label className="mt-5 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Email
            </span>
            <span className="relative block">
              <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="input-field pl-10"
              />
            </span>
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Password
            </span>
            <span className="relative block">
              <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                className="input-field pl-10"
              />
            </span>
          </label>

          <button
            type="submit"
            disabled={busy}
            className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-bold text-white shadow-glow transition active:scale-[.98] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 size={19} className="animate-spin" />
            ) : mode === 'signin' ? (
              <LogIn size={19} />
            ) : (
              <UserPlus size={19} />
            )}
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>

          <div className="mt-4 flex items-center justify-between gap-2 text-xs">
            <button type="button" onClick={switchMode} className="font-bold text-emerald-700">
              {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
            </button>
            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => void forgot()}
                disabled={busy}
                className="flex items-center gap-1 font-semibold text-slate-600"
              >
                <KeyRound size={13} /> Forgot password
              </button>
            )}
          </div>
        </form>

        <p className="mt-5 text-center text-[10px] leading-relaxed text-slate-600">
          Data is stored in your Supabase project and protected by row level security.
        </p>
      </div>
    </div>
  )
}

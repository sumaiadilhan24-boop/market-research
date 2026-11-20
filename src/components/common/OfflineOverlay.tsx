import { useEffect, useState } from 'react'
import { RefreshCw, WifiOff } from 'lucide-react'
import { useNetwork } from '../../context/NetworkContext'
import { formatTime, haptic } from '../../utils'

/**
 * Full-screen, input-blocking connectivity guard.
 * Reconnection polling (every 3s while offline) lives in NetworkContext.
 */
export function OfflineOverlay() {
  const { isOnline, isChecking, lastPingSuccess, checkNow } = useNetwork()
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (isOnline) return
    const id = window.setInterval(() => {
      setCountdown((value) => (value <= 1 ? 3 : value - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [isOnline])

  useEffect(() => {
    if (isOnline) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOnline])

  if (isOnline) return null

  const retry = () => {
    haptic(15)
    void checkNow()
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label="No internet connection"
      onTouchMove={(event) => event.preventDefault()}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/90 px-7 text-center backdrop-blur-xl animate-fade-in"
    >
      <div className="relative mb-7 flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-rose-100 animate-ring-pulse" />
        <span className="absolute inset-2 rounded-full bg-rose-50 animate-ring-pulse [animation-delay:.6s]" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200">
          <WifiOff size={30} strokeWidth={2.2} />
        </span>
      </div>

      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">You&apos;re offline</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600">
        Market Research needs a connection before saving new records. We&apos;ll unlock the app
        automatically as soon as the network is back.
      </p>

      <button
        type="button"
        onClick={retry}
        disabled={isChecking}
        className="mt-7 flex min-h-[52px] w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 font-bold text-white shadow-glow transition active:scale-[.98] disabled:opacity-70"
      >
        <RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />
        {isChecking ? 'Checking connection…' : 'Retry connection'}
      </button>

      <p className="mt-5 text-xs text-slate-500">
        {lastPingSuccess
          ? `Last connected at ${formatTime(new Date(lastPingSuccess).toISOString())} · retrying in ${countdown}s`
          : `Auto-checking every 3 seconds · next in ${countdown}s`}
      </p>
    </div>
  )
}

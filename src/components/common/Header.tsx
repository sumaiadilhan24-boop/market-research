import type { ReactNode } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { useNetwork } from '../../context/NetworkContext'

interface HeaderProps {
  title: string
  subtitle?: string
  right?: ReactNode
}

export function Header({ title, subtitle, right }: HeaderProps) {
  const { isOnline, isChecking } = useNetwork()

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
      <div className="flex min-h-[64px] items-center gap-3 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">{title}</h1>
            <span
              className={cxStatus(isOnline, isChecking)}
              title={isOnline ? 'Connected' : 'Offline'}
            >
              {isOnline ? <Wifi size={11} strokeWidth={3} /> : <WifiOff size={11} strokeWidth={3} />}
            </span>
          </div>
          {subtitle && <p className="truncate text-xs text-slate-600">{subtitle}</p>}
        </div>
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
      </div>
    </header>
  )
}

function cxStatus(isOnline: boolean, isChecking: boolean): string {
  const base =
    'inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-inset transition-colors'
  if (!isOnline) return `${base} bg-rose-100 text-rose-700 ring-rose-200`
  if (isChecking) return `${base} bg-amber-100 text-amber-700 ring-amber-300`
  return `${base} bg-emerald-50 text-emerald-700 ring-emerald-300`
}

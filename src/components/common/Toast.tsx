import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { cx } from '../../utils'

export function Toast() {
  const { toast, dismissToast } = useApp()
  if (!toast) return null

  const Icon = toast.kind === 'success' ? CheckCircle2 : toast.kind === 'error' ? AlertCircle : Info
  const tone =
    toast.kind === 'success'
      ? 'text-emerald-700'
      : toast.kind === 'error'
        ? 'text-rose-700'
        : 'text-sky-700'

  return (
    <div className="toast-bottom pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-4">
      <button
        type="button"
        onClick={dismissToast}
        key={toast.id}
        className="pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-2xl backdrop-blur-xl animate-sheet-in"
      >
        <Icon size={18} className={cx('shrink-0', tone)} />
        <span className="text-sm font-medium text-slate-900">{toast.message}</span>
        <X size={15} className="ml-1 shrink-0 text-slate-500" />
      </button>
    </div>
  )
}

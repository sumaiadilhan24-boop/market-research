import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cx } from '../../utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  zIndexClass?: string
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  zIndexClass = 'z-50',
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={cx(
        'fixed inset-0 flex items-end justify-center bg-slate-500/30 backdrop-blur-sm sm:items-center sm:p-4',
        zIndexClass,
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl animate-sheet-in sm:rounded-3xl">
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 pb-4 pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-600">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition active:scale-95 hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={19} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>

        {footer && (
          <div className="border-t border-slate-100 bg-slate-50 px-5 pt-4 pb-safe-footer">{footer}</div>
        )}
      </div>
    </div>
  )
}

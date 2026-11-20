import { CalendarDays, Plus } from 'lucide-react'
import type { Visit } from '../../types'
import { cx, formatShortDate, haptic } from '../../utils'

interface VisitSelectorProps {
  visits: Visit[]
  activeVisitId: number | null
  onSelect: (id: number) => void
  onNew: () => void
}

export function VisitSelector({ visits, activeVisitId, onSelect, onNew }: VisitSelectorProps) {
  const sorted = [...visits].sort((a, b) => b.visitDate.localeCompare(a.visitDate))

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-2">
      {sorted.map((visit) => {
        const active = visit.id === activeVisitId
        return (
          <button
            key={visit.id}
            type="button"
            onClick={() => {
              haptic(8)
              onSelect(visit.id!)
            }}
            className={cx(
              'flex min-h-[52px] shrink-0 items-center gap-2 rounded-xl px-3.5 text-left transition active:scale-[.98]',
              active
                ? 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-300'
                : 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
            )}
          >
            <CalendarDays size={16} className={active ? 'text-emerald-700' : 'text-slate-500'} />
            <span className="flex flex-col">
              <span className="max-w-[130px] truncate text-xs font-bold leading-tight">{visit.title}</span>
              <span className={cx('text-[10px]', active ? 'text-emerald-700' : 'text-slate-500')}>
                {formatShortDate(visit.visitDate)}
              </span>
            </span>
          </button>
        )
      })}
      <button
        type="button"
        onClick={() => {
          haptic(10)
          onNew()
        }}
        className="flex min-h-[52px] shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200 transition active:scale-[.98]"
      >
        <Plus size={16} /> New visit
      </button>
    </div>
  )
}

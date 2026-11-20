import { ChevronRight, MapPin, Pencil } from 'lucide-react'
import { useAppData } from '../../services/useData'
import type { Visit } from '../../types'
import { cx, formatDate, haptic } from '../../utils'
import { Card } from '../common/Card'

interface VisitTimelineProps {
  visits: Visit[]
  activeVisitId: number | null
  onSelect: (id: number) => void
  onEdit: (id: number) => void
}

export function VisitTimeline({ visits, activeVisitId, onSelect, onEdit }: VisitTimelineProps) {
  const { interactions } = useAppData()
  const sorted = [...visits].sort((a, b) => b.visitDate.localeCompare(a.visitDate))

  if (sorted.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-3xl">📅</p>
        <p className="mt-3 font-semibold text-slate-900">No visits yet</p>
        <p className="mt-1 text-xs text-slate-600">Create a visit to start logging inquiries.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-2.5">
      {sorted.map((visit) => {
        const count = interactions?.filter((i) => i.visitId === visit.id).length ?? 0
        const active = visit.id === activeVisitId
        return (
          <Card
            key={visit.id}
            className={cx('flex items-center gap-3 p-3.5', active && 'ring-2 ring-emerald-300')}
          >
            <button
              type="button"
              onClick={() => {
                haptic(8)
                onSelect(visit.id!)
              }}
              className="flex min-h-[56px] min-w-0 flex-1 items-center gap-3 text-left active:opacity-80"
            >
              <span
                className={cx(
                  'flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-center',
                  active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700',
                )}
              >
                <span className="text-[10px] font-bold uppercase leading-none">
                  {formatDate(visit.visitDate).split(' ')[0]}
                </span>
                <span className="text-base font-extrabold leading-tight">
                  {visit.visitDate.slice(8, 10)}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-bold text-slate-900">{visit.title}</span>
                  {active && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                      ACTIVE
                    </span>
                  )}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-600">
                  {visit.location && (
                    <span className="flex items-center gap-0.5 truncate">
                      <MapPin size={11} /> {visit.location}
                    </span>
                  )}
                  <span>{count} inquiries</span>
                </span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={() => {
                haptic(8)
                onEdit(visit.id!)
              }}
              aria-label={`Edit ${visit.title}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition active:scale-95"
            >
              <Pencil size={16} />
            </button>
          </Card>
        )
      })}
    </div>
  )
}

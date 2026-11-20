import { CalendarDays, MapPin, Plus } from 'lucide-react'
import { Header } from '../components/common/Header'
import { Card } from '../components/common/Card'
import { VisitSelector } from '../components/visits/VisitSelector'
import { VisitTimeline } from '../components/visits/VisitTimeline'
import { useApp } from '../context/AppContext'
import { useAppData } from '../services/useData'
import { formatDate, haptic } from '../utils'

export function VisitsView() {
  const { activeVisitId, setActiveVisitId, openVisitModal, openLogger } = useApp()
  const { visits, interactions } = useAppData()
  const active = visits.find((visit) => visit.id === activeVisitId)
  const activeCount = interactions.filter((interaction) => interaction.visitId === activeVisitId).length

  return (
    <>
      <Header
        title="Visits"
        subtitle={active ? `Active · ${active.title}` : 'Choose a market day to focus on'}
        right={
          <button
            type="button"
            onClick={() => {
              haptic(10)
              openVisitModal()
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-300 transition active:scale-95"
            aria-label="New visit"
          >
            <Plus size={19} strokeWidth={2.6} />
          </button>
        }
      />

      <div className="space-y-4 p-4">
        <Card className="relative overflow-hidden border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <CalendarDays size={12} /> Active visit
              </p>
              <h2 className="mt-1 truncate text-lg font-extrabold text-slate-900">
                {active?.title ?? 'No visit selected'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                {active ? formatDate(active.visitDate) : 'Create or select a visit below'}
              </p>
              {active?.location && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                  <MapPin size={11} /> {active.location}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-2xl font-extrabold tabular-nums text-emerald-700">{activeCount}</p>
              <p className="text-[10px] text-slate-500">inquiries</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                haptic(12)
                openLogger()
              }}
              className="min-h-[46px] flex-1 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-glow transition active:scale-[.98]"
            >
              Log inquiry
            </button>
            {active && (
              <button
                type="button"
                onClick={() => {
                  haptic(8)
                  openVisitModal(active.id)
                }}
                className="min-h-[46px] rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-800 transition active:scale-[.98]"
              >
                Edit
              </button>
            )}
          </div>
        </Card>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">All visits</p>
          <VisitSelector
            visits={visits}
            activeVisitId={activeVisitId}
            onSelect={setActiveVisitId}
            onNew={() => openVisitModal()}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Timeline</p>
          <VisitTimeline
            visits={visits}
            activeVisitId={activeVisitId}
            onSelect={setActiveVisitId}
            onEdit={openVisitModal}
          />
        </div>
      </div>
    </>
  )
}

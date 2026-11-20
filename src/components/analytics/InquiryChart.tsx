import { BarChart3 } from 'lucide-react'
import { useAppData } from '../../services/useData'
import { formatShortDate } from '../../utils'
import { Card } from '../common/Card'

export function InquiryChart() {
  const { visits, interactions } = useAppData()

  const data = [...visits]
    .sort((a, b) => a.visitDate.localeCompare(b.visitDate))
    .slice(-7)
    .map((visit) => ({
      visit,
      count: interactions.filter((interaction) => interaction.visitId === visit.id).length,
    }))

  const max = Math.max(1, ...data.map((item) => item.count))
  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900">Inquiries by visit</h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-500">{total} total</span>
      </div>

      {data.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">No visits to chart yet.</p>
      ) : (
        <div>
          <div className="flex h-40 items-end gap-2 border-b border-slate-200">
            {data.map(({ visit, count }) => (
              <div key={visit.id} className="flex h-full min-w-0 flex-1 items-end justify-center">
                <div
                  className="w-full max-w-10 rounded-t-lg bg-emerald-500 transition-all duration-300"
                  style={{ height: `${Math.max(6, (count / max) * 100)}%` }}
                  title={`${visit.title}: ${count} inquiries`}
                />
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            {data.map(({ visit, count }) => (
              <div key={visit.id} className="min-w-0 flex-1 text-center">
                <span className="block text-[11px] font-bold tabular-nums text-emerald-700">
                  {count}
                </span>
                <span className="block truncate text-[10px] text-slate-500">
                  {formatShortDate(visit.visitDate)}
                </span>
                <span className="block truncate text-[9px] text-slate-400" title={visit.title}>
                  {visit.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

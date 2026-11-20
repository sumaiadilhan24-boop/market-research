import { MessageCircleQuestion, Wallet } from 'lucide-react'
import { useAppData } from '../../services/useData'
import { formatCurrency } from '../../utils'
import { Card } from '../common/Card'

const BUCKETS = [
  { label: 'Under ৳200', min: 0, max: 200 },
  { label: '৳200–349', min: 200, max: 350 },
  { label: '৳350–499', min: 350, max: 500 },
  { label: '৳500–749', min: 500, max: 750 },
  { label: '৳750+', min: 750, max: Infinity },
]

export function PriceDistribution() {
  const { interactions } = useAppData()

  const offers = interactions
    .map((interaction) => interaction.offeredPrice)
    .filter((value): value is number => typeof value === 'number' && value > 0)
  const buckets = BUCKETS.map((bucket) => ({
    ...bucket,
    count: offers.filter((price) => price >= bucket.min && price < bucket.max).length,
  }))
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count))

  const questionCounts = new Map<string, number>()
  interactions.forEach((interaction) => {
    interaction.questions.forEach((question) => {
      questionCounts.set(question, (questionCounts.get(question) ?? 0) + 1)
    })
  })
  const topQuestions = [...questionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxQuestion = Math.max(1, ...topQuestions.map(([, count]) => count))

  return (
    <div className="space-y-2.5">
      <Card className="p-4">
        <div className="mb-1 flex items-center gap-2">
          <Wallet size={16} className="text-sky-700" />
          <h3 className="text-sm font-bold text-slate-900">Price distribution</h3>
        </div>
        <p className="mb-4 text-[11px] text-slate-500">
          Sell offers {interactions.filter((item) => (item.direction ?? 'SELL') === 'SELL').length} ·
          Buy quotes {interactions.filter((item) => item.direction === 'BUY').length}
        </p>
        <div className="space-y-2.5">
          {buckets.map((bucket) => (
            <div key={bucket.label} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-[11px] text-slate-600">{bucket.label}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${(bucket.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-5 shrink-0 text-right text-[11px] font-bold tabular-nums text-slate-700">
                {bucket.count}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-slate-600">
          {offers.length} offers logged · average {formatCurrency(offers.length ? offers.reduce((a, b) => a + b, 0) / offers.length : 0)}
        </p>
      </Card>

      <Card className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <MessageCircleQuestion size={16} className="text-violet-700" />
          <h3 className="text-sm font-bold text-slate-900">Top questions asked</h3>
        </div>
        {topQuestions.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">No questions logged yet.</p>
        ) : (
          <div className="space-y-2.5">
            {topQuestions.map(([question, count]) => (
              <div key={question} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-[11px] text-slate-700">{question}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${(count / maxQuestion) * 100}%` }}
                  />
                </div>
                <span className="w-5 shrink-0 text-right text-[11px] font-bold tabular-nums text-slate-700">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

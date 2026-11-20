import { Activity, BadgeDollarSign, Banknote, Percent, ShoppingBag, ShoppingCart, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAppData } from '../../services/useData'
import { formatCurrency, haptic } from '../../utils'
import { Card } from '../common/Card'

export function MarketSummary() {
  const { products, visits, interactions } = useAppData()

  const priced = (direction: 'SELL' | 'BUY') =>
    interactions
      .filter((interaction) => (interaction.direction ?? 'SELL') === direction)
      .map((interaction) => interaction.offeredPrice)
      .filter((value): value is number => typeof value === 'number' && value > 0)

  const sellOffers = priced('SELL')
  const buyOffers = priced('BUY')
  const avgOffer = sellOffers.length
    ? sellOffers.reduce((sum, value) => sum + value, 0) / sellOffers.length
    : 0
  const bestOffer = sellOffers.length ? Math.max(...sellOffers) : 0
  const avgBuy = buyOffers.length
    ? buyOffers.reduce((sum, value) => sum + value, 0) / buyOffers.length
    : 0
  const sellLogs = interactions.filter((interaction) => (interaction.direction ?? 'SELL') === 'SELL').length
  const buyLogs = interactions.length - sellLogs
  const sold = products.filter((product) => product.status === 'SOLD')
  const revenue = sold.reduce((sum, product) => sum + (product.soldPrice ?? 0), 0)
  const conversion = products.length ? Math.round((sold.length / products.length) * 100) : 0

  const stats: Array<{ label: string; value: string; note: string; icon: LucideIcon; tone: string }> = [
    { label: 'Sell logs', value: String(sellLogs), note: 'Buyer offers received', icon: ShoppingBag, tone: 'text-emerald-700 bg-emerald-50' },
    { label: 'Buy logs', value: String(buyLogs), note: `Avg quote ${formatCurrency(avgBuy)}`, icon: ShoppingCart, tone: 'text-sky-700 bg-sky-50' },
    { label: 'Average offer', value: formatCurrency(avgOffer), note: `Best ${formatCurrency(bestOffer)}`, icon: TrendingUp, tone: 'text-violet-700 bg-violet-50' },
    { label: 'Items sold', value: String(sold.length), note: `${products.length} products tracked`, icon: Activity, tone: 'text-emerald-700 bg-emerald-50' },
    { label: 'Revenue', value: formatCurrency(revenue), note: 'Confirmed sales', icon: BadgeDollarSign, tone: 'text-amber-700 bg-amber-50' },
    { label: 'Conversion', value: `${conversion}%`, note: `${visits.length} visits logged`, icon: Percent, tone: 'text-rose-700 bg-rose-50' },
    { label: 'Avg vs target', value: sellOffers.length ? `${Math.round((avgOffer / Math.max(1, averageTarget(products))) * 100)}%` : '—', note: 'Of target price', icon: Banknote, tone: 'text-violet-700 bg-violet-50' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="p-3.5">
            <button
              type="button"
              onClick={() => haptic(8)}
              className="w-full text-left active:opacity-80"
            >
              <span className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${stat.tone}`}>
                <Icon size={16} />
              </span>
              <p className="truncate text-xl font-extrabold tabular-nums text-slate-900">{stat.value}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-600">{stat.label}</p>
              <p className="mt-0.5 truncate text-[10px] text-slate-600">{stat.note}</p>
            </button>
          </Card>
        )
      })}
    </div>
  )
}

function averageTarget(products: Array<{ targetPrice: number }>): number {
  if (!products.length) return 1
  return products.reduce((sum, product) => sum + product.targetPrice, 0) / products.length
}

import { CheckCircle2, Pencil, Plus, TrendingUp } from 'lucide-react'
import type { Product } from '../../types'
import { STATUS_META } from '../../types'
import { clamp, cx, formatCurrency, haptic } from '../../utils'
import { Card } from '../common/Card'
import { ProductIcon } from './ProductIcon'

interface ProductCardProps {
  product: Product
  stats: { inquiries: number; bestOffer?: number }
  active: boolean
  onSelect: () => void
  onLog: () => void
  onEdit: () => void
  onSold: () => void
}

export function ProductCard({
  product,
  stats,
  active,
  onLog,
  onEdit,
  onSold,
}: ProductCardProps) {
  const status = STATUS_META[product.status]
  const progress = clamp(
    product.targetPrice > 0 ? ((stats.bestOffer ?? 0) / product.targetPrice) * 100 : 0,
    0,
    100,
  )

  return (
    <Card
      className={cx(
        'overflow-hidden p-4 transition-all',
        active && 'ring-2 ring-emerald-300',
        product.status === 'SOLD' && 'opacity-90',
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => {
            haptic(8)
            onLog()
          }}
          className="flex min-w-0 flex-1 items-start gap-3 text-left active:opacity-80"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-inset ring-slate-200">
            <ProductIcon product={product} size={30} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-bold text-slate-900">{product.name}</span>
            <span className="block truncate text-xs text-slate-600">
              {product.breedOrType || 'Product'}
            </span>
            <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold', status.badge)}>
                {status.label}
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                {formatCurrency(product.targetPrice)}
              </span>
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic(8)
            onEdit()
          }}
          aria-label={`Edit ${product.name}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition active:scale-95 hover:text-slate-900"
        >
          <Pencil size={17} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
        <span>{stats.inquiries} inquiries</span>
        <span className="text-slate-700">•</span>
        <span className="flex items-center gap-1">
          <TrendingUp size={12} className="text-emerald-600" />
          Best {formatCurrency(stats.bestOffer)}
        </span>
        {product.status === 'SOLD' && (
          <>
            <span className="text-slate-700">•</span>
            <span className="font-semibold text-sky-700">Sold {formatCurrency(product.soldPrice)}</span>
          </>
        )}
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            haptic(10)
            onLog()
          }}
          className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700 ring-1 ring-inset ring-emerald-300 transition active:scale-[.98]"
        >
          <Plus size={17} strokeWidth={3} /> Log inquiry
        </button>
        <button
          type="button"
          onClick={() => {
            haptic(12)
            onSold()
          }}
          className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl bg-sky-50 text-sm font-bold text-sky-700 ring-1 ring-inset ring-sky-200 transition active:scale-[.98]"
        >
          <CheckCircle2 size={16} />
          {product.status === 'SOLD' ? 'Sale details' : 'Mark sold'}
        </button>
      </div>
    </Card>
  )
}

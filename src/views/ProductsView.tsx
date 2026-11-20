import { PawPrint, Plus, Search } from 'lucide-react'
import { Header } from '../components/common/Header'
import { Card } from '../components/common/Card'
import { ProductCard } from '../components/products/ProductCard'
import { useApp } from '../context/AppContext'
import { useAppData } from '../services/useData'
import type { ProductStatus } from '../types'
import { cx, haptic } from '../utils'

const FILTERS: Array<{ key: ProductStatus | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'AVAILABLE', label: 'Available' },
  { key: 'RESERVED', label: 'Reserved' },
  { key: 'SOLD', label: 'Sold' },
]

export function ProductsView() {
  const {
    productFilter,
    setProductFilter,
    selectedProductId,
    setSelectedProductId,
    openProductModal,
    openLogger,
    openSoldModal,
  } = useApp()
  const { products, interactions } = useAppData()

  const stats = new Map<number, { inquiries: number; bestOffer?: number }>()
  interactions.forEach((interaction) => {
    const current = stats.get(interaction.productId) ?? { inquiries: 0, bestOffer: undefined }
    current.inquiries += 1
    if (
      typeof interaction.offeredPrice === 'number' &&
      (current.bestOffer === undefined || interaction.offeredPrice > current.bestOffer)
    ) {
      current.bestOffer = interaction.offeredPrice
    }
    stats.set(interaction.productId, current)
  })

  const visible = products.filter((product) => {
    if (productFilter !== 'ALL' && product.status !== productFilter) return false
    return true
  })

  return (
    <>
      <Header
        title="Products"
        subtitle={`${products.length} tracked · ${products.filter((p) => p.status === 'SOLD').length} sold`}
        right={
          <button
            type="button"
            onClick={() => {
              haptic(10)
              openProductModal()
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-300 transition active:scale-95"
            aria-label="New product"
          >
            <Plus size={19} strokeWidth={2.6} />
          </button>
        }
      />

      <div className="space-y-4 p-4">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => {
                haptic(8)
                setProductFilter(filter.key)
              }}
              className={cx(
                'min-h-[40px] shrink-0 rounded-full px-4 text-xs font-bold transition active:scale-95',
                productFilter === filter.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <Card className="p-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              {productFilter === 'ALL' ? <PawPrint size={26} /> : <Search size={24} />}
            </span>
            <p className="mt-3 font-semibold text-slate-900">
              {productFilter === 'ALL' ? 'No products yet' : `No ${productFilter.toLowerCase()} products`}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {productFilter === 'ALL'
                ? 'Add a product to start logging market inquiries.'
                : 'Try a different filter.'}
            </p>
            {productFilter === 'ALL' && (
              <button
                type="button"
                onClick={() => openProductModal()}
                className="mt-4 min-h-[46px] rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white transition active:scale-[.98]"
              >
                Add product
              </button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {visible.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                stats={stats.get(product.id!) ?? { inquiries: 0, bestOffer: undefined }}
                active={selectedProductId === product.id}
                onSelect={() => setSelectedProductId(product.id ?? null)}
                onLog={() => openLogger(product.id ?? undefined)}
                onEdit={() => openProductModal(product.id ?? undefined)}
                onSold={() => openSoldModal(product.id!)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

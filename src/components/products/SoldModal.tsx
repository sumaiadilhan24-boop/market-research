import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, Undo2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
import { useAppData } from '../../services/useData'
import { formatCurrency, haptic } from '../../utils'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { Modal } from '../common/Modal'
import { ProductIcon } from './ProductIcon'

export function SoldModal() {
  const { soldProductId, closeSoldModal, showToast, requireOnline } = useApp()
  const { products } = useAppData()
  const product = products.find((item) => item.id === soldProductId)
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [confirmReopen, setConfirmReopen] = useState(false)
  const [saving, setSaving] = useState(false)
  const hydrated = useRef(false)

  useEffect(() => {
    if (product && !hydrated.current) {
      setPrice(String(product.soldPrice ?? product.targetPrice))
      setNote(product.soldNote ?? '')
      hydrated.current = true
    }
  }, [product])

  useEffect(() => {
    hydrated.current = false
    setPrice('')
    setNote('')
  }, [soldProductId])

  const confirmSale = async () => {
    if (!soldProductId || !product || saving) return
    if (!requireOnline()) return
    const soldPrice = Number(price)
    if (!Number.isFinite(soldPrice) || soldPrice <= 0) {
      showToast('Enter the final sold price.', 'error')
      return
    }
    setSaving(true)
    try {
      await dataService.updateProduct(soldProductId, {
        status: 'SOLD',
        soldPrice,
        soldAt: new Date().toISOString(),
        soldNote: note.trim() || undefined,
      })
      haptic([12, 40, 18])
      showToast(`${product.name} marked as sold for ${formatCurrency(soldPrice)}!`)
      closeSoldModal()
    } catch {
      showToast('Could not save the sale.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const reopen = async () => {
    if (!soldProductId) return
    if (!requireOnline()) return
    try {
      await dataService.updateProduct(soldProductId, {
        status: 'AVAILABLE',
        soldPrice: undefined,
        soldAt: undefined,
        soldNote: undefined,
      })
      setConfirmReopen(false)
      showToast('Product reopened as available.')
      closeSoldModal()
    } catch {
      showToast('Could not reopen the product.', 'error')
    }
  }

  const alreadySold = product?.status === 'SOLD'

  return (
    <>
      <Modal
        open={soldProductId !== null}
        onClose={closeSoldModal}
        title={alreadySold ? 'Sale details' : 'Confirm sale'}
        subtitle={product?.name ?? 'Product'}
        footer={
          alreadySold ? (
            <button
              type="button"
              onClick={closeSoldModal}
              className="min-h-[52px] w-full rounded-xl bg-slate-100 font-semibold text-slate-800 transition active:scale-[.98]"
            >
              Done
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeSoldModal}
                className="h-[52px] flex-1 rounded-xl bg-slate-100 font-semibold text-slate-700 transition active:scale-[.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmSale()}
                disabled={saving}
                className="flex h-[52px] flex-[1.5] items-center justify-center gap-2 rounded-xl bg-sky-600 font-bold text-white shadow-glow transition active:scale-[.98] disabled:opacity-60"
              >
                <BadgeCheck size={19} /> Confirm sale
              </button>
            </div>
          )
        }
      >
        {!product ? (
          <p className="text-sm text-slate-600">Loading product…</p>
        ) : alreadySold ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-100 p-4">
              <ProductIcon product={product} size={32} />
              <div>
                <p className="font-bold text-slate-900">{product.name}</p>
                <p className="text-xs text-slate-600">{product.breedOrType}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-sky-700">Final sale price</p>
              <p className="mt-1 text-3xl font-extrabold text-sky-700">
                {formatCurrency(product.soldPrice)}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {product.soldAt ? new Date(product.soldAt).toLocaleString() : ''}
              </p>
            </div>
            {product.soldNote && (
              <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">“{product.soldNote}”</p>
            )}
            <button
              type="button"
              onClick={() => setConfirmReopen(true)}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 transition active:scale-[.98]"
            >
              <Undo2 size={16} /> Reopen as available
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-100 p-3">
              <ProductIcon product={product} size={30} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-900">{product.name}</p>
                <p className="text-xs text-slate-600">Target {formatCurrency(product.targetPrice)}</p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Final sold price (৳)
              </label>
              <input
                autoFocus
                type="number"
                inputMode="numeric"
                min={0}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="input-field text-lg font-bold"
              />
              <div className="mt-2 flex gap-2">
                {[product.targetPrice, product.minAcceptablePrice].filter(
                  (value): value is number => typeof value === 'number',
                ).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPrice(String(preset))}
                    className="min-h-[38px] flex-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700 transition active:scale-95"
                  >
                    {formatCurrency(preset)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Buyer note (optional)
              </label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder="Who bought it? Any details worth remembering…"
                className="input-field resize-none"
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmReopen}
        title="Reopen this product?"
        message="The sale record will be cleared and this product will be marked available again."
        confirmLabel="Reopen"
        onConfirm={() => void reopen()}
        onCancel={() => setConfirmReopen(false)}
      />
    </>
  )
}

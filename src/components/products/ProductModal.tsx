import { useEffect, useRef, useState } from 'react'
import { Trash2, Undo2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
import { useAppData } from '../../services/useData'
import type { IconType, Product, ProductInput, ProductStatus } from '../../types'
import { formatCurrency, haptic } from '../../utils'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { Modal } from '../common/Modal'
import { IconPicker } from './IconPicker'

interface FormState {
  name: string
  breedOrType: string
  targetPrice: string
  minPrice: string
  iconType: IconType
  iconValue: string
  notes: string
  status: ProductStatus
}

function emptyForm(): FormState {
  return {
    name: '',
    breedOrType: '',
    targetPrice: '',
    minPrice: '',
    iconType: 'emoji',
    iconValue: '📦',
    notes: '',
    status: 'AVAILABLE',
  }
}

function formFrom(product: Product): FormState {
  return {
    name: product.name,
    breedOrType: product.breedOrType,
    targetPrice: String(product.targetPrice),
    minPrice: product.minAcceptablePrice ? String(product.minAcceptablePrice) : '',
    iconType: product.iconType,
    iconValue: product.iconValue,
    notes: product.notes ?? '',
    status: product.status,
  }
}

export function ProductModal() {
  const { isProductModalOpen, editProductId, closeProductModal } = useApp()
  if (!isProductModalOpen) return null
  return <ProductModalInner key={editProductId ?? 'new'} productId={editProductId} onClose={closeProductModal} />
}

function ProductModalInner({
  productId,
  onClose,
}: {
  productId: number | null
  onClose: () => void
}) {
  const { showToast, requireOnline } = useApp()
  const { products } = useAppData()
  const product = products.find((item) => item.id === productId)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReopen, setConfirmReopen] = useState(false)
  const [saving, setSaving] = useState(false)
  const hydrated = useRef(productId === null)

  useEffect(() => {
    if (product && !hydrated.current) {
      setForm(formFrom(product))
      hydrated.current = true
    }
  }, [product])

  const patch = (changes: Partial<FormState>) => setForm((prev) => ({ ...prev, ...changes }))

  const save = async () => {
    if (!requireOnline() || saving) return
    const name = form.name.trim()
    const targetPrice = Number(form.targetPrice)
    if (!name) return showToast('Please enter a product name.', 'error')
    if (!Number.isFinite(targetPrice) || targetPrice <= 0)
      return showToast('Enter a valid target price.', 'error')

    const minPrice = form.minPrice === '' ? undefined : Number(form.minPrice)
    const values: ProductInput = {
      name,
      breedOrType: form.breedOrType.trim(),
      targetPrice,
      minAcceptablePrice: Number.isFinite(minPrice) && (minPrice ?? 0) > 0 ? minPrice : undefined,
      iconType: form.iconType,
      iconValue: form.iconValue || '📦',
      status: form.status,
      notes: form.notes.trim() || undefined,
    }

    setSaving(true)
    try {
      if (productId != null) {
        await dataService.updateProduct(productId, values)
      } else {
        await dataService.createProduct({ ...values, status: 'AVAILABLE' })
      }
      haptic(15)
      showToast(productId ? 'Product updated.' : 'Product added.')
      onClose()
    } catch {
      showToast('Could not save the product.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (productId == null) return
    if (!requireOnline()) return
    try {
      await dataService.deleteProduct(productId)
      setConfirmDelete(false)
      showToast('Product and its inquiries deleted.')
      onClose()
    } catch {
      showToast('Could not delete the product.', 'error')
    }
  }

  const reopen = async () => {
    if (productId == null) return
    if (!requireOnline()) return
    try {
      await dataService.updateProduct(productId, {
        status: 'AVAILABLE',
        soldPrice: undefined,
        soldAt: undefined,
        soldNote: undefined,
      })
      setConfirmReopen(false)
      haptic(12)
      showToast('Product is available again.')
      onClose()
    } catch {
      showToast('Could not reopen the product.', 'error')
    }
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={productId ? 'Edit product' : 'New product'}
        subtitle={productId ? 'Update the details of this listing.' : 'Add an item you are bringing to market.'}
        footer={
          <div className="flex gap-3">
            {productId != null && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete product"
                className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 transition active:scale-95"
              >
                <Trash2 size={19} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-[52px] flex-1 rounded-xl bg-slate-100 font-semibold text-slate-700 transition active:scale-[.98]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="h-[52px] flex-[1.5] rounded-xl bg-emerald-600 font-bold text-white shadow-glow transition active:scale-[.98] disabled:opacity-60"
            >
              {productId ? 'Save changes' : 'Add product'}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {product?.status === 'SOLD' && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm">
              <p className="font-semibold text-sky-700">
                Sold for {formatCurrency(product.soldPrice)} on{' '}
                {product.soldAt ? new Date(product.soldAt).toLocaleDateString() : ''}
              </p>
              <button
                type="button"
                onClick={() => setConfirmReopen(true)}
                className="mt-2 flex min-h-[40px] items-center gap-1.5 text-xs font-bold text-sky-700"
              >
                <Undo2 size={14} /> Reopen as available
              </button>
            </div>
          )}

          <Field label="Product name">
            <input
              autoFocus
              value={form.name}
              onChange={(event) => patch({ name: event.target.value })}
              placeholder="e.g. Ceramic Mug Set"
              className="input-field"
            />
          </Field>

          <Field label="Breed / type">
            <input
              value={form.breedOrType}
              onChange={(event) => patch({ breedOrType: event.target.value })}
              placeholder="e.g. Home · Handmade"
              className="input-field"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Target price (৳)">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={form.targetPrice}
                onChange={(event) => patch({ targetPrice: event.target.value })}
                placeholder="850"
                className="input-field"
              />
            </Field>
            <Field label="Min. acceptable (৳)">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={form.minPrice}
                onChange={(event) => patch({ minPrice: event.target.value })}
                placeholder="700"
                className="input-field"
              />
            </Field>
          </div>

          <Field label="Icon">
            <IconPicker
              iconType={form.iconType}
              iconValue={form.iconValue}
              onChange={(iconType, iconValue) => patch({ iconType, iconValue })}
            />
          </Field>

          <Field label="Notes (optional)">
            <textarea
              value={form.notes}
              onChange={(event) => patch({ notes: event.target.value })}
              rows={3}
              placeholder="Temperament, care notes, anything buyers ask…"
              className="input-field resize-none"
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this product?"
        message="This also permanently deletes every inquiry logged for this product. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => void remove()}
        onCancel={() => setConfirmDelete(false)}
      />
      <ConfirmDialog
        open={confirmReopen}
        title="Reopen product?"
        message="The sale record will be cleared and this product will be marked available again."
        confirmLabel="Reopen"
        onConfirm={() => void reopen()}
        onCancel={() => setConfirmReopen(false)}
      />
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </span>
      {children}
    </label>
  )
}

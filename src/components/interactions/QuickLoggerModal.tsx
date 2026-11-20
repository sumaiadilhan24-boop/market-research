import { useEffect, useState } from 'react'
import { BadgeCheck, CheckCircle2, Plus, Save, ShoppingBag, ShoppingCart } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
import { useAppData } from '../../services/useData'
import { SENTIMENT_META, type CustomerSentiment, type InteractionDirection } from '../../types'
import { cx, formatCurrency, haptic } from '../../utils'
import { Modal } from '../common/Modal'
import { ProductIcon } from '../products/ProductIcon'
import { PriceStepper } from './PriceStepper'
import { QuestionChips } from './QuestionChips'

export function QuickLoggerModal() {
  const { isLoggerOpen, loggerProductId } = useApp()
  if (!isLoggerOpen) return null
  return <QuickLoggerInner key={loggerProductId ?? 'auto'} initialProductId={loggerProductId} />
}

function QuickLoggerInner({ initialProductId }: { initialProductId: number | null }) {
  const {
    selectedProductId,
    setSelectedProductId,
    activeVisitId,
    closeLogger,
    requireOnline,
    showToast,
    openProductModal,
    openVisitModal,
    openSoldModal,
  } = useApp()
  const { products, visits } = useAppData()

  const loggableProducts = products.filter((product) => product.status !== 'SOLD')
  const [productId, setProductId] = useState<number | null>(
    initialProductId ?? selectedProductId ?? null,
  )
  const [visitId, setVisitId] = useState<number | null>(activeVisitId ?? null)
  const [direction, setDirection] = useState<InteractionDirection>('SELL')
  const [questions, setQuestions] = useState<string[]>([])
  const [customDraft, setCustomDraft] = useState('')
  const [price, setPrice] = useState(0)
  const [sentiment, setSentiment] = useState<CustomerSentiment>('HIGH_INTEREST')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (productId === null && loggableProducts.length > 0) {
      setProductId(loggableProducts[0].id ?? null)
    }
  }, [loggableProducts.length, productId])

  useEffect(() => {
    if (visitId === null && visits.length > 0) setVisitId(visits[0].id ?? null)
  }, [visits.length, visitId])

  const selectedProduct = products.find((product) => product.id === productId)
  const selectedVisit = visits.find((visit) => visit.id === visitId)

  const toggleQuestion = (question: string) => {
    haptic(8)
    setQuestions((prev) =>
      prev.includes(question) ? prev.filter((item) => item !== question) : [...prev, question],
    )
  }

  const save = async () => {
    if (!requireOnline() || saving) return
    if (productId == null) return showToast('Select a product first.', 'error')
    if (visitId == null) return showToast('Create a visit first.', 'error')

    setSaving(true)
    try {
      await dataService.createInteraction({
        visitId,
        productId,
        direction,
        questions,
        customQuestion: customDraft.trim() || undefined,
        offeredPrice: price > 0 ? price : undefined,
        customerSentiment: sentiment,
        customerNotes: notes.trim() || undefined,
      })
      haptic([10, 30, 10])
      showToast(direction === 'SELL' ? 'Sale inquiry saved.' : 'Buy log saved.')
      setQuestions([])
      setCustomDraft('')
      setPrice(0)
      setNotes('')
      setSaved(true)
    } catch {
      showToast('Could not save the inquiry.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={closeLogger}
      title="Log market activity"
      subtitle={
        direction === 'SELL'
          ? 'Selling · capture what buyers asked and offered.'
          : 'Buying · capture what sellers quoted and you asked.'
      }
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={closeLogger}
            className="h-[52px] flex-1 rounded-xl bg-slate-100 font-semibold text-slate-700 transition active:scale-[.98]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || productId === null || visitId === null}
            className="flex h-[52px] flex-[1.5] items-center justify-center gap-2 rounded-xl bg-emerald-600 font-bold text-white shadow-glow transition active:scale-[.98] disabled:opacity-50"
          >
            <Save size={18} /> {saving ? 'Saving…' : direction === 'SELL' ? 'Save sale log' : 'Save buy log'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <section>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            What are you doing?
          </span>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            {(
              [
                { key: 'SELL' as const, label: "I'm selling", icon: ShoppingBag },
                { key: 'BUY' as const, label: "I'm buying", icon: ShoppingCart },
              ]
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  haptic(8)
                  setDirection(key)
                }}
                className={cx(
                  'flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition active:scale-[.98]',
                  direction === key
                    ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200'
                    : 'text-slate-600',
                )}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </section>

        {saved && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 size={20} />
              <p className="font-bold">
                {direction === 'SELL' ? 'Sale inquiry saved!' : 'Buy log saved!'}
              </p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setSaved(false)}
                className="min-h-[42px] flex-1 rounded-xl bg-slate-100 text-xs font-bold text-slate-900 transition active:scale-95"
              >
                Log another
              </button>
              {direction === 'SELL' && selectedProduct && (
                <button
                  type="button"
                  onClick={() => {
                    closeLogger()
                    openSoldModal(selectedProduct.id!)
                  }}
                  className="flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-100 text-xs font-bold text-sky-700 ring-1 ring-inset ring-sky-200 transition active:scale-95"
                >
                  <BadgeCheck size={15} /> Mark as sold
                </button>
              )}
            </div>
          </div>
        )}

        <section>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Product</span>
            <button
              type="button"
              onClick={() => {
                closeLogger()
                openProductModal()
              }}
              className="flex min-h-[32px] items-center gap-1 text-xs font-bold text-emerald-700"
            >
              <Plus size={14} /> New product
            </button>
          </div>
          {loggableProducts.length === 0 ? (
            <div className="rounded-xl bg-slate-100 p-4 text-center text-xs text-slate-600">
              No available products. Add one to start logging.
            </div>
          ) : (
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-2">
              {loggableProducts.map((product) => {
                const active = product.id === productId
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      haptic(8)
                      setProductId(product.id ?? null)
                      setSelectedProductId(product.id ?? null)
                    }}
                    className={cx(
                      'flex min-h-[50px] shrink-0 items-center gap-2 rounded-xl px-3 text-left transition active:scale-95',
                      active
                        ? 'bg-emerald-100 ring-2 ring-emerald-300'
                        : 'bg-slate-100 ring-1 ring-inset ring-slate-200',
                    )}
                  >
                    <ProductIcon product={product} size={22} />
                    <span className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">{product.name}</span>
                      <span className="text-[10px] text-slate-600">
                        {formatCurrency(product.targetPrice)}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Visit</span>
            <button
              type="button"
              onClick={() => {
                closeLogger()
                openVisitModal()
              }}
              className="flex min-h-[32px] items-center gap-1 text-xs font-bold text-emerald-700"
            >
              <Plus size={14} /> New visit
            </button>
          </div>
          {visits.length === 0 ? (
            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
              No visits yet — create one before saving a log.
            </div>
          ) : (
            <select
              value={visitId ?? ''}
              onChange={(event) => setVisitId(Number(event.target.value))}
              className="input-field"
            >
              {visits.map((visit) => (
                <option key={visit.id} value={visit.id} className="bg-white">
                  {visit.visitDate} · {visit.title}
                </option>
              ))}
            </select>
          )}
          {selectedVisit?.location && (
            <p className="mt-1 text-[11px] text-slate-500">📍 {selectedVisit.location}</p>
          )}
        </section>

        <QuestionChips
          selected={questions}
          onToggle={toggleQuestion}
          customDraft={customDraft}
          onCustomDraftChange={setCustomDraft}
        />

        <PriceStepper
          value={price}
          onChange={setPrice}
          label={direction === 'SELL' ? 'Buyer offer' : 'Seller quote'}
        />

        <section>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            {direction === 'SELL' ? 'Customer interest' : 'Seller attitude'}
          </span>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SENTIMENT_META) as CustomerSentiment[]).map((key) => {
              const meta = SENTIMENT_META[key]
              const active = sentiment === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    haptic(8)
                    setSentiment(key)
                  }}
                  className={cx(
                    'flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition active:scale-95',
                    active
                      ? meta.active
                      : 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
                  )}
                >
                  <span>{meta.emoji}</span> {meta.label}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">
            Notes (optional)
          </span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="Anything memorable about this customer…"
            className="input-field resize-none"
          />
        </section>
      </div>
    </Modal>
  )
}

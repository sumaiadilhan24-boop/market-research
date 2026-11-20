import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { dataService } from '../../services/dataService'
import { useAppData } from '../../services/useData'
import type { Visit } from '../../types'
import { todayISO } from '../../utils'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { Modal } from '../common/Modal'

interface FormState {
  title: string
  visitDate: string
  location: string
  notes: string
}

function emptyForm(): FormState {
  return { title: '', visitDate: todayISO(), location: '', notes: '' }
}

function formFrom(visit: Visit): FormState {
  return {
    title: visit.title,
    visitDate: visit.visitDate,
    location: visit.location ?? '',
    notes: visit.notes ?? '',
  }
}

export function VisitModal() {
  const { isVisitModalOpen, editVisitId, closeVisitModal } = useApp()
  if (!isVisitModalOpen) return null
  return <VisitModalInner key={editVisitId ?? 'new'} visitId={editVisitId} onClose={closeVisitModal} />
}

function VisitModalInner({ visitId, onClose }: { visitId: number | null; onClose: () => void }) {
  const { showToast, requireOnline, setActiveVisitId } = useApp()
  const { visits } = useAppData()
  const visit = visits.find((item) => item.id === visitId)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const hydrated = useRef(visitId === null)

  useEffect(() => {
    if (visit && !hydrated.current) {
      setForm(formFrom(visit))
      hydrated.current = true
    }
  }, [visit])

  const patch = (changes: Partial<FormState>) => setForm((prev) => ({ ...prev, ...changes }))

  const save = async () => {
    if (!requireOnline() || saving) return
    const title = form.title.trim()
    if (!title) return showToast('Please enter a visit title.', 'error')
    if (!form.visitDate) return showToast('Please choose a date.', 'error')

    const values = {
      title,
      visitDate: form.visitDate,
      location: form.location.trim() || undefined,
      notes: form.notes.trim() || undefined,
    }

    setSaving(true)
    try {
      if (visitId != null) {
        await dataService.updateVisit(visitId, values)
      } else {
        const created = await dataService.createVisit(values)
        setActiveVisitId(created.id ?? null)
      }
      showToast(visitId ? 'Visit updated.' : 'Visit created — it is now active.')
      onClose()
    } catch {
      showToast('Could not save the visit.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (visitId == null) return
    if (!requireOnline()) return
    try {
      await dataService.deleteVisit(visitId)
      setConfirmDelete(false)
      showToast('Visit and its inquiries deleted.')
      onClose()
    } catch {
      showToast('Could not delete the visit.', 'error')
    }
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={visitId ? 'Edit visit' : 'New visit'}
        subtitle="Group inquiries by market day or event."
        footer={
          <div className="flex gap-3">
            {visitId != null && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete visit"
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
              {visitId ? 'Save changes' : 'Create visit'}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Visit title
            </span>
            <input
              autoFocus
              value={form.title}
              onChange={(event) => patch({ title: event.target.value })}
              placeholder="e.g. Saturday Pet Fair"
              className="input-field"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Date
            </span>
            <input
              type="date"
              value={form.visitDate}
              onChange={(event) => patch({ visitDate: event.target.value })}
              className="input-field"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Location (optional)
            </span>
            <input
              value={form.location}
              onChange={(event) => patch({ location: event.target.value })}
              placeholder="e.g. Downtown Market"
              className="input-field"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Notes (optional)
            </span>
            <textarea
              value={form.notes}
              onChange={(event) => patch({ notes: event.target.value })}
              rows={3}
              placeholder="Weather, foot traffic, observations…"
              className="input-field resize-none"
            />
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this visit?"
        message="All inquiries logged during this visit will also be permanently deleted."
        confirmLabel="Delete"
        danger
        onConfirm={() => void remove()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}

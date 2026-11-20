import { useRef, useState } from 'react'
import { Cloud, Database, Download, FileJson, LogOut, RotateCcw, Trash2, Upload, UserRound } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { dataService } from '../../services/dataService'
import { exportCsv, exportJson, importJson } from '../../services/exportImport'
import { useAppData } from '../../services/useData'
import { haptic } from '../../utils'
import { Card } from '../common/Card'
import { ConfirmDialog } from '../common/ConfirmDialog'

export function DataPanel() {
  const { mode, products, visits, interactions, refresh } = useAppData()
  const { showToast, requireOnline } = useApp()
  const { user, requiresAuth, signOut } = useAuth()
  const fileInput = useRef<HTMLInputElement>(null)
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('merge')
  const [confirmAction, setConfirmAction] = useState<'seed' | 'clear' | null>(null)
  const [busy, setBusy] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()

  const handleImport = async (file: File | undefined) => {
    if (!file) return
    if (!requireOnline()) return
    setBusy(true)
    try {
      const result = await importJson(file, importMode === 'replace')
      showToast(
        `Imported ${result.products} products, ${result.visits} visits, ${result.interactions} inquiries.`,
      )
      await refresh()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Import failed.', 'error')
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const runMaintenance = async (action: 'seed' | 'clear') => {
    if (!requireOnline()) return
    setBusy(true)
    try {
      if (action === 'seed') await dataService.resetToSeed()
      else await dataService.clearAll()
      await refresh()
      showToast(action === 'seed' ? 'Sample data restored.' : 'All data cleared.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Operation failed.', 'error')
    } finally {
      setBusy(false)
      setConfirmAction(null)
    }
  }

  const logout = async () => {
    setSigningOut(true)
    try {
      await signOut()
      showToast('Signed out.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not sign out.', 'error')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="space-y-3">
      {requiresAuth && user && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <UserRound size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Signed in as</p>
              <p className="truncate text-sm font-bold text-slate-900">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              disabled={signingOut}
              className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-800 transition active:scale-[.98] disabled:opacity-60"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            {mode === 'supabase' ? <Cloud size={21} /> : <Database size={21} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900">
              {mode === 'supabase' ? 'Supabase connected' : 'Demo mode'}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              {mode === 'supabase'
                ? 'Records are saved directly to your Supabase PostgreSQL database.'
                : 'No credentials configured. Sample data is stored locally so you can test everything instantly.'}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Count label="Products" value={products.length} />
          <Count label="Visits" value={visits.length} />
          <Count label="Inquiries" value={interactions.length} />
        </div>
        {mode === 'supabase' && supabaseUrl && (
          <a
            href={supabaseUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-800 transition active:scale-[.98]"
          >
            <Cloud size={15} /> Open Supabase dashboard
          </a>
        )}
      </Card>

      {mode === 'demo' && (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-700">Connect your own database</p>
          <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-600">
            <li>1. Copy <code className="break-all text-amber-700">.env.example</code> to <code className="break-all text-amber-700">.env.local</code>.</li>
            <li>2. Add your <code className="break-all text-amber-700">VITE_SUPABASE_URL</code> and anon key.</li>
            <li>3. Run <code className="break-all text-amber-700">supabase/schema.sql</code> in the SQL Editor.</li>
            <li>4. Restart the dev server — data will then persist in Supabase.</li>
          </ol>
        </Card>
      )}

      <Card className="p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
          <Download size={16} className="text-emerald-700" /> Backup &amp; export
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              haptic(10)
              exportJson()
              showToast('JSON backup downloaded.')
            }}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-300 transition active:scale-[.98]"
          >
            <FileJson size={17} /> Export JSON
          </button>
          <button
            type="button"
            onClick={() => {
              haptic(10)
              exportCsv()
              showToast('CSV downloaded.')
            }}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-800 transition active:scale-[.98]"
          >
            <Download size={17} /> Export CSV
          </button>
        </div>
      </Card>

      <Card className="p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
          <Upload size={16} className="text-sky-700" /> Restore from backup
        </p>
        <div className="mb-2 grid grid-cols-2 gap-2">
          {(['merge', 'replace'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setImportMode(option)}
              className={`min-h-[42px] rounded-xl text-xs font-bold capitalize transition active:scale-[.98] ${
                importMode === option
                  ? 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="mb-3 text-[11px] text-slate-500">
          {importMode === 'merge'
            ? 'Adds backup records to your current data with fresh IDs.'
            : 'Deletes all current records before restoring the backup.'}
        </p>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => void handleImport(event.target.files?.[0])}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-sky-600 font-bold text-white transition active:scale-[.98] disabled:opacity-60"
        >
          <Upload size={17} /> Choose JSON backup
        </button>
      </Card>

      <Card className="p-4">
        <p className="mb-3 text-sm font-bold text-slate-900">Maintenance</p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setConfirmAction('seed')}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-800 transition active:scale-[.98]"
          >
            <RotateCcw size={16} /> Restore sample data
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction('clear')}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-rose-50 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 transition active:scale-[.98]"
          >
            <Trash2 size={16} /> Delete all records
          </button>
        </div>
      </Card>

      <p className="pb-2 text-center text-[10px] text-slate-600">Market Research v3.0 · Built for the field</p>

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction === 'seed' ? 'Restore sample data?' : 'Delete everything?'}
        message={
          confirmAction === 'seed'
            ? 'All current records will be replaced with the standard demo dataset.'
            : 'All products, visits and inquiries will be permanently deleted. This cannot be undone.'
        }
        confirmLabel={confirmAction === 'seed' ? 'Restore' : 'Delete all'}
        danger={confirmAction === 'clear'}
        onConfirm={() => void runMaintenance(confirmAction!)}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-100 py-2.5">
      <p className="text-lg font-extrabold tabular-nums text-slate-900">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  )
}

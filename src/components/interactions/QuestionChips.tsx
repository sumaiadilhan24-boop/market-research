import { Plus, X } from 'lucide-react'
import { COMMON_QUESTIONS } from '../../lib/seed'
import { cx, haptic } from '../../utils'

interface QuestionChipsProps {
  selected: string[]
  onToggle: (question: string) => void
  customDraft: string
  onCustomDraftChange: (value: string) => void
}

export function QuestionChips({
  selected,
  onToggle,
  customDraft,
  onCustomDraftChange,
}: QuestionChipsProps) {
  const addCustom = () => {
    const value = customDraft.trim()
    if (!value) return
    onToggle(value)
    onCustomDraftChange('')
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Questions asked
        </span>
        <span className="text-[11px] text-slate-500">tap to toggle</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {COMMON_QUESTIONS.map((preset) => {
          const active = selected.includes(preset.label)
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onToggle(preset.label)}
              className={cx(
                'flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition active:scale-95',
                active
                  ? 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-300'
                  : 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
              )}
            >
              <span>{preset.emoji}</span>
              {preset.label}
              {active && <X size={13} className="text-emerald-700" />}
            </button>
          )
        })}

        {selected
          .filter((question) => !COMMON_QUESTIONS.some((preset) => preset.label === question))
          .map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onToggle(question)}
              className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-300"
            >
              ✏️ {question} <X size={13} />
            </button>
          ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={customDraft}
          onChange={(event) => onCustomDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addCustom()
            }
          }}
          placeholder="Custom question…"
          className="input-field min-h-[44px] flex-1"
        />
        <button
          type="button"
          onClick={() => {
            haptic(8)
            addCustom()
          }}
          aria-label="Add custom question"
          className="flex h-[44px] w-[48px] shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 transition active:scale-95"
        >
          <Plus size={19} />
        </button>
      </div>
    </div>
  )
}

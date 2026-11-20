import { Link2, Smile } from 'lucide-react'
import { EMOJI_CHOICES } from '../../lib/seed'
import type { IconType } from '../../types'
import { cx, haptic } from '../../utils'

interface IconPickerProps {
  iconType: IconType
  iconValue: string
  onChange: (type: IconType, value: string) => void
}

export function IconPicker({ iconType, iconValue, onChange }: IconPickerProps) {
  const mode: 'emoji' | 'url' = iconType === 'url' ? 'url' : 'emoji'

  const setMode = (next: 'emoji' | 'url') => {
    haptic(8)
    onChange(next, next === 'emoji' ? '📦' : iconValue.startsWith('http') ? iconValue : '')
  }

  return (
    <div>
      <div className="mb-2 flex gap-2">
        <ModeButton active={mode === 'emoji'} onClick={() => setMode('emoji')} icon={<Smile size={15} />}>
          Emoji
        </ModeButton>
        <ModeButton active={mode === 'url'} onClick={() => setMode('url')} icon={<Link2 size={15} />}>
          Image URL
        </ModeButton>
      </div>

      {mode === 'emoji' ? (
        <>
          <div className="grid grid-cols-8 gap-1.5">
            {EMOJI_CHOICES.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  haptic(8)
                  onChange('emoji', emoji)
                }}
                className={cx(
                  'flex h-11 items-center justify-center rounded-xl text-xl transition active:scale-90',
                  iconValue === emoji && iconType === 'emoji'
                    ? 'bg-emerald-100 ring-2 ring-emerald-500'
                    : 'bg-slate-100 hover:bg-slate-100',
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
          <input
            value={iconType === 'emoji' ? iconValue : ''}
            onChange={(event) => onChange('emoji', event.target.value.slice(0, 8))}
            placeholder="Or type any emoji…"
            className="mt-2 min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3 text-center text-xl text-slate-900 placeholder:text-base placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none"
          />
        </>
      ) : (
        <div>
          <input
            value={iconValue}
            onChange={(event) => onChange('url', event.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none"
          />
          <p className="mt-2 text-xs text-slate-500">Paste an image URL for a custom product photo.</p>
        </div>
      )}
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition active:scale-[.98]',
        active
          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-300'
          : 'bg-slate-100 text-slate-600',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

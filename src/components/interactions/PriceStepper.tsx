import { Minus, Plus } from 'lucide-react'
import { PRICE_PRESETS, QUICK_ADD_AMOUNTS } from '../../lib/seed'
import { clamp, cx, formatCurrency, haptic } from '../../utils'

interface PriceStepperProps {
  value: number
  onChange: (value: number) => void
  label?: string
}

export function PriceStepper({ value, onChange, label = 'Offered price' }: PriceStepperProps) {
  const step = (delta: number) => {
    haptic(8)
    onChange(clamp(value + delta, 0, 1_000_000))
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          {label}
        </span>
        <span className="text-2xl font-extrabold tabular-nums text-emerald-700">
          {formatCurrency(value)}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {QUICK_ADD_AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => step(amount)}
            className="min-h-[48px] rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700 ring-1 ring-inset ring-emerald-300 transition active:scale-95"
          >
            +৳{amount}
          </button>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => step(-25)}
          className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 transition active:scale-95"
        >
          <Minus size={14} /> ৳25
        </button>
        <button
          type="button"
          onClick={() => step(-10)}
          className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 transition active:scale-95"
        >
          <Minus size={14} /> ৳10
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {PRICE_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              haptic(8)
              onChange(preset)
            }}
            className={cx(
              'min-h-[44px] rounded-xl text-xs font-bold transition active:scale-95',
              value === preset
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
            )}
          >
            {formatCurrency(preset)}
          </button>
        ))}
      </div>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Exact amount (৳)
        </span>
        <div className="relative">
          <Plus size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={value === 0 ? '' : value}
            onChange={(event) => onChange(clamp(Number(event.target.value) || 0, 0, 1_000_000))}
            placeholder="0"
            className="input-field pl-9 text-base font-bold"
          />
        </div>
      </label>
    </div>
  )
}

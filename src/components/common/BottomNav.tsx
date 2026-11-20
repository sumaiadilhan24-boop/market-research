import { BarChart3, CalendarDays, Database, PawPrint, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import type { TabKey } from '../../types'
import { cx, haptic } from '../../utils'

interface TabItem {
  key: TabKey
  label: string
  icon: LucideIcon
}

const tabs: TabItem[] = [
  { key: 'visits', label: 'Visits', icon: CalendarDays },
  { key: 'products', label: 'Products', icon: PawPrint },
  { key: 'insights', label: 'Insights', icon: BarChart3 },
  { key: 'data', label: 'Data', icon: Database },
]

export function BottomNav() {
  const { activeTab, setActiveTab, openLogger } = useApp()

  const go = (tab: TabKey) => {
    haptic(8)
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="grid h-[68px] grid-cols-5 items-center px-1.5">
        {tabs.slice(0, 2).map((tab) => (
          <NavButton key={tab.key} tab={tab} active={activeTab === tab.key} onClick={() => go(tab.key)} />
        ))}

        <div className="flex justify-center">
          <button
            type="button"
            aria-label="Log a new inquiry"
            onClick={() => {
              haptic(12)
              openLogger()
            }}
            className="-mt-7 flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-full bg-emerald-600 text-white shadow-[0_8px_28px_-6px_rgba(5,150,105,.35)] ring-4 ring-white transition-transform active:scale-95"
          >
            <Plus size={24} strokeWidth={3} />
            <span className="text-[10px] font-extrabold leading-none">LOG</span>
          </button>
        </div>

        {tabs.slice(2).map((tab) => (
          <NavButton key={tab.key} tab={tab} active={activeTab === tab.key} onClick={() => go(tab.key)} />
        ))}
      </div>
    </nav>
  )
}

function NavButton({
  tab,
  active,
  onClick,
}: {
  tab: TabItem
  active: boolean
  onClick: () => void
}) {
  const Icon = tab.icon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'flex h-14 min-w-[48px] flex-col items-center justify-center gap-1 rounded-xl transition-colors active:scale-95',
        active ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700',
      )}
    >
      <Icon size={21} strokeWidth={active ? 2.6 : 2} />
      <span className={cx('text-[10px] font-semibold leading-none', active && 'font-bold')}>
        {tab.label}
      </span>
    </button>
  )
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { DataMode } from './dataService'
import { dataService } from './dataService'
import type { DataSnapshot } from '../types'

interface UseDataResult extends DataSnapshot {
  loading: boolean
  error: string | null
  mode: DataMode
  refresh: () => Promise<void>
}

/** Reactive view of the data service cache; re-renders after every write. */
export function useData(): UseDataResult {
  const [snapshot, setSnapshot] = useState<DataSnapshot>(() => dataService.snapshot())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const unsubscribe = dataService.subscribe(() => {
      if (active) setSnapshot(dataService.snapshot())
    })

    void dataService
      .refresh()
      .then(() => {
        if (active) {
          setError(null)
          setLoading(false)
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : String(reason))
          setLoading(false)
        }
      })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return {
    ...snapshot,
    loading,
    error,
    mode: dataService.mode,
    refresh: () => dataService.refresh(),
  }
}

const DataContext = createContext<UseDataResult | null>(null)

/** Loads the shared snapshot once for the whole app. */
export function DataProvider({ children }: { children: ReactNode }) {
  const value = useData()
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useAppData(): UseDataResult {
  const context = useContext(DataContext)
  if (!context) throw new Error('useAppData must be used inside <DataProvider>')
  return context
}

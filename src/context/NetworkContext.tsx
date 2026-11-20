import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { dataService } from '../services/dataService'

interface NetworkContextValue {
  /** True only when the browser is online AND a Supabase/demo probe succeeds. */
  isOnline: boolean
  /** True while a connectivity probe is in flight. */
  isChecking: boolean
  /** Timestamp of the last successful connectivity probe. */
  lastPingSuccess: number | null
  /** Run a connectivity probe immediately. */
  checkNow: () => Promise<boolean>
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined)

const ONLINE_INTERVAL = 15_000
const OFFLINE_INTERVAL = 3_000
const PROBE_TIMEOUT = 3_000

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )
  const [isChecking, setIsChecking] = useState(false)
  const [lastPingSuccess, setLastPingSuccess] = useState<number | null>(null)
  const alive = useRef(true)

  const checkNow = useCallback(async (): Promise<boolean> => {
    if (!alive.current) return false

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false)
      return false
    }

    setIsChecking(true)
    let timer = 0
    const timeout = new Promise<boolean>((resolve) => {
      timer = window.setTimeout(() => resolve(false), PROBE_TIMEOUT)
    })

    try {
      const result = await Promise.race([dataService.ping(), timeout])
      if (result) {
        setLastPingSuccess(Date.now())
        setIsOnline(true)
      } else {
        setIsOnline(false)
      }
      return result
    } catch {
      setIsOnline(false)
      return false
    } finally {
      window.clearTimeout(timer)
      if (alive.current) setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    alive.current = true
    const handleOnline = () => void checkNow()
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    void checkNow()

    return () => {
      alive.current = false
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkNow])

  useEffect(() => {
    const interval = window.setInterval(
      () => void checkNow(),
      isOnline ? ONLINE_INTERVAL : OFFLINE_INTERVAL,
    )
    return () => window.clearInterval(interval)
  }, [isOnline, checkNow])

  return (
    <NetworkContext.Provider value={{ isOnline, isChecking, lastPingSuccess, checkNow }}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext)
  if (!context) throw new Error('useNetwork must be used inside <NetworkProvider>')
  return context
}

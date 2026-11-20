import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { ProductStatus, TabKey } from '../types'
import { useNetwork } from './NetworkContext'

type ToastKind = 'success' | 'error' | 'info'
interface ToastMessage {
  id: number
  message: string
  kind: ToastKind
}

interface AppContextValue {
  activeVisitId: number | null
  setActiveVisitId: (id: number | null) => void
  selectedProductId: number | null
  setSelectedProductId: (id: number | null) => void
  productFilter: ProductStatus | 'ALL'
  setProductFilter: (filter: ProductStatus | 'ALL') => void
  activeTab: TabKey
  setActiveTab: (tab: TabKey) => void

  isLoggerOpen: boolean
  loggerProductId: number | null
  openLogger: (productId?: number) => void
  closeLogger: () => void

  isProductModalOpen: boolean
  editProductId: number | null
  openProductModal: (id?: number) => void
  closeProductModal: () => void

  isVisitModalOpen: boolean
  editVisitId: number | null
  openVisitModal: (id?: number) => void
  closeVisitModal: () => void

  soldProductId: number | null
  openSoldModal: (id: number) => void
  closeSoldModal: () => void

  toast: ToastMessage | null
  showToast: (message: string, kind?: ToastKind) => void
  dismissToast: () => void
  /** Guard for write actions: shows a toast and returns false while offline. */
  requireOnline: () => boolean
}

const AppContext = createContext<AppContextValue | undefined>(undefined)
const ACTIVE_VISIT_KEY = 'market-research.activeVisitId'

function readStoredVisit(): number | null {
  try {
    const raw = localStorage.getItem(ACTIVE_VISIT_KEY)
    return raw === null ? null : Number(raw)
  } catch {
    return null
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { isOnline } = useNetwork()

  const [activeVisitId, setActiveVisitIdState] = useState<number | null>(readStoredVisit)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [productFilter, setProductFilter] = useState<ProductStatus | 'ALL'>('ALL')
  const [activeTab, setActiveTab] = useState<TabKey>('visits')

  const [isLoggerOpen, setIsLoggerOpen] = useState(false)
  const [loggerProductId, setLoggerProductId] = useState<number | null>(null)

  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editProductId, setEditProductId] = useState<number | null>(null)

  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false)
  const [editVisitId, setEditVisitId] = useState<number | null>(null)

  const [soldProductId, setSoldProductId] = useState<number | null>(null)

  const [toast, setToast] = useState<ToastMessage | null>(null)
  const toastTimer = useRef<number | null>(null)

  const setActiveVisitId = useCallback((id: number | null) => {
    setActiveVisitIdState(id)
    try {
      if (id === null) localStorage.removeItem(ACTIVE_VISIT_KEY)
      else localStorage.setItem(ACTIVE_VISIT_KEY, String(id))
    } catch {
      /* storage unavailable — keep in-memory state */
    }
  }, [])

  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), message, kind })
    toastTimer.current = window.setTimeout(() => setToast(null), 2800)
  }, [])

  const dismissToast = useCallback(() => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current)
    setToast(null)
  }, [])

  const requireOnline = useCallback(() => {
    if (isOnline) return true
    showToast('You are offline. Reconnect before saving.', 'error')
    return false
  }, [isOnline, showToast])

  const openLogger = useCallback(
    (productId?: number) => {
      setLoggerProductId(productId ?? selectedProductId ?? null)
      setIsLoggerOpen(true)
    },
    [selectedProductId],
  )

  const openProductModal = useCallback((id?: number) => {
    setEditProductId(id ?? null)
    setIsProductModalOpen(true)
  }, [])

  const openVisitModal = useCallback((id?: number) => {
    setEditVisitId(id ?? null)
    setIsVisitModalOpen(true)
  }, [])

  const openSoldModal = useCallback((id: number) => setSoldProductId(id), [])

  useEffect(() => {
    return () => {
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current)
    }
  }, [])

  return (
    <AppContext.Provider
      value={{
        activeVisitId,
        setActiveVisitId,
        selectedProductId,
        setSelectedProductId,
        productFilter,
        setProductFilter,
        activeTab,
        setActiveTab,
        isLoggerOpen,
        loggerProductId,
        openLogger,
        closeLogger: () => setIsLoggerOpen(false),
        isProductModalOpen,
        editProductId,
        openProductModal,
        closeProductModal: () => setIsProductModalOpen(false),
        isVisitModalOpen,
        editVisitId,
        openVisitModal,
        closeVisitModal: () => setIsVisitModalOpen(false),
        soldProductId,
        openSoldModal,
        closeSoldModal: () => setSoldProductId(null),
        toast,
        showToast,
        dismissToast,
        requireOnline,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside <AppProvider>')
  return context
}

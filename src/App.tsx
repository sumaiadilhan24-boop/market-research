import { lazy, Suspense, useEffect } from 'react'
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NetworkProvider } from './context/NetworkContext'
import { DataProvider, useAppData } from './services/useData'
import { BottomNav } from './components/common/BottomNav'
import { OfflineOverlay } from './components/common/OfflineOverlay'
import { Toast } from './components/common/Toast'
import { AuthScreen } from './components/auth/AuthScreen'
import { ProductModal } from './components/products/ProductModal'
import { SoldModal } from './components/products/SoldModal'
import { VisitModal } from './components/visits/VisitModal'
import { QuickLoggerModal } from './components/interactions/QuickLoggerModal'

const VisitsView = lazy(() => import('./views/VisitsView').then((module) => ({ default: module.VisitsView })))
const ProductsView = lazy(() => import('./views/ProductsView').then((module) => ({ default: module.ProductsView })))
const InsightsView = lazy(() => import('./views/InsightsView').then((module) => ({ default: module.InsightsView })))
const DataView = lazy(() => import('./views/DataView').then((module) => ({ default: module.DataView })))

export default function App() {
  return (
    <NetworkProvider>
      <AuthProvider>
        <DataProvider>
          <AppProvider>
            <AppShell />
          </AppProvider>
        </DataProvider>
      </AuthProvider>
    </NetworkProvider>
  )
}

function LoadingScreen({ label = 'Loading Market Research…' }: { label?: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-slate-600">
      <Loader2 size={28} className="animate-spin text-emerald-600" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

function AppShell() {
  const { activeTab, activeVisitId, setActiveVisitId } = useApp()
  const { visits, loading, error, refresh } = useAppData()
  const { user, loading: authLoading, requiresAuth } = useAuth()

  useEffect(() => {
    if (loading || visits.length === 0) return
    if (activeVisitId === null || !visits.some((visit) => visit.id === activeVisitId)) {
      setActiveVisitId(visits[0].id ?? null)
    }
  }, [loading, visits, activeVisitId, setActiveVisitId])

  if (authLoading) return <LoadingScreen label="Checking your session…" />
  if (requiresAuth && !user) return <AuthScreen />

  return (
    <div className="app-bottom-space min-h-[100dvh] bg-slate-50">
      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          {error && (
            <div className="flex items-center gap-3 border-b border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              <AlertTriangle size={16} className="shrink-0" />
              <span className="flex-1">Could not reach the database: {error}</span>
              <button
                type="button"
                onClick={() => void refresh()}
                className="flex min-h-[36px] items-center gap-1 rounded-lg bg-slate-100 px-2.5 font-bold"
              >
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}
          <Suspense fallback={<LoadingScreen />}>
            {activeTab === 'visits' && <VisitsView />}
            {activeTab === 'products' && <ProductsView />}
            {activeTab === 'insights' && <InsightsView />}
            {activeTab === 'data' && <DataView />}
          </Suspense>
        </>
      )}

      <BottomNav />
      <QuickLoggerModal />
      <ProductModal />
      <VisitModal />
      <SoldModal />
      <Toast />
      <OfflineOverlay />
    </div>
  )
}

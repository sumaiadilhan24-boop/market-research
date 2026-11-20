import { Header } from '../components/common/Header'
import { DataPanel } from '../components/data/DataPanel'

export function DataView() {
  return (
    <>
      <Header title="Data" subtitle="Connection, backup & demo mode" />
      <div className="p-4">
        <DataPanel />
      </div>
    </>
  )
}

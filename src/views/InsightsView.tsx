import { Header } from '../components/common/Header'
import { MarketSummary } from '../components/analytics/MarketSummary'
import { InquiryChart } from '../components/analytics/InquiryChart'
import { PriceDistribution } from '../components/analytics/PriceDistribution'

export function InsightsView() {
  return (
    <>
      <Header title="Insights" subtitle="Market research at a glance" />
      <div className="space-y-3 p-4">
        <MarketSummary />
        <InquiryChart />
        <PriceDistribution />
      </div>
    </>
  )
}

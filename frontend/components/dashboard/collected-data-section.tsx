// 웹소스별 수집된 데이터 표시
import { DataTable } from './data-table'
import { WebSourceDataCard } from './web-source-data-card'

export function CollectedDataSection() {
  return (
    <div className="space-y-6">
      {webSources.map(source => (
        <WebSourceDataCard key={source.id} source={source}>
          <DataTable data={collectedData} source={source} />
        </WebSourceDataCard>
      ))}
    </div>
  )
}
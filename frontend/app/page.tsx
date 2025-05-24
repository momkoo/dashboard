// app/page.tsx - 메인 페이지 (MainDataDashboard 사용)
import { MainDataDashboard } from '../components/main-data-dashboard'
import { NavigationBar } from '../components/layout/navigation-bar'

export default function Home() {
  return (
    <>
      <NavigationBar />
      <div className="container mx-auto py-4">
        <MainDataDashboard />
      </div>
    </>
  )
}

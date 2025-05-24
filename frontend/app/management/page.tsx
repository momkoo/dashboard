// app/management/page.tsx - 관리 페이지 (WebSourceManagement 사용)
import { WebSourceManagement } from '@/components/web-source-management'
import { NavigationBar } from '@/components/layout/navigation-bar'

export default function ManagementPage() {
  return (
    <>
      <NavigationBar />
      <div className="container mx-auto py-4">
        <WebSourceManagement />
      </div>
    </>
  )
}

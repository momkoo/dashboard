// app/analyze/page.tsx - 분석 페이지 (기존 WebSourceEditor 사용)
"use client"

import { useSearchParams } from 'next/navigation'
import WebSourceEditor from '@/components/web-source-editor'
import { NavigationBar } from '@/components/layout/navigation-bar'

export default function AnalyzePage() {
  const searchParams = useSearchParams()
  const initialUrl = searchParams.get('url') || ''

  return (
    <>
      <NavigationBar />
      <div className="container mx-auto py-4">
        <WebSourceEditor initialUrl={initialUrl} />
      </div>
    </>
  )
}
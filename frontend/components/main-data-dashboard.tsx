"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { WebSourceDataCard } from "./dashboard/web-source-data-card"
import { EmptyState } from "./dashboard/empty-state"
import { Globe, Loader2, Search } from "lucide-react"

// Types for our web sources with collected data
export interface CollectedDataItem {
  id: string
  [key: string]: any
}

export interface WebSourceWithData {
  id: string
  name: string
  url: string
  status: "active" | "inactive" | "error" | "crawling"
  lastCrawled: string | null
  fields: string[]
  collectedData: CollectedDataItem[]
}

export function MainDataDashboard() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // 샘플 데이터 (실제 구현에서는 API로 대체)
  const [webSources, setWebSources] = useState<WebSourceWithData[]>([
    {
      id: "ws1",
      name: "네이버 뉴스",
      url: "https://news.naver.com",
      status: "active",
      lastCrawled: "2025-01-24T08:30:00Z",
      fields: ["제목", "날짜", "카테고리"],
      collectedData: [
        {
          id: "d1",
          제목: "AI 기술의 새로운 발전",
          날짜: "2025-01-24",
          카테고리: "IT/과학",
        },
        {
          id: "d2",
          제목: "경제 동향 분석",
          날짜: "2025-01-24",
          카테고리: "경제",
        },
        {
          id: "d3",
          제목: "스포츠 경기 결과",
          날짜: "2025-01-24",
          카테고리: "스포츠",
        },
      ],
    },
    {
      id: "ws2",
      name: "쇼핑몰 상품",
      url: "https://example.com/products",
      status: "active",
      lastCrawled: "2025-01-24T09:15:00Z",
      fields: ["상품명", "가격", "평점"],
      collectedData: [
        {
          id: "d4",
          상품명: "무선 이어폰",
          가격: "89,000원",
          평점: "4.5",
        },
        {
          id: "d5",
          상품명: "스마트 워치",
          가격: "249,000원",
          평점: "4.2",
        },
      ],
    },
    {
      id: "ws3",
      name: "부동산 매물",
      url: "https://example.com/realestate",
      status: "active",
      lastCrawled: "2025-01-24T07:45:00Z",
      fields: ["주소", "가격", "면적"],
      collectedData: [
        {
          id: "d6",
          주소: "서울시 강남구 역삼동",
          가격: "12억원",
          면적: "84㎡",
        },
        {
          id: "d7",
          주소: "서울시 서초구 서초동",
          가격: "15억원",
          면적: "102㎡",
        },
      ],
    },
  ])

  // URL 분석 버튼 클릭
  const handleAnalyzeUrl = async () => {
    if (!url) return
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      // URL 정보를 쿼리스트링으로 전달
      router.push(`/analyze?url=${encodeURIComponent(url)}`)
    }, 1200)
  }

  // 상세보기 처리
  const handleViewDetails = (sourceId: string) => {
    console.log("View details for source:", sourceId)
    // 실제 구현에서는 상세 페이지로 이동
    // router.push(`/details/${sourceId}`)
  }

  const showEmptyState = !isLoading && webSources.length === 0

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">웹 데이터 수집 대시보드</h1>
        <p className="text-gray-500">웹사이트에서 데이터를 수집하고 관리하세요</p>
      </div>

      {/* URL Input Section */}
      <Card className="p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="분석할 웹사이트 URL을 입력하세요"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-12 h-12 text-base"
              disabled={isAnalyzing}
            />
          </div>
          <Button onClick={handleAnalyzeUrl} disabled={isAnalyzing || !url} className="h-12 px-8">
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                분석 시작
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Web Sources Data Section */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : showEmptyState ? (
          <EmptyState onAddWebSource={() => router.push("/analyze")} />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">수집된 웹소스 데이터</h2>
              <span className="text-sm text-gray-500">{webSources.length}개의 웹소스</span>
            </div>
            <div className="space-y-6">
              {webSources.map((source) => (
                <WebSourceDataCard 
                  key={source.id} 
                  source={source} 
                  onViewDetails={() => handleViewDetails(source.id)} 
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

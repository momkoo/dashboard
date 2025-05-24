//여기는 메인페이지 웹소스카드별 디자인
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ExternalLink, CheckCircle, XCircle, Clock, Loader2, Eye } from "lucide-react"
import type { WebSourceWithData } from "./main-data-dashboard"

interface WebSourceDataCardProps {
  source: WebSourceWithData
  onViewDetails: () => void
}

export function WebSourceDataCard({ source, onViewDetails }: WebSourceDataCardProps) {
  const getStatusIcon = () => {
    switch (source.status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "inactive":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "crawling":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (source.status) {
      case "active":
        return "수집 중"
      case "inactive":
        return "비활성"
      case "error":
        return "오류"
      case "crawling":
        return "수집 중..."
      default:
        return "알 수 없음"
    }
  }

  const getLastCrawledText = () => {
    if (source.status === "crawling") {
      return "현재 수집 중..."
    }

    if (!source.lastCrawled) {
      return "수집된 적 없음"
    }

    return `${formatDistanceToNow(new Date(source.lastCrawled))} 전 수집`
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg text-gray-900 truncate">{source.name}</h3>
              <Button onClick={onViewDetails} variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                자세히 보기
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="truncate">{source.url}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => window.open(source.url, "_blank")}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                <span>{getStatusText()}</span>
              </div>
              <span className="text-gray-500">{getLastCrawledText()}</span>
              <span className="text-gray-500">{source.collectedData.length}개 데이터</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {source.collectedData.length > 0 ? (
          <div className="space-y-3">
            {source.collectedData.slice(0, 3).map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-3 border">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                  {source.fields.map((field) => (
                    <div key={field} className="flex flex-col">
                      <span className="text-xs text-gray-500 font-medium">{field}:</span>
                      <span className="text-gray-900 truncate">{item[field] || "-"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {source.collectedData.length > 3 && (
              <div className="text-center">
                <Button variant="ghost" size="sm" onClick={onViewDetails} className="text-blue-600">
                  +{source.collectedData.length - 3}개 더 보기
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">아직 수집된 데이터가 없습니다</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

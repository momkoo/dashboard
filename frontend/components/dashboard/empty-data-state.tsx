"use client"

import { Card } from "@/components/ui/card"
import { Database } from "lucide-react"

export function EmptyDataState() {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Database className="h-8 w-8 text-gray-400" />
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-2">저장된 웹소스 데이터가 없습니다</h3>

        <p className="text-gray-500 max-w-md">
          위의 URL 입력창에 웹사이트 주소를 입력하고 "분석 시작" 버튼을 클릭하여 첫 번째 웹소스를 추가해보세요.
        </p>
      </div>
    </Card>
  )
}

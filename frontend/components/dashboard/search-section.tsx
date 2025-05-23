// 검색창 + 분석 시작 버튼
"use client"

export function SearchSection() {
  return (
    <div className="mb-8">
      <div className="flex space-x-2">
        <Input placeholder="분석할 웹사이트 URL 입력" />
        <Button onClick={() => router.push('/analyze')}>
          분석 시작
        </Button>
      </div>
    </div>
  )
}